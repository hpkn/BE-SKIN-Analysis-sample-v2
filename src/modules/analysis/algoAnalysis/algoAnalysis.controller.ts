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
} from '@nestjs/common';
import * as celery from 'celery-node';
import { Response } from 'express';
import { AlgoAnalysisService } from './algoAnalysis.service';
import { FileInterceptor, FilesInterceptor, FileFieldsInterceptor } from '@nestjs/platform-express';
import { AlgoAnalysisDTO } from 'src/common/Dto/analysis/algoAnalysis.dto';
import { MoistureUDTO } from 'src/common/Dto/analysis/moistureU.dto';
import { v4 as uuidv4 } from 'uuid';
import { MoistureUService } from 'src/modules/algorithms/moistureU/moistureU.service';
import { MoistureTService } from 'src/modules/algorithms/moistureT/moistureT.service';
import { FileUploadService } from 'src/common/FileUpload/fileUpload.service';
import { SebumUService } from 'src/modules/algorithms/sebumU/sebumU.service';
import { SebumTService } from 'src/modules/algorithms/sebumT/sebumT.service';
import { SkinToneDiorService } from 'src/modules/algorithms/skinToneDior/skinToneDior.service';
import { OfflineDatasDTO } from 'src/common/Dto/analysis/offlineData.dto';
import { AuthMiddleware } from 'src/common/middleWare/authMiddlware/auth.middleware';
import { BatchAnalysisService } from '../batchAnalysis/batchAnalysis.service';
import { ComputationService } from 'src/modules/algorithms/computation/computation.service';
import { multerConfig } from 'src/config/multer.config/multer.config';
import { upload } from '../../../config/multer.config/multer.config';

@Controller('analysis')
@UseGuards(AuthMiddleware)
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
    @Post('')
    @HttpCode(200)
    @UseInterceptors(FileInterceptor('image'))
    async getcustomerHistory(
        @Body() data: AlgoAnalysisDTO,
        @UploadedFile() image: Express.Multer.File,
        @Res() res: Response,
    ) {
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
    @Get('/getAnalysisData/:batch_id')
    async getAnalysisData(@Param('batch_id') batch_id: number, @Res() res: Response) {
        try {
            // let { batch_id } = query;

            const result = await this.AlgoAnalysis.getAnalysisData(batch_id);

            const image = await this.AlgoAnalysis.getImageByBatch(batch_id);

            // console.log(image);
            result['images'] = image;
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
    @Post('/history/')
    async userAnalysisHistory(@Query() param: any, @Res() res: Response, @Body() body: any) {
        console.log('here analysis');
        let { per, page } = param;

        let { customer_id } = body;

        this.AlgoAnalysis.userAnalysisHistory(customer_id, per, page)
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
    @Post('/history/image')
    async userAnalysisImageHistory(@Query() param: any, @Res() res: Response, @Body() body: any) {
        console.log('here analysis');
        let { per, page } = param;

        let { customer_id } = body;
        try {
            const data = await this.AlgoAnalysis.userAnalysisImageHistory(customer_id, per, page);

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
    @Get('/history/result')
    async userAnalysisImageHistoryWithBatchId(@Query() param: any, @Res() res: Response, @Body() body: any) {
        console.log('here analysis');
        let { per, page, batch_id } = param;

        // let { customer_id } = body;
        try {
            const data = await this.AlgoAnalysis.userHistoryWithBatchId(batch_id);

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
    @Post('/moistureU')
    async moistureU(@Query() param: any, @Res() res: Response, @Body() body: MoistureUDTO) {
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
    @Post('/moistureT')
    async moistureT(@Query() param: any, @Res() res: Response, @Body() body: MoistureUDTO) {
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
        @Body() body: MoistureUDTO,
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
    @Post('/sebumT')
    @UseInterceptors(
        FileFieldsInterceptor([
            { name: 'originalImage', maxCount: 1 },
            { name: 'analyzedImage', maxCount: 1 },
        ]),
    )
    async sebumT(
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
    @Post('/skintone-dior')
    @UseInterceptors(
        FileFieldsInterceptor([
            { name: 'image1', maxCount: 1 },
            { name: 'image2', maxCount: 1 },
        ]),
    )
    async skinToneDior(
        @Res() res: Response,
        @Body() body: MoistureUDTO,
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
    @Post('/offline')
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
        @Body() data: OfflineDatasDTO,
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
    @Get('/requestBatchId')
    async getBatchId(@Query() param: any, @Res() res: Response) {
        try {
            let { customer_id } = param;

            console.log('here param', param);
            const insert = await this.batchAnalysis.insertInAnalysis(customer_id);

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

    /*
        CBB
    */
    @UseGuards(AuthMiddleware)
    @Post('cbb')
    @HttpCode(200)
    // @UseInterceptors(FileInterceptor('image'))
    @UseInterceptors(upload.array('images', 5))
    async combinedAnalysisBox(
        @Body() data: AlgoAnalysisDTO,
        @UploadedFile() image: Express.Multer.File[],
        @Res()
        res: Response,
    ) {
        if (!image)
            return res.send({
                status: 40002,
                type: 'BadRequestError',
                message: 'No file!',
            });
        const promises: Promise<any>[] = [];
        const imageResult: any[] = [];
        const finalData: any[] = [];
        const allTaskResponse: any[] = [];
        const allImagArgs: any[] = [];

        data.batch_id = Number(data.batch_id);
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
        for (let i = 0; i < image.length; i++) {
            const imageRecords = uuidv4();
            const originalImage = image[0].buffer.toString('base64');

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

            const result_ = promises.push(this.AlgoAnalysis.finalAnalysis(data, imageRecords, taskResponse, imageArg));
            // const computation = this.computation.computationResult(data.type, data.answers, result_.score);
            // result_.computation_score = computation['computation_score'];
            // result_.questionnaire_score = computation['questionnaire_score'];
            imageResult.push(imageRecords);
            finalData.push(data);
            allTaskResponse.push(taskResponse);
            allImagArgs.push(imageArg);
        }
        const result_ = await Promise.all(promises);

        // result_.computation = computation;
        let promise1 = new Promise(function (resolve, reject) {
            resolve(res.send({ status: 200, message: 'Success', body: result_ }));
        });
        const coputaionResutl: any = {};

        // coputaionResutl.computation_score = computation['computation_score'];
        // coputaionResutl.questionnaire_score = computation['questionnaire_score'];
        // }

        const dataSaving: Promise<any>[] = [];
        for (let i = 0; i < image.length; i++) {
            const saving = dataSaving.push(
                this.AlgoAnalysis.finalSave(
                    coputaionResutl,
                    finalData[i],
                    image[i],
                    imageResult[i],
                    allTaskResponse[i],
                    allImagArgs[i],
                ),
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
    }
}
