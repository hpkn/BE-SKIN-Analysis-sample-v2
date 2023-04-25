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
} from '@nestjs/common';
import * as celery from 'celery-node';
import { ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { query, Request, response, Response } from 'express';
import { GetcustomerHistoryDTO } from 'src/common/Dto/customer/analysisHistory/analysisHistory.dto';
import { AlgoAnalysisService } from './algoAnalysis.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { AlgoAnalysisDTO } from 'src/common/Dto/analysis/algoAnalysis.dto';
import { v4 as uuidv4 } from 'uuid';

@Controller('analysis')
export class AlgoAnalysisController {
    constructor(private readonly AlgoAnalysis: AlgoAnalysisService) {}

    @Post('')
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

        console.log(task);
        // console.log(task)
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
            console.log(taskResponse.err, 'cndp-skin');
            return res.send({
                status: 40004,
                service: `analysis - ${data.task.taskName}`,
                message: 'Internal server error.',
                error: taskResponse.err,
            });
        }

        const result_ = await this.AlgoAnalysis.finalAnalysis(data, imageRecords, taskResponse);

        res.send({ status: 200, message: 'Success', body: result_ });
        // console.timeEnd('celery');

        console.time('saving');
        const saving = await this.AlgoAnalysis.finalSave(data, image, imageRecords, taskResponse);

        console.timeEnd('saving');

        return saving;
    }
}

