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
    BadRequestException,
    Logger,
} from '@nestjs/common';

import * as celery from 'celery-node';
import { Request, Response } from 'express';
import { AlgoAnalysisService } from './algoAnalysis.service';
import { FileInterceptor, FileFieldsInterceptor } from '@nestjs/platform-express';
import {
    AlgoAnalysisDTO,
    AnalysisCommentDTO,
    BatchIdCheckerDto,
    SkinAgeConditionDto,
    allCustomerDto,
    countCustomerDto,
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
import {
    analysisCBBDTO,
    EncryptedCBBDTO,
    OfflineDataCBBDTO,
    OfflineDatasDTO,
    skinToneDTO,
} from 'src/common/Dto/analysis/offlineData.dto';
import { BatchAnalysisService } from '../batchAnalysis/batchAnalysis.service';
import { ComputationService } from 'src/modules/algorithms/computation/computation.service';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { WebResultService } from '../webResult/webResult.service';
import { AuthMiddleware } from 'src/common/middleWare/authMiddlware/auth.middleware';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

@ApiTags('Analysis')
@Controller('analysis')
// @ApiBearerAuth('access-token')
export class AlgoAnalysisController {
    private readonly logger = new Logger(AlgoAnalysisController.name);
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
        private readonly webResult: WebResultService,
        @InjectQueue('data-queue') private analysisQueue: Queue,
    ) {}
    //
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

    @ApiBearerAuth('access-token')
    @Get('/history/result')
    async userAnalysisImageHistoryWithBatchId(@Query() param: BatchIdCheckerDto, @Res() res: Response) {
        let { batch_id } = param;
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

    @ApiBearerAuth('access-token')
    @ApiConsumes('multipart/form-data')
    @ApiBody({ type: MoistureDTO })
    @Post('/moistureU')
    async moistureU(@Res() res: Response, @Body() body: any) {
        try {
            if (!body?.kHeadSpa) {
                body.kHeadSpa = false;
            }
            if (body?.kHeadSpa === true) {
                const newScore = await this.AlgoAnalysis.kheadSpaCheck(body.batch_id, 'moisture', body.score);
                body.score = newScore?.computationScore ?? body.score;
            }
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

    @ApiBearerAuth('access-token')
    @ApiConsumes('multipart/form-data')
    @ApiBody({ type: MoistureDTO })
    @Post('/moistureT')
    async moistureT(@Res() res: Response, @Body() body: any) {
        try {
            if (!body?.kHeadSpa) {
                body.kHeadSpa = false;
            }

            if (body?.kHeadSpa === true) {
                const newScore = await this.AlgoAnalysis.kheadSpaCheck(body.batch_id, 'moisture', body.score);
                body.score = newScore?.computationScore ?? body.score;
            }

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
            return res.send({
                status: 500,
                type: 'InternalServerError',
                message: 'Internal server error.',
                error: error.message,
            });
        }
    }

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
        @Res() res: Response,
        @Body() body: MoistureDTO,
        @UploadedFiles()
        file: { originalImage: Express.Multer.File[]; analyzedImage: Express.Multer.File[] },
    ) {
        if (!body?.kHeadSpa) {
            body.kHeadSpa = false;
        }
        if (!file['originalImage'][0] || !file['analyzedImage'][0])
            return res.send({ status: 40002, type: 'BadRequestError', message: 'There is no necassary image file!' });

        const imageRecords = uuidv4();

        const originalImage = file.originalImage[0].buffer;
        const analyzedImage = file.analyzedImage[0].buffer;

        const analyzedImageArgs = this.S3Image.getImageArgs('analyzedImage', '', 'sebumU');

        const originalImageArgs = this.S3Image.getImageArgs('originalImage', '', 'sebumU');

        if (body?.kHeadSpa === true || body?.kHeadSpa === 'true') {
            const newScore = await this.AlgoAnalysis.kheadSpaCheck(body.batch_id, 'sebum', body.score);
            body.score = newScore?.computationScore ?? body.score;
        }

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
        if (!body?.kHeadSpa) {
            body.kHeadSpa = false;
        }
        body.batchId = Number(body.batch_id);
        if (!file['originalImage'][0] || !file['analyzedImage'][0])
            return res.send({ status: 40002, type: 'BadRequestError', message: 'There is no necassary image file!' });
        const imageRecords = uuidv4();

        const originalImage = file.originalImage[0].buffer;
        const analyzedImage = file.analyzedImage[0].buffer;

        const analyzedImageArgs = this.S3Image.getImageArgs('analyzedImage', '', 'sebumT');

        const originalImageArgs = this.S3Image.getImageArgs('originalImage', '', 'sebumT');

        if (body?.kHeadSpa === true || body?.kHeadSpa === 'true') {
            const newScore = await this.AlgoAnalysis.kheadSpaCheck(body.batch_id, 'sebum', body.score);
            body.score = newScore?.computationScore ?? body.score;
        }

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

    @ApiBearerAuth('access-token')
    @ApiConsumes('multipart/form-data')
    @Post('/offline')
    @ApiBody({ type: OfflineDatasDTO })
    @UseInterceptors(
        FileFieldsInterceptor([
            { name: 'originalImage', maxCount: 10 },
            { name: 'analyzedImage', maxCount: 10 },
            { name: 'fineImage', maxCount: 10 },
            { name: 'ultraFineImage', maxCount: 10 },
            { name: 'deepImage', maxCount: 10 },
            { name: 'ultraDeepImage', maxCount: 10 },
        ]),
    )
    async offline(
        @Res() res: Response,
        @Body() data: any,
        @UploadedFiles()
        file: {
            analyzedImage: Express.Multer.File[];
            originalImage: Express.Multer.File[];
            fineImage: Express.Multer.File[];
            ultraFineImage: Express.Multer.File[];
            deepImage: Express.Multer.File[];
            ultraDeepImage: Express.Multer.File[];
        },
        @Req() req: Request,
    ) {
        if (!file['analyzedImage'][0] || !file['originalImage'][0])
            return res.send({
                status: 40002,
                type: 'BadRequestError',
                message: 'There is no necassary image file!',
            });

        const analysisTypeNum = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
        const analysisList = [
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

        const checkType = analysisList.includes(data.type) || analysisTypeNum.includes(data.type);

        if (checkType === false) {
            throw new BadRequestException({
                status: 400,
                service: 'Offline Analysis Data saving',
                message: 'Analysis Type is incorrect',
            });
        }
        res.send({
            status: 200,
            service: 'Offline Analysis Data saving',
            message: 'Data saved to the cloud',
        });
        // New Stuff
        setImmediate(async () => {
            const license = data?.licenseId ? Number(data.licenseId) : data.licenseId;
            data.showing_image_flag = license === 5 ? 'true' : false;

            console.log('data.showing_image_flag', data.showing_image_flag);
            const token = req.headers.authorization?.split(' ')[1];

            data.kiosk = this.AlgoAnalysis.checkIfKiosk(token, data);
            data.batchId = Number(data.batchId);
            const imageRecords = uuidv4();

            const analyzedImage = file.analyzedImage[0].buffer;
            const originalImage = file.originalImage[0].buffer;
            const fineImage = file?.fineImage ? file?.fineImage[0]?.buffer : null;
            const ultraFineImage = file?.ultraFineImage ? file?.ultraFineImage[0]?.buffer : null;
            const deepImage = file?.deepImage ? file?.deepImage[0]?.buffer : null;
            const ultraDeepImage = file?.ultraDeepImage ? file?.ultraDeepImage[0]?.buffer : null;

            let imageArg;
            if (/[0-9]/.test(data.type)) {
                imageArg = this.AlgoAnalysis.handleCBBImageArg(data);
            } else {
                imageArg = this.AlgoAnalysis.handleofflineImageArg(data);
            }

            await this.AlgoAnalysis.saveDataFinal(data, imageRecords, imageArg);

            // Save Images asynchronozly
            await this.AlgoAnalysis.saveOfflineImage(
                data,
                originalImage,
                analyzedImage,
                imageArg,
                fineImage,
                ultraFineImage,
                deepImage,
                ultraDeepImage,
            );
        });

        data.batch_id = data.batchId;
        // await this.AlgoAnalysis.updateData(data, '');

        // console.log('Bull');
        // const queue = await this.analysisQueue.add('save-data', {
        //     data,
        //     files: {
        //         analyzedImage: file.analyzedImage[0].buffer,
        //         originalImage: file.originalImage[0].buffer,
        //         fineImage: file?.fineImage?.[0]?.buffer,
        //         ultraFineImage: file?.ultraFineImage?.[0]?.buffer,
        //         deepImage: file?.deepImage?.[0]?.buffer,
        //         ultraDeepImage: file?.ultraDeepImage?.[0]?.buffer,
        //     },
        //     token: req.headers.authorization?.split(' ')[1],
        // });

        // // Log the job information
        // this.logger.log(`Job added with ID: ${queue.id}`);
        // return `Job added with ID: ${queue.id}`;
    }

    @ApiBearerAuth('access-token')
    @Get('/requestBatchId')
    async getBatchId(@Query() param: historyDTO, @Res() res: Response, @Req() req: Request) {
        try {
            let { customer_id } = param;

            // Token From Header
            const token = req.headers.authorization?.split(' ')[1];

            const insert = await this.batchAnalysis.insertInAnalysis(customer_id, token);
            return res.status(200).json({
                status: 200,
                service: 'requestBatchId',
                body: { batch_id: insert },
            });
        } catch (e) {
            throw new Error(e);
        }
    }

    @ApiBearerAuth('access-token')
    @Post('/comment')
    async analysisComment(@Body() bady: AnalysisCommentDTO, @Res() res: Response, @Req() req: Request) {
        try {
            let { batchId, comment } = bady;

            this.batchAnalysis.analysisComment(Number(batchId), comment);

            return res.status(200).json({
                status: 200,
                service: 'analysis/comment',
                respone: 'Comment inserted',
            });
        } catch (e) {
            throw new Error(e);
        }
    }

    @ApiBearerAuth('access-token')
    @Delete('/deleteAnalysisData/:batch_id')
    async deleteBatch(@Param('batch_id') batch_id: number, @Res() res: Response) {
        try {
            const result = await this.batchAnalysis.deleleBatch(batch_id);

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

    /*
        IMAGE UPLOAD CBB
    */
    @ApiOperation({
        summary:
            'CBB offline analysis, Expecting multiple originalImage and analyzedImage. The response will include score average, computation and questionnaire',
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
                        keyWord: { type: 'string', example: 'Mild' },
                        result: {
                            type: 'array',
                            example: [
                                {
                                    batchId: 426416,
                                    algorithm_type: 'wrinkles',
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
                                    fineImage: {
                                        id: 'a336b1eb-8acb-4812-9a84-5164a6dc383c',
                                        url: 'localhost:3100/image/a336b1eb-8acb-4812-9a84-5164a6dc383c',
                                    },
                                    ultraFineImage: {
                                        id: 'd0883ad5-75c3-4963-addf-2b4e7bcaa63e',
                                        url: 'localhost:3100/image/d0883ad5-75c3-4963-addf-2b4e7bcaa63e',
                                    },
                                    deepImage: {
                                        id: '708361a9-2f25-4f65-b2a7-55dd5de232c8',
                                        url: 'localhost:3100/image/708361a9-2f25-4f65-b2a7-55dd5de232c8',
                                    },
                                    ultraDeepImage: {
                                        id: 'ebabcbcb-d536-44be-8e3b-d5234c7ab2a8',
                                        url: 'localhost:3100/image/ebabcbcb-d536-44be-8e3b-d5234c7ab2a8',
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
    @ApiBearerAuth('access-token')
    @Post('offlineCBB')
    @HttpCode(200)
    @UseInterceptors(
        FileFieldsInterceptor([
            { name: 'originalImage', maxCount: 5 },
            { name: 'analyzedImage', maxCount: 5 },
            { name: 'fineImage', maxCount: 5 },
            { name: 'ultraFineImage', maxCount: 5 },
            { name: 'deepImage', maxCount: 5 },
            { name: 'ultraDeepImage', maxCount: 5 },
        ]),
    )
    async offlineBBC(
        @Body() data: any,
        @UploadedFiles()
        files: {
            analyzedImage: Express.Multer.File[];
            originalImage: Express.Multer.File[];
            fineImage: Express.Multer.File[];
            ultraFineImage: Express.Multer.File[];
            deepImage: Express.Multer.File[];
            ultraDeepImage: Express.Multer.File[];
        },
        @Res() res: Response,
        @Req() req: Request,
    ) {
        try {
            const token = req.headers.authorization?.split(' ')[1];

            const validData = this.AlgoAnalysis.preprocessing(data, files, token);

            const result = await this.AlgoAnalysis.offlineCbbOperation(validData, files);

            new Promise(function (resolve, reject) {
                resolve(
                    res.send({
                        status: 200,
                        message: 'Success',
                        body: result,
                    }),
                );
            });

            await this.AlgoAnalysis.updateData(data, '');
        } catch (error) {
            console.error(error);
            throw new HttpException('Internal server error', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @ApiBearerAuth('access-token')
    @Post('/countConsultation')
    async analysisCount(@Body() body: countCustomerDto, @Res() res: Response) {
        try {
            let { customer_ids } = body;

            console.log('here param', body);
            const insert = await this.AlgoAnalysis.countAnalysis(customer_ids);

            return res.status(200).json({
                status: 200,
                service: 'requestBatchId',
                body: { batch_id: insert },
            });
        } catch (e) {
            throw new Error(e);
        }
    }

    @ApiBearerAuth('access-token')
    @Post('/allConsultation')
    async calculateRevisit(@Res() res: Response, @Body() body: allCustomerDto) {
        try {
            let { customer_ids, month } = body;

            const result = await this.AlgoAnalysis.calculateRevisit(customer_ids, month);

            return res.status(200).json({
                status: 200,
                service: 'requestBatchId',
                body: { result: result },
            });
        } catch (e) {
            console.log(e);
        }
    }

    @ApiBearerAuth('access-token')
    @Post('/skinAgeCondition')
    async skinAgeCondition(@Body() body: SkinAgeConditionDto, @Res() res: Response, @Req() req: Request) {
        let { batch_id, bithYear } = body;
        let skinCondition = null;

        try {
            const { spots, wrinkles, moistureT, sebumT, moistureU, sebumU } = await this.AlgoAnalysis.skinAgeOperation(
                Number(batch_id),
            );

            const skinAge = this.computation.skinAge(wrinkles, spots, bithYear);

            // const { moisture, sebum } = this.webResult.skinCondition(moistureT, moistureU, sebumT, sebumU);

            const answers = await this.AlgoAnalysis.fetchQuestion(Number(batch_id));

            let questFr = -1;
            if (answers !== null) {
                questFr = this.computation.questionnaireFrequency(answers, 5);
            }

            this.AlgoAnalysis.checkNullOrStringNull(spots);
            this.AlgoAnalysis.checkNullOrStringNull(wrinkles);
            this.AlgoAnalysis.checkNullOrStringNull(moistureT);
            this.AlgoAnalysis.checkNullOrStringNull(sebumT);
            this.AlgoAnalysis.checkNullOrStringNull(moistureU);
            this.AlgoAnalysis.checkNullOrStringNull(sebumU);

            const obj = { deviceModel: 'device' };
            const token = req.headers.authorization?.split(' ')[1];
            const isKiosk = this.AlgoAnalysis.checkIfKiosk(token, obj);

            if (
                (moistureT !== null && moistureT !== 'null' && parseFloat(moistureT) !== -1) ||
                (sebumT !== null && sebumT !== 'null') ||
                (moistureU !== null && moistureU !== 'null' && parseFloat(moistureU) !== -1) ||
                (sebumU !== null && sebumU !== 'null') ||
                answers?.length > 0
            ) {
                skinCondition = this.webResult.getSkinCondition(moistureT, sebumT, moistureU, sebumU, questFr);
            }

            console.log('isKiosk', isKiosk);
            if (isKiosk) {
                if (moistureU !== null || questFr !== null) {
                    skinCondition = this.webResult.computationSkinConditionKiosk100(moistureU, questFr);
                }
            }

            this.AlgoAnalysis.saveSkinCondtion(Number(batch_id), skinCondition, skinAge);

            return res.status(200).json({
                status: 200,
                message: 'Success',
                service: 'Skin Age & Condition',
                body: {
                    skinAge: skinAge,
                    skinCondition: skinCondition,
                    keyword_id: skinCondition,
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

    // Encrypted CBB
    @ApiOperation({
        summary: 'encryptedCBB, is the version of the CBB accepting encrypted score and decripts them',
        security: [{ bearerToken: [] }],
    })
    @ApiConsumes('multipart/form-data')
    @ApiBody({ type: EncryptedCBBDTO })
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
                        keyWord: { type: 'string', example: 'Mild' },
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
    @ApiBearerAuth('access-token')
    @Post('encryptedCBB')
    @HttpCode(200)
    @UseInterceptors(
        FileFieldsInterceptor([
            { name: 'originalImage', maxCount: 5 },
            { name: 'analyzedImage', maxCount: 5 },
        ]),
    )
    async encryptionCBB(
        @Body() data: any,
        @UploadedFiles() files: { analyzedImage: Express.Multer.File[]; originalImage: Express.Multer.File[] },
        @Res() res: Response,
    ) {
        data.encryptedCBB = true;
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

            data.label = Array.isArray(data.label)
                ? data.label?.map((str: any) => str.trim())
                : data.label?.split(',').map((str: string) => str.trim());

            data.comment = Array.isArray(data.comment)
                ? data.comment?.map((str: string) => str.trim())
                : data.comment?.split(',').map((str: string) => str.trim());

            data.xy_coordinates = Array.isArray(data.xy_coordinates)
                ? data.xy_coordinates?.map((str: string) => str.trim())
                : data.xy_coordinates?.split(',').map((str: string) => str.trim());

            const result = await this.AlgoAnalysis.offlineCbbOperation(data, files);
            new Promise(function (resolve, reject) {
                resolve(
                    res.send({
                        status: 200,
                        message: 'Success',
                        body: {
                            result,
                        },
                    }),
                );
            });

            await this.AlgoAnalysis.updateData(data, '');
        } catch (error) {
            console.error(error);
            throw new HttpException('Internal server error', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @ApiOperation({
        summary:
            'CBB offline analysis, Expecting multiple originalImage and analyzedImage. The response will include score average, computation and questionnaire',
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
                        keyWord: { type: 'string', example: 'Mild' },
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
    @ApiBearerAuth('access-token')
    @Post('kheadspa-cbb')
    @HttpCode(200)
    @UseInterceptors(
        FileFieldsInterceptor([
            { name: 'originalImage', maxCount: 5 },
            { name: 'analyzedImage', maxCount: 5 },
        ]),
    )
    async kheadSpa(
        @Body() data: any,
        @UploadedFiles() files: { analyzedImage: Express.Multer.File[]; originalImage: Express.Multer.File[] },
        @Res() res: Response,
    ) {
        data.kHeadSpa = true;
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

            data.label = Array.isArray(data.label)
                ? data.label?.map((str: any) => str.trim())
                : data.label?.split(',').map((str: string) => str.trim());

            data.comment = Array.isArray(data.comment)
                ? data.comment?.map((str: string) => str.trim())
                : data.comment?.split(',').map((str: string) => str.trim());

            data.xy_coordinates = Array.isArray(data.xy_coordinates)
                ? data.xy_coordinates?.map((str: string) => str.trim())
                : data.xy_coordinates?.split(',').map((str: string) => str.trim());

            if (data.fineScore) {
                data.fineScore = Array.isArray(data.fineScore)
                    ? data.fineScore.map((str: string) => Number(str.trim()))
                    : data.fineScore?.split(',').map((str: string) => Number(str.trim()));
            }

            if (data.ultraFineScore) {
                data.ultraFineScore = Array.isArray(data.ultraFineScore)
                    ? data.ultraFineScore.map((str: string) => Number(str.trim()))
                    : data.ultraFineScore?.split(',').map((str: string) => Number(str.trim()));
            }

            if (data.deepScore) {
                data.deepScore = Array.isArray(data.deepScore)
                    ? data.deepScore.map((str: string) => Number(str.trim()))
                    : data.deepScore?.split(',').map((str: string) => Number(str.trim()));
            }

            if (data.ultraDeepScore) {
                data.ultraDeepScore = Array.isArray(data.ultraDeepScore)
                    ? data.ultraDeepScore.map((str: string) => Number(str.trim()))
                    : data.ultraDeepScore?.split(',').map((str: string) => Number(str.trim()));
            }

            const result = await this.AlgoAnalysis.offlineCbbOperation(data, files);
            new Promise(function (resolve, reject) {
                resolve(
                    res.send({
                        status: 200,
                        message: 'Success',
                        body: result,
                    }),
                );
            });

            await this.AlgoAnalysis.updateData(data, '');
        } catch (error) {
            console.error(error);
            throw new HttpException('Internal server error', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /*
        KIOSK CBB 
    */
    @ApiOperation({
        summary: 'CBB API For Kiosk',
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
                        keyWord: { type: 'string', example: 'Mild' },
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
                                },
                            ],
                        },
                    },
                },
            },
        },
    })
    @ApiBearerAuth('access-token')
    @Post('kiosk-cbb')
    @HttpCode(200)
    @UseInterceptors(
        FileFieldsInterceptor([
            { name: 'originalImage', maxCount: 5 },
            { name: 'analyzedImage', maxCount: 5 },
        ]),
    )
    async kioskCbb(
        @Body() data: any,
        @UploadedFiles() files: { analyzedImage: Express.Multer.File[]; originalImage: Express.Multer.File[] },
        @Res() res: Response,
        @Req() req: Request,
    ) {
        const token = req.headers.authorization?.split(' ')[1];
        data.kiosk = true; // this.AlgoAnalysis.checkIfKiosk(token, data);

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

            if (data.fineScore) {
                data.fineScore = Array.isArray(data.fineScore)
                    ? data.fineScore.map((str: string) => Number(str.trim()))
                    : data.fineScore?.split(',').map((str: string) => Number(str.trim()));
            }

            if (data.ultraFineScore) {
                data.ultraFineScore = Array.isArray(data.ultraFineScore)
                    ? data.ultraFineScore.map((str: string) => Number(str.trim()))
                    : data.ultraFineScore?.split(',').map((str: string) => Number(str.trim()));
            }

            if (data.deepScore) {
                data.deepScore = Array.isArray(data.deepScore)
                    ? data.deepScore.map((str: string) => Number(str.trim()))
                    : data.deepScore?.split(',').map((str: string) => Number(str.trim()));
            }

            if (data.ultraDeepScore) {
                data.ultraDeepScore = Array.isArray(data.ultraDeepScore)
                    ? data.ultraDeepScore.map((str: string) => Number(str.trim()))
                    : data.ultraDeepScore?.split(',').map((str: string) => Number(str.trim()));
            }

            const result = await this.AlgoAnalysis.offlineCbbOperation(data, files);
            new Promise(function (resolve, reject) {
                resolve(
                    res.send({
                        status: 200,
                        message: 'Success',
                        body: result,
                    }),
                );
            });

            await this.AlgoAnalysis.updateData(data, '');
        } catch (error) {
            console.error(error);
            throw new HttpException('Internal server error', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @ApiOperation({
        security: [{ bearerToken: [] }],
    })
    @ApiBearerAuth('access-token')
    @Post('/analysisCBB')
    @ApiBody({ type: analysisCBBDTO })
    @ApiResponse({
        status: 200,
        description: 'Success',
        schema: {
            type: 'object',
            properties: {
                status: { type: 'number', example: 200 },
                message: { type: 'string', example: 'Success' },
                result: {
                    type: 'object',
                    example: {
                        skinAge: 20,
                        moistureT: 13,
                        moistureU: 13,
                        skinCondition: 'dry',
                        keratin: {
                            computation_score: 12,
                            questionnaire_score: 0,
                            keyWord: 'Almost Clear',
                            keyword_id: 2,
                            average: 12,
                        },
                        pores: {
                            computation_score: 12,
                            questionnaire_score: 0,
                            keyWord: 'Almost Clear',
                            keyword_id: 2,
                            average: 12,
                        },
                        impurities: {
                            computation_score: 12,
                            questionnaire_score: 0,
                            keyWord: 'Almost Clear',
                            keyword_id: 2,
                            average: 12,
                        },
                        sebumT: {
                            computation_score: 12,
                            questionnaire_score: 0,
                            keyWord: 'Almost Clear',
                            keyword_id: 2,
                            average: 12,
                        },
                        sebumU: {
                            computation_score: 12,
                            questionnaire_score: 0,
                            keyWord: 'Almost Clear',
                            keyword_id: 2,
                            average: 12,
                        },
                        oiliness: {
                            computation_score: 19.6,
                            questionnaire_score: 50,
                            keyWord: 'Mild',
                            keyword_id: 3,
                            average: 12,
                        },
                        spots: {
                            computation_score: 12,
                            questionnaire_score: 0,
                            keyWord: 'Almost Clear',
                            keyword_id: 2,
                            average: 12,
                        },
                        wrinkles: {
                            computation_score: 12,
                            questionnaire_score: 0,
                            keyWord: 'Almost Clear',
                            keyword_id: 2,
                            average: 12,
                        },
                        redness: {
                            computation_score: 20.200000000000003,
                            questionnaire_score: 53,
                            keyWord: 'Mild',
                            keyword_id: 3,
                            average: 12,
                        },
                    },
                },
            },
        },
    })
    async cbbWithoutImage(@Body() data: any, @Res() res: Response) {
        try {
            if (!data?.batch_id || data?.batch_id === null || data?.batch_id === '') {
                throw new BadRequestException({
                    status: 400,
                    message: 'batch_id is required',
                });
            }
            const result: any = this.AlgoAnalysis.analysisCbb(data);

            let questFr = -1;
            if (data?.answers && data?.answers.length !== 0) {
                questFr = this.computation.questionnaireFrequency(data.answers, 5);
            }

            const skinCondition = this.webResult.getSkinCondition(
                result.moistureT,
                result.sebumT?.computation_score ?? result.sebumT?.average,
                result.moistureU,
                result.sebumU?.computation_score ?? result.sebumU?.average,
                questFr,
            );

            result.skinCondition = skinCondition;

            new Promise(function (resolve, reject) {
                resolve(
                    res.send({
                        status: 200,
                        message: 'Success',
                        body: result,
                    }),
                );
            });

            data.imageUpload = false;
            this.AlgoAnalysis.saveSkinCondtion(Number(data.batch_id), skinCondition, result.skinAge);

            await this.AlgoAnalysis.updateData(data, '');

            const moisture_u: any = {
                batch_id: data.batch_id,
                score: result.moistureU,
                skinAge: result.skinAge,
                skinCondition: skinCondition,
            };
            this.moisture_u.saveData(moisture_u);

            const moisture_t: any = {
                batch_id: data.batch_id,
                score: result.moistureT,
                skinAge: result.skinAge,
                skinCondition: skinCondition,
            };

            this.moisture_t.saveData(moisture_t);
        } catch (error) {
            console.error(error);
            throw new HttpException('Internal server error', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @ApiBearerAuth('access-token')
    @ApiConsumes('multipart/form-data')
    @Post('/skin_tone')
    @ApiBody({ type: skinToneDTO })
    @UseInterceptors(FileFieldsInterceptor([{ name: 'image', maxCount: 10 }]))
    async saveSkinTone(
        @Res() res: Response,
        @Body() data: any,
        @UploadedFiles()
        file: {
            image: Express.Multer.File[];
        },
        @Req() req: Request,
    ) {
        if (!file['image'][0])
            return res.send({
                status: 40002,
                type: 'BadRequestError',
                message: 'There is no necassary image file!',
            });
        data.type = 11;

        data.batchId = Number(data.batchId);

        const result = await this.AlgoAnalysis.saveSkinTone(data, file);
        res.send({
            status: 200,
            service: 'Skin Tone',
            result: result,
        });
        // New Stuff
        // setImmediate(async () => {

        // });
    }
}

