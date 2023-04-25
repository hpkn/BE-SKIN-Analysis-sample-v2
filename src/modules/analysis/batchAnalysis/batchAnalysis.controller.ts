import { Controller, Body, Query, Get, Post, UseInterceptors, UploadedFiles, Res, Param } from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { BatchAnalysisService } from './batchAnalysis.service';
import { ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request, response, Response } from 'express';
import { FileUploadService } from 'src/common/FileUpload/fileUpload.service';

@Controller('analysis')
export class BatchAnalysisController {
    constructor(private readonly batchAnalysis: BatchAnalysisService, private readonly fileUpload: FileUploadService) {}

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
}

