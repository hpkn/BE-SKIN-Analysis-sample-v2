import {
    Controller,
    Body,
    Get,
    Post,
    UseInterceptors,
    UploadedFile,
    Res,
    Param,
    Query,
    HttpException,
    HttpCode,
} from '@nestjs/common';
import * as celery from 'celery-node';
import { ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { query, Request, response, Response } from 'express';
import { GetcustomerHistoryDTO } from 'src/common/Dto/customer/analysisHistory/analysisHistory.dto';
import { AlgoAnalysisService } from './algoAnalysis.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { AlgoAnalysisDTO } from 'src/common/Dto/analysis/algoAnalysis.dto';
import { v4 as uuidv4 } from 'uuid';
import { promises } from 'dns';

@Controller('analysis')
export class AlgoAnalysisController {
    constructor(private readonly AlgoAnalysis: AlgoAnalysisService) {}
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
        // console.log('here', data);
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
            result = task.applyAsync([originalImage, '/home/ubuntu/repositories/cfa-python/CNDP/files/chart.png']);
        } else if (data.task.taskName === 'CNDP_FitzSG') {
            result = task.applyAsync([originalImage, '/home/ubuntu/repositories/cfa-python/CNDP/files/chart.png']);
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
        let promise1 = new Promise(function (resolve, reject) {
            resolve(res.send({ status: 200, message: 'Success', body: result_ }));
        });

        const saving = await this.AlgoAnalysis.finalSave(data, image, imageRecords, taskResponse, imageArg);
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

    @Post('/history')
    async userAnalysisHistory(@Query() param: any, @Res() res: Response) {
        try {
            let { per, page } = param;
            let offset = (page - 1) * per;

            const result: any = [];
            // await this.AlgoAnalysis.getAnalysisData(batch_id);

            const image: any = [];
            //  await this.AlgoAnalysis.getImageByBatch(batch_id);

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
}

