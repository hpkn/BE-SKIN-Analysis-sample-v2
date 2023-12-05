import {
    Controller,
    Body,
    Get,
    Post,
    UseInterceptors,
    UploadedFile,
    UploadedFiles,
    Res,
    Param,
    Query,
    HttpException,
    HttpCode,
    UseGuards,
    Delete,
    Req,
    HttpStatus,
    ConsoleLogger,
} from '@nestjs/common';
import * as celery from 'celery-node';
import e, { Request, Response } from 'express';
import { AlgoAnalysisService } from './algoAnalysis.service';
import { FileInterceptor, FilesInterceptor, FileFieldsInterceptor } from '@nestjs/platform-express';
import {
    AlgoAnalysisCBBDTO,
    AlgoAnalysisDTO,
    BatchIdCheckerDto,
    historyDTO,
    paginationDTO,
} from 'src/common/Dto/analysis/algoAnalysis.dto';
import { MoistureDTO } from 'src/common/Dto/analysis/moisture.dto';
import { v4 as uuidv4 } from 'uuid';
import { MoistureUService } from 'src/modules/algorithms/moistureU/moistureU.service';
import { MoistureTService } from 'src/modules/algorithms/moistureT/moistureT.service';
import { FileUploadService } from 'src/common/FileUpload/fileUpload.service';
import { SebumUService } from 'src/modules/algorithms/sebumU/sebumU.service';
import { SebumTService } from 'src/modules/algorithms/sebumT/sebumT.service';
import { SkinToneDiorService } from 'src/modules/algorithms/skinToneDior/skinToneDior.service';
import { OfflineDataCBBDTO, OfflineDatasDTO } from 'src/common/Dto/analysis/offlineData.dto';
import { AuthMiddleware } from 'src/common/middleWare/authMiddlware/auth.middleware';
import { BatchAnalysisService } from '../batchAnalysis/batchAnalysis.service';
import { ComputationService } from 'src/modules/algorithms/computation/computation.service';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import * as jwt from 'jsonwebtoken';
import * as fs from 'fs';

@ApiTags('Analysis')
@Controller('analysis')
// @UseGuards(AuthMiddleware)
// @ApiBearerAuth('access-token')
export class AlgoAnalysisController {
    constructor(
        private readonly AlgoAnalysis: AlgoAnalysisService,
        private readonly moisture_u: MoistureUService,
        private readonly moisture_t: MoistureTService,
        private readonly sebum_u: SebumUService,
        private readonly sebum_t: SebumTService,
        private readonly S3Image: FileUploadService,
        private readonly diorTone: SkinToneDiorService,
        private readonly batchAnalysis: BatchAnalysisService,
        private readonly computation: ComputationService,
    ) {}

    @UseGuards(AuthMiddleware)
    @ApiBearerAuth('access-token')
    @ApiConsumes('multipart/form-data')
    @ApiOperation({
        summary: 'Single analysis, Expecting a single image per analysis.',
        security: [{ bearerToken: [] }],
    })
    @ApiBody({ type: AlgoAnalysisDTO })
    @Post('')
    @HttpCode(200)
    @UseInterceptors(FileInterceptor('image'))
    async getcustomerHistory(@Body() data: any, @UploadedFile() image: Express.Multer.File, @Res() res: Response) {
        if (!image)
            return res.send({
                status: 40002,
                type: 'BadRequestError',
                message: 'No file!',
            });

        data.batch_id = Number(data.batch_id);
        console.log(data.batch_id);
        const imageRecords = uuidv4();
        const client = celery.createClient('redis://localhost', 'redis://');
        let algoList = [
            'keratin',
            'pores',
            'porphyrin',
            'sebum',
            'shine',
            'spots',
            'skintone',
            'wrinkles',
            'sensitivityscabs',
            'sensitivityscaling',
            'sensitivityredness',
        ];
        if (!algoList.includes(data.type)) {
            throw new HttpException(`We don't have such type of algorithm -> ${data.type}`, 40001);
        }
        // console.time('celery');
        const originalImage = image.buffer.toString('base64');

        data.task = this.AlgoAnalysis.getTaskByAlgoType(data.type);

        const task = client.createTask(data.task.taskName);

        let result: any;

        if (data.task.taskName === 'CNDP_SkinTone') {
            result = task.applyAsync([
                originalImage,
                '/home/ubuntu/backendtestuser/repositories/cfa-python/CNDP/files/chart.png',
            ]);
        } else if (data.task.taskName === 'CNDP_FitzSG') {
            result = task.applyAsync([
                originalImage,
                '/home/ubuntu/backendtestuser/repositories/cfa-python/CNDP/files/chart.png',
            ]);
        } else {
            result = task.applyAsync([originalImage]);
        }

        const taskResponse = await result?.get();

        if (taskResponse.err) {
            // console.log(taskResponse.err, 'cndp-skin');
            return res.send({
                status: 40004,
                service: `analysis - ${data.task.taskName}`,
                message: 'Internal server error.',
                error: taskResponse.err,
            });
        }
        const imageArg = this.AlgoAnalysis.handleImageArg(data);

        const result_ = await this.AlgoAnalysis.finalAnalysis(data, imageRecords, taskResponse, imageArg);
        // const computation = this.computation.computationResult(data.type, data.answers, result_.score);
        // result_.computation_score = computation['computation_score'];
        // result_.questionnaire_score = computation['questionnaire_score'];

        // result_.computation = computation;
        let promise1 = new Promise(function (resolve, reject) {
            resolve(res.send({ status: 200, message: 'Success', body: result_ }));
        });
        const coputaionResutl: any = {};

        // coputaionResutl.computation_score = computation['computation_score'];
        // coputaionResutl.questionnaire_score = computation['questionnaire_score'];
        const saving = await this.AlgoAnalysis.finalSave(
            coputaionResutl,
            data,
            image,
            imageRecords,
            taskResponse,
            imageArg,
        );
        let promise2 = new Promise(function (resolve, resject) {
            resolve(saving);
        });

        promise1
            .then(function (value) {
                return promise2;
            })
            .catch((error) => {
                console.log(error);
                return res.send({
                    status: 500,
                    type: 'InternalServerError',
                    message: 'Internal server error.',
                    error: error.message,
                });
            });
    }

    @UseGuards(AuthMiddleware)
    @ApiBearerAuth('access-token')
    @Get('/getAnalysisData/:batch_id')
    async getAnalysisData(@Param('batch_id') batch_id: number, @Res() res: Response) {
        try {
            const result = await this.AlgoAnalysis.getAnalysisData(batch_id);

            const image = await this.AlgoAnalysis.getImageByBatch(batch_id);

            if (image.length > 0) {
                result['images'] = image;
            }
            return res.status(200).json({
                status: 200,
                service: 'getAnalysisData',
                body: result,
            });
        } catch (error) {
            console.log(error);
            return res.send({
                status: 500,
                type: 'InternalServerError',
                message: 'Internal server error.',
                error: error.message,
            });
        }
    }

    @UseGuards(AuthMiddleware)
    @ApiBearerAuth('access-token')
    @Post('/history/')
    async userAnalysisHistory(@Query() param: paginationDTO, @Res() res: Response, @Body() body: historyDTO) {
        console.log('here analysis');
        let { per, page } = param;

        let { customer_id } = body;

        this.AlgoAnalysis.userAnalysisHistory(Number(customer_id), Number(per), Number(page))
            .then((data) => {
                return res.status(200).json({
                    status: 200,
                    msg: 'Success',
                    service: 'getUserAnalysisHistory',
                    body: {
                        rest_items: data?.length,
                        current_page: page,
                        analysis_list: data,
                    },
                });
            })
            .catch((error) => {
                console.log(error);
                return res.send({
                    status: 500,
                    type: 'InternalServerError',
                    message: 'Internal server error.',
                    error: error.message,
                });
            });
    }

    @UseGuards(AuthMiddleware)
    @ApiBearerAuth('access-token')
    @Post('/history/image')
    async userAnalysisImageHistory(@Query() param: paginationDTO, @Res() res: Response, @Body() body: historyDTO) {
        let { per, page } = param;

        let { customer_id } = body;
        try {
            const data = await this.AlgoAnalysis.userAnalysisImageHistory(
                Number(customer_id),
                Number(per),
                Number(page),
            );

            return res.status(200).json({
                status: 200,
                msg: 'Success',
                service: 'getUserAnalysisImageHistory',
                body: data,
            });
        } catch (error) {
            console.log(error);
            return res.send({
                status: 500,
                type: 'InternalServerError',
                message: 'Internal server error.',
                error: error.message,
            });
        }
    }

    @UseGuards(AuthMiddleware)
    @ApiBearerAuth('access-token')
    @Get('/history/result')
    async userAnalysisImageHistoryWithBatchId(@Query() param: BatchIdCheckerDto, @Res() res: Response) {
        console.log('here analysis');
        let { batch_id } = param;

        // let { customer_id } = body;
        try {
            const data = await this.AlgoAnalysis.userHistoryWithBatchId(Number(batch_id));

            return res.status(200).json({
                status: 200,
                msg: 'Success',
                service: 'getUserAnalysisImageHistory',
                body: data,
            });
        } catch (error) {
            console.log(error);
            return res.send({
                status: 500,
                type: 'InternalServerError',
                message: 'Internal server error.',
                error: error.message,
            });
        }
    }

    @UseGuards(AuthMiddleware)
    @ApiBearerAuth('access-token')
    @ApiConsumes('multipart/form-data')
    @ApiBody({ type: MoistureDTO })
    @Post('/moistureU')
    async moistureU(@Res() res: Response, @Body() body: any) {
        try {
            this.moisture_u.saveData(body);

            return res.status(201).send({
                status: 200,
                service: 'Analysis CNDP SKIN Moisture U',
                body: {
                    batch_id: Number(body.batch_id),
                    args: {
                        score: body.score,
                        raw: body.raw,
                    },
                },
            });
        } catch (error) {
            console.log(error);
            return res.send({
                status: 500,
                type: 'InternalServerError',
                message: 'Internal server error.',
                error: error.message,
            });
        }
    }

    @UseGuards(AuthMiddleware)
    @ApiBearerAuth('access-token')
    @ApiConsumes('multipart/form-data')
    @ApiBody({ type: MoistureDTO })
    @Post('/moistureT')
    async moistureT(@Res() res: Response, @Body() body: any) {
        try {
            this.moisture_t.saveData(body);

            return res.status(201).send({
                status: 200,
                service: 'Analysis CNDP SKIN Moisture T',
                body: {
                    batch_id: Number(body.batch_id),
                    args: {
                        score: body.score,
                        raw: body.raw,
                    },
                },
            });
        } catch (error) {
            console.log(error);
            return res.send({
                status: 500,
                type: 'InternalServerError',
                message: 'Internal server error.',
                error: error.message,
            });
        }
    }

    @UseGuards(AuthMiddleware)
    @ApiBearerAuth('access-token')
    @ApiConsumes('multipart/form-data')
    @ApiBody({ type: MoistureDTO })
    @Post('/sebumU')
    @UseInterceptors(
        FileFieldsInterceptor([
            { name: 'originalImage', maxCount: 1 },
            { name: 'analyzedImage', maxCount: 1 },
        ]),
    )
    async sebumU(
        @Query() param: any,
        @Res() res: Response,
        @Body() body: any,
        @UploadedFiles()
        file: { originalImage: Express.Multer.File[]; analyzedImage: Express.Multer.File[] },
    ) {
        if (!file['originalImage'][0] || !file['analyzedImage'][0])
            return res.send({ status: 40002, type: 'BadRequestError', message: 'There is no necassary image file!' });

        const imageRecords = uuidv4();

        const originalImage = file.originalImage[0].buffer;
        const analyzedImage = file.analyzedImage[0].buffer;

        const analyzedImageArgs = this.S3Image.getImageArgs('analyzedImage', '', 'sebumU');

        const originalImageArgs = this.S3Image.getImageArgs('originalImage', '', 'sebumU');

        await this.sebum_u.saveData(body, analyzedImageArgs, originalImageArgs, imageRecords);

        let promise1 = new Promise(function (resolve, reject) {
            resolve(
                res.send({
                    status: 200,
                    service: 'Analysis CNDP SKIN Sebum U',
                    body: {
                        batch_id: Number(body.batch_id),
                        args: {
                            score: body.score,
                            raw: body.raw,
                        },
                    },
                    originalImage: {
                        id: originalImageArgs.hash,
                        url: originalImageArgs.url,
                    },
                    analyzedImage: {
                        id: analyzedImageArgs.hash,
                        url: analyzedImageArgs.url,
                    },
                }),
            );
        });

        await this.S3Image.uploadImage(analyzedImage, analyzedImageArgs.sys_url);
        const saving = await this.S3Image.uploadImage(originalImage, originalImageArgs.sys_url);
        let promise2 = new Promise(function (resolve, resject) {
            resolve(saving);
        });

        promise1
            .then(function (value) {
                return promise2;
            })
            .catch((error) => {
                console.log(error);
                return res.send({
                    status: 500,
                    type: 'InternalServerError',
                    message: 'Internal server error.',
                    error: error.message,
                });
            });
    }

    @UseGuards(AuthMiddleware)
    @ApiBearerAuth('access-token')
    @ApiConsumes('multipart/form-data')
    @ApiBody({ type: MoistureDTO })
    @Post('/sebumT')
    @UseInterceptors(
        FileFieldsInterceptor([
            { name: 'originalImage', maxCount: 1 },
            { name: 'analyzedImage', maxCount: 1 },
        ]),
    )
    async sebumT(
        @Res() res: Response,
        @Body() body: any,
        @UploadedFiles()
        file: { originalImage: Express.Multer.File[]; analyzedImage: Express.Multer.File[] },
    ) {
        if (!file['originalImage'][0] || !file['analyzedImage'][0])
            return res.send({ status: 40002, type: 'BadRequestError', message: 'There is no necassary image file!' });
        const imageRecords = uuidv4();

        const originalImage = file.originalImage[0].buffer;
        const analyzedImage = file.analyzedImage[0].buffer;

        const analyzedImageArgs = this.S3Image.getImageArgs('analyzedImage', '', 'sebumT');

        const originalImageArgs = this.S3Image.getImageArgs('originalImage', '', 'sebumT');

        await this.sebum_t.saveData(body, analyzedImageArgs, originalImageArgs, imageRecords);

        let promise1 = new Promise(function (resolve, reject) {
            resolve(
                res.send({
                    status: 200,
                    service: 'Analysis CNDP SKIN Sebum T',
                    body: {
                        batch_id: Number(body.batch_id),
                        args: {
                            score: body.score,
                            raw: body.raw,
                        },
                    },
                    originalImage: {
                        id: originalImageArgs.hash,
                        url: originalImageArgs.url,
                    },
                    analyzedImage: {
                        id: analyzedImageArgs.hash,
                        url: analyzedImageArgs.url,
                    },
                }),
            );
        });

        await this.S3Image.uploadImage(analyzedImage, analyzedImageArgs.sys_url);
        const saving = await this.S3Image.uploadImage(originalImage, originalImageArgs.sys_url);
        let promise2 = new Promise(function (resolve, resject) {
            resolve(saving);
        });

        promise1
            .then(function (value) {
                return promise2;
            })
            .catch((error) => {
                return res.send({
                    status: 500,
                    type: 'InternalServerError',
                    message: 'Internal server error.',
                    error: error.message,
                });
            });
    }

    @UseGuards(AuthMiddleware)
    @ApiBearerAuth('access-token')
    @ApiConsumes('multipart/form-data')
    @ApiBody({ type: MoistureDTO })
    @Post('/skintone-dior')
    @UseInterceptors(
        FileFieldsInterceptor([
            { name: 'image1', maxCount: 1 },
            { name: 'image2', maxCount: 1 },
        ]),
    )
    async skinToneDior(
        @Res() res: Response,
        @Body() body: any,
        @UploadedFiles()
        file: { image1: Express.Multer.File[]; image2: Express.Multer.File[] },
    ) {
        try {
            if (!file['image1'][0] || !file['image2'][0])
                return res.send({
                    status: 40002,
                    type: 'BadRequestError',
                    message: 'There is no necassary image file!',
                });

            body.batch_id = Number(body.batch_id);
            const imageRecords = uuidv4();
            const client = celery.createClient('redis://localhost', 'redis://');
            const originalImageFirst = file.image1[0].buffer.toString('base64');
            const originalImageSecond = file.image2[0].buffer.toString('base64');
            body.type = 'skintone_dior';
            body.task = this.AlgoAnalysis.getTaskByAlgoType('skintone_dior');

            const originalImageFirstArgs = this.S3Image.getImageArgs('originalImage', body.type, body.task);

            const originalImageSecondArgs = this.S3Image.getImageArgs('originalImage', body.type, body.task);

            const task = client.createTask(body.task.taskName);

            let result = task.applyAsync([
                originalImageFirst,
                originalImageSecond,
                '/home/backendtestuser/Repositories/cfa-python/CNDP/files/chart.png',
            ]);

            const taskResponse = await result.get();

            if (taskResponse.err) {
                // console.log(taskResponse.err, 'cndp-skin');
                return res.send({
                    status: 40004,
                    service: `analysis - ${body.task.taskName}`,
                    message: 'Internal server error.',
                    error: taskResponse.err,
                });
            }
            const result_ = await this.diorTone.analysis(taskResponse, originalImageFirstArgs, originalImageSecondArgs);
            let promise1 = new Promise(function (resolve, reject) {
                resolve(res.send({ status: 200, message: 'Success', body: result_ }));
            });

            const saving = await this.diorTone.saveData(
                body,
                imageRecords,
                taskResponse,
                originalImageFirst,
                originalImageSecond,
                originalImageFirstArgs,
                originalImageSecondArgs,
            );
            let promise2 = new Promise(function (resolve, resject) {
                resolve(saving);
            });

            promise1
                .then(function (value) {
                    return promise2;
                })
                .catch((error) => {
                    return res.send({
                        status: 500,
                        type: 'InternalServerError',
                        message: 'Internal server error.',
                        error: error.message,
                    });
                });
        } catch (e) {
            console.log(e);
        }
    }

    @UseGuards(AuthMiddleware)
    @ApiBearerAuth('access-token')
    @ApiConsumes('multipart/form-data')
    @Post('/offline')
    @ApiBody({ type: OfflineDatasDTO })
    @UseInterceptors(
        FileFieldsInterceptor([
            { name: 'originalImage', maxCount: 1 },
            { name: 'analyzedImage', maxCount: 1 },
            { name: 'analyzedImageS', maxCount: 1 },
            { name: 'analyzedImageM', maxCount: 1 },
            { name: 'analyzedImageB', maxCount: 1 },
            { name: 'maskImage', maxCount: 1 },
            { name: 'maskImageS', maxCount: 1 },
            { name: 'maskImageM', maxCount: 1 },
            { name: 'maskImageB', maxCount: 1 },
            { name: 'analyzedImageRed', maxCount: 1 },
            { name: 'analyzedImageGreen', maxCount: 1 },
            { name: 'analyzedImageYellow', maxCount: 1 },
            { name: 'analyzedImageOrange', maxCount: 1 },
            { name: 'maskImageYellow', maxCount: 1 },
            { name: 'maskImageOrange', maxCount: 1 },
            { name: 'maskImageGreen', maxCount: 1 },
            { name: 'maskImageBlack', maxCount: 1 },
        ]),
    )
    async offline(
        @Res() res: Response,
        @Body() data: any,
        @UploadedFiles()
        file: { analyzedImage: Express.Multer.File[]; originalImage: Express.Multer.File[] },
    ) {
        try {
            if (!file['analyzedImage'][0] || !file['originalImage'][0])
                return res.send({
                    status: 40002,
                    type: 'BadRequestError',
                    message: 'There is no necassary image file!',
                });

            data.batchId = Number(data.batchId);
            const imageRecords = uuidv4();
            // data.task.algoName = String(data.type);
            // console.log(data);

            const analyzedImage = file.analyzedImage[0].buffer;
            const originalImage = file.originalImage[0].buffer;

            const imageArg = this.AlgoAnalysis.handleofflineImageArg(data);
            await this.AlgoAnalysis.SaveDataFinal(data, imageRecords, imageArg);

            //upload to DB
            let promise1 = new Promise(function (resolve, reject) {
                resolve(
                    res.send({
                        status: 200,
                        service: 'Offline Analysis Data saving',
                        message: 'Data saved to the cloud',
                    }),
                );
            });

            //Upload Images
            const saving = await this.AlgoAnalysis.saveOfflineImage(data, originalImage, analyzedImage, imageArg);

            let promise2 = new Promise(function (resolve, resject) {
                resolve(saving);
            });

            promise1
                .then(function (value) {
                    return promise2;
                })
                .catch((error) => {
                    return res.send({
                        status: 500,
                        type: 'InternalServerError',
                        message: 'Internal server error.',
                        error: error.message,
                    });
                });
        } catch (e) {
            console.log(e);
            return res.send({
                status: 500,
                type: 'InternalServerError',
                message: 'Internal server error.',
                error: e.message,
            });
        }
    }

    @UseGuards(AuthMiddleware)
    @ApiBearerAuth('access-token')
    @Get('/requestBatchId')
    async getBatchId(@Query() param: historyDTO, @Res() res: Response, @Req() req: Request) {
        try {
            let { customer_id } = param;

            const token = req.headers.authorization?.split(' ')[1];
            if (!token) {
                return res.status(403).send({
                    status: 10002,
                    type: 'AuthenticationError',
                    message: {
                        en: 'You are unauthorized, try refreshing the page.',
                    },
                });
            }
            // getting consultant information from Token
            const decoded: any = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

            const args = {
                customer_id: decoded['customer_id'],
                email: decoded['email'],
                app_id: decoded['app_id'],
            };

            const insert = await this.batchAnalysis.insertInAnalysis(customer_id, JSON.stringify(args));

            return res.status(200).json({
                status: 200,
                service: 'requestBatchId',
                body: { batch_id: insert },
            });
        } catch (e) {
            throw new Error(e);
        }
    }

    @UseGuards(AuthMiddleware)
    @ApiBearerAuth('access-token')
    @Delete('/deleteAnalysisData/:batch_id')
    async deleteBatch(@Param('batch_id') batch_id: number, @Res() res: Response) {
        try {
            const result = await this.batchAnalysis.deleleBatch(batch_id);
            console.log(result);
            return res.status(200).json({
                status: 200,
                type: 'DeleteAnalysisData',
                message: 'Successfully Deleted.',
            });
        } catch (error) {
            console.log(error);
            return res.send({
                status: 500,
                type: 'InternalServerError',
                message: 'Internal server error.',
                error: error.message,
            });
        }
    }

    @ApiOperation({
        summary:
            'CBB analysis, Expecting multiple image in the same request. The response will include score average, computation and questionnaire result and an array with result for images',
        security: [{ bearerToken: [] }],
    })
    @ApiConsumes('multipart/form-data')
    @ApiBody({ type: AlgoAnalysisCBBDTO })
    @ApiResponse({
        status: 200,
        description: 'Success',
        schema: {
            type: 'object',
            properties: {
                status: { type: 'number', example: 200 },
                service: { type: 'string', example: 'Success' },
                body: {
                    type: 'object',
                    properties: {
                        computation_score: { type: 'number', example: 56.4 },
                        questionnaire_score: { type: 'number', example: 70.0 },
                        score_average: { type: 'number', example: 53.33 },
                        result: {
                            type: 'array',
                            example: [
                                {
                                    batchId: 426416,
                                    algorithm_type: 'spots',
                                    ver: 'CDS_SP_2.1.2',
                                    score: 60,
                                    analyzedImage: {
                                        id: '9d013def-5dc5-4779-869b-86f844fa6dd8',
                                        url: 'staging.chowis.cloud:3444/image/9d013def-5dc5-4779-869b-86f844fa6dd8',
                                    },
                                    originalImage: {
                                        id: '4ee67b15-e06e-4280-a169-fef29bc9ec4d',
                                        url: 'staging.chowis.cloud:3444/image/4ee67b15-e06e-4280-a169-fef29bc9ec4d',
                                    },
                                    maskImage: {
                                        id: '29e0ea4a-e989-4ef9-b8b7-c4100b9650fe',
                                        url: 'staging.chowis.cloud:3444/image/29e0ea4a-e989-4ef9-b8b7-c4100b9650fe',
                                    },
                                },
                                {
                                    batchId: 426416,
                                    algorithm_type: 'spots',
                                    ver: 'CDS_SP_2.1.2',
                                    score: 56,
                                    analyzedImage: {
                                        id: '9d013def-5dc5-4779-869b-86f844fa6dd8',
                                        url: 'staging.chowis.cloud:3444/image/9d013def-5dc5-4779-869b-86f844fa6dd8',
                                    },
                                    originalImage: {
                                        id: '4ee67b15-e06e-4280-a169-fef29bc9ec4d',
                                        url: 'staging.chowis.cloud:3444/image/4ee67b15-e06e-4280-a169-fef29bc9ec4d',
                                    },
                                    maskImage: {
                                        id: '29e0ea4a-e989-4ef9-b8b7-c4100b9650fe',
                                        url: 'staging.chowis.cloud:3444/image/29e0ea4a-e989-4ef9-b8b7-c4100b9650fe',
                                    },
                                },
                            ],
                        },
                    },
                },
            },
        },
    })
    @UseGuards(AuthMiddleware)
    @ApiBearerAuth('access-token')
    @Post('cbb')
    @HttpCode(200)
    @UseInterceptors(FileFieldsInterceptor([{ name: 'image', maxCount: 5 }]))
    async combinedAnalysisBox(
        @Body() data: any,
        @UploadedFiles() files: { image: Express.Multer.File[] },
        @Res() res: Response,
    ) {
        try {
            if (!files?.image) {
                return res.status(HttpStatus.BAD_REQUEST).send({
                    status: 40002,
                    type: 'BadRequestError',
                    message: 'No file!',
                });
            }
            const algoList = [
                'keratin',
                'pores',
                'porphyrin',
                'sebum',
                'shine',
                'spots',
                'skintone',
                'wrinkles',
                'sensitivityscabs',
                'sensitivityscaling',
                'sensitivityredness',
            ];

            if (!algoList.includes(data.type)) {
                throw new HttpException(`We don't have such type of algorithm -> ${data.type}`, HttpStatus.BAD_REQUEST);
            }

            const client = celery.createClient('redis://localhost', 'redis://');

            data.batch_id = Number(data.batch_id);
            const computaionResutlt = {};

            const taskResults = await Promise.all(
                files.image.map(async (image) => {
                    const originalImage = image.buffer.toString('base64');
                    data.task = this.AlgoAnalysis.getTaskByAlgoType(data.type);
                    const task = client.createTask(data.task.taskName);
                    let result: any;

                    if (data.task.taskName === 'CNDP_SkinTone' || data.task.taskName === 'CNDP_FitzSG') {
                        result = await task.applyAsync([
                            originalImage,
                            '/home/ubuntu/backendtestuser/repositories/cfa-python/CNDP/files/chart.png',
                        ]);
                    } else {
                        result = await task.applyAsync([originalImage]);
                    }

                    result = await result.get();
                    if (result.err) {
                        throw new HttpException('Internal server error.', HttpStatus.INTERNAL_SERVER_ERROR);
                    }

                    return result;
                }),
            );

            // console.log(taskResults);

            const analysisPromise: Promise<any>[] = [];
            const savingPromise: Promise<any>[] = [];
            const scores: number[] = [];
            let sum = 0;

            taskResults.forEach((taskResult, count) => {
                sum += taskResult.score;
                scores.push(taskResult.score);
                const imageRecords = uuidv4();
                const imageArg = this.AlgoAnalysis.handleImageArg(data);

                analysisPromise.push(this.AlgoAnalysis.finalAnalysis(data, imageRecords, taskResult, imageArg));

                const savingData = this.AlgoAnalysis.finalSave(
                    computaionResutlt,
                    data,
                    files.image[count],
                    imageRecords,
                    taskResult,
                    imageArg,
                );
                savingPromise.push(savingData);
            });

            const result = await Promise.all(analysisPromise);

            const computation = this.computation.computationResult(data.type, data.answers, scores);
            let promise1 = new Promise(function (resolve, reject) {
                resolve(
                    res.send({
                        status: 200,
                        message: 'Success',
                        body: {
                            result,
                            computation_score: computation['computation_score'].toFixed(2),
                            questionnaire_score: computation['questionnaire_score'].toFixed(2),
                            score_average: (sum / scores.length).toFixed(2),
                        },
                    }),
                );
            });

            await Promise.all(savingPromise);
        } catch (error) {
            console.error(error);
            throw new HttpException('Internal server error', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // CBB offline analysis

    @ApiOperation({
        summary:
            'CBB analysis, Expecting multiple image in the same request. The response will include score average, computation and questionnaire result and an array with result for images',
        security: [{ bearerToken: [] }],
    })
    @ApiConsumes('multipart/form-data')
    @ApiBody({ type: OfflineDataCBBDTO })
    @ApiResponse({
        status: 200,
        description: 'Success',
        schema: {
            type: 'object',
            properties: {
                status: { type: 'number', example: 200 },
                service: { type: 'string', example: 'Success' },
                body: {
                    type: 'object',
                    properties: {
                        computation_score: { type: 'number', example: 56.4 },
                        questionnaire_score: { type: 'number', example: 70.0 },
                        score_average: { type: 'number', example: 53.33 },
                        result: {
                            type: 'array',
                            example: [
                                {
                                    batchId: 426416,
                                    algorithm_type: 'spots',
                                    // ver: 'CDS_SP_2.1.2',
                                    score: 60,
                                    analyzedImage: {
                                        id: '9d013def-5dc5-4779-869b-86f844fa6dd8',
                                        url: 'staging.chowis.cloud:3444/image/9d013def-5dc5-4779-869b-86f844fa6dd8',
                                    },
                                    originalImage: {
                                        id: '4ee67b15-e06e-4280-a169-fef29bc9ec4d',
                                        url: 'staging.chowis.cloud:3444/image/4ee67b15-e06e-4280-a169-fef29bc9ec4d',
                                    },
                                    // maskImage: {
                                    //     id: '29e0ea4a-e989-4ef9-b8b7-c4100b9650fe',
                                    //     url: 'staging.chowis.cloud:3444/image/29e0ea4a-e989-4ef9-b8b7-c4100b9650fe',
                                    // },
                                },
                                {
                                    batchId: 426416,
                                    algorithm_type: 'spots',
                                    // ver: 'CDS_SP_2.1.2',
                                    score: 56,
                                    analyzedImage: {
                                        id: '9d013def-5dc5-4779-869b-86f844fa6dd8',
                                        url: 'staging.chowis.cloud:3444/image/9d013def-5dc5-4779-869b-86f844fa6dd8',
                                    },
                                    originalImage: {
                                        id: '4ee67b15-e06e-4280-a169-fef29bc9ec4d',
                                        url: 'staging.chowis.cloud:3444/image/4ee67b15-e06e-4280-a169-fef29bc9ec4d',
                                    },
                                    // maskImage: {
                                    //     id: '29e0ea4a-e989-4ef9-b8b7-c4100b9650fe',
                                    //     url: 'staging.chowis.cloud:3444/image/29e0ea4a-e989-4ef9-b8b7-c4100b9650fe',
                                    // },
                                },
                            ],
                        },
                    },
                },
            },
        },
    })
    @UseGuards(AuthMiddleware)
    @ApiBearerAuth('access-token')
    @Post('cbBoxSaving')
    @HttpCode(200)
    @UseInterceptors(
        FileFieldsInterceptor([
            { name: 'originalImage', maxCount: 5 },
            { name: 'analyzedImage', maxCount: 5 },
        ]),
    )
    async offlineBBC(
        @Body() data: any,
        @UploadedFiles() files: { analyzedImage: Express.Multer.File[]; originalImage: Express.Multer.File[] },
        @Res() res: Response,
    ) {
        try {
            if (!files?.analyzedImage || !files?.originalImage) {
                return res.status(HttpStatus.BAD_REQUEST).send({
                    status: 40002,
                    type: 'BadRequestError',
                    message: 'No file!',
                });
            }

            if (files?.analyzedImage.length !== files?.originalImage.length) {
                return res.status(HttpStatus.BAD_REQUEST).send({
                    status: 40002,
                    type: 'BadRequestError',
                    message: 'The number of analyzed images does not match number of original images',
                });
            }
            const algoList = [
                'keratin',
                'pores',
                'porphyrin',
                'sebum',
                'shine',
                'spots',
                'skintone',
                'wrinkles',
                'sensitivityscabs',
                'sensitivityscaling',
                'sensitivityredness',
            ];

            if (!algoList.includes(data.type)) {
                throw new HttpException(`We don't have such type of algorithm -> ${data.type}`, HttpStatus.BAD_REQUEST);
            }

            const algoId = await this.AlgoAnalysis.getAlgoID(data.type);

            data.batch_id = Number(data.batch_id);
            data.task = this.AlgoAnalysis.getTaskByAlgoType(data.type);

            const analyzed: any[] = [];
            const original: any[] = [];
            const retunAnalyzed: any[] = [];
            const returnOriginal: any[] = [];
            const scores: number[] = JSON.parse(data.args).score;
            const savingPromise: Promise<any>[] = [];

            let sum = 0;
            const imageRecords = uuidv4();
            const computation = this.computation.computationResult(data.type, data.answers, scores);

            for (let i = 0; i < files.analyzedImage?.length; i++) {
                sum += scores[1];
                const imageArg = this.AlgoAnalysis.handleImageArg(data);
                analyzed.push([
                    data.batch_id,
                    imageArg.analyzedImageArgs.url,
                    imageArg.analyzedImageArgs.sys_url,
                    imageArg.analyzedImageArgs.hash,
                    algoId[0]['id'],
                    18,
                    JSON.stringify({
                        nth_analysis: imageRecords,
                    }),
                    0,
                ]);

                original.push([
                    data.batch_id,
                    imageArg.originalImageArgs.url,
                    imageArg.originalImageArgs.sys_url,
                    imageArg.originalImageArgs.hash,
                    algoId[0]['id'],
                    21,
                    JSON.stringify({
                        nth_analysis: imageRecords,
                    }),
                    JSON.stringify({
                        score: JSON.parse(data.args).score[i],
                        raw: JSON.parse(data.args).raw[i],
                        computation_score: computation['computation_score'].toFixed(2),
                        questionnaire_score: computation['questionnaire_score'].toFixed(2),
                        score_average: (sum / scores.length).toFixed(2),
                    }),
                ]);

                //  Image saving
                const savingData = this.AlgoAnalysis.offlineCBBSaveImage(
                    files?.originalImage[i].buffer,
                    files?.analyzedImage[i].buffer,
                    imageArg,
                    data,
                );
                savingPromise.push(savingData);
            }

            const saveOriginal = original.map((item) => {
                returnOriginal.push({
                    batchId: data.batch_id,
                    algorithm_type: data.type,
                    score: JSON.parse(item[7]).score,
                    originalImage: {
                        id: item[3],
                        url: item[1],
                    },
                });
                return {
                    batch_id: item[0],
                    url: item[1],
                    sys_url: item[2],
                    hash: item[3],
                    type_measurement_id: item[4],
                    type_image_id: item[5],
                    args: item[6],
                    scores: item[7],
                };
            });
            //return original

            const saveAnalyzed = analyzed.map((item) => {
                retunAnalyzed.push({
                    analyzedImage: {
                        id: item[3],
                        url: item[1],
                    },
                });
                return {
                    batch_id: item[0],
                    url: item[1],
                    sys_url: item[2],
                    hash: item[3],
                    type_measurement_id: item[4],
                    type_image_id: item[5],
                    args: item[6],
                    scores: item[7],
                };
            });

            const newArray = returnOriginal.map((item, index) => {
                return {
                    ...item,
                    analyzedImage: retunAnalyzed[index].analyzedImage,
                };
            });

            const savedResult = [...saveAnalyzed, ...saveOriginal];

            this.AlgoAnalysis.offlineCBBSaveData(imageRecords, savedResult);

            let promise1 = new Promise(function (resolve, reject) {
                resolve(
                    res.send({
                        status: 200,
                        message: 'Success',
                        body: {
                            computation_score: computation['computation_score'].toFixed(2),
                            questionnaire_score: computation['questionnaire_score'].toFixed(2),
                            score_average: (sum / scores.length).toFixed(2),
                            result: [...newArray],
                        },
                    }),
                );
            });

            await Promise.all(savingPromise).catch((e) => {
                Promise.all(savingPromise).catch((e) => {
                    fs.appendFile('error.log', this.AlgoAnalysis.getErrorLog(data.barch_id), 'utf8', (err) => {
                        if (err) throw err;
                    });
                });
            });
            await this.AlgoAnalysis.updateData(data, imageRecords);
        } catch (error) {
            console.error(error);
            throw new HttpException('Internal server error', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
