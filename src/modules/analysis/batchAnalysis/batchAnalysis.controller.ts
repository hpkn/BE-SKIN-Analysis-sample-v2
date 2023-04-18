import {
  Controller,
  Body,
  Query,
  Get,
  Post,
  UseInterceptors,
  UploadedFiles,
  Res,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { BatchAnalysisService } from './batchAnalysis.service';
import { ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request, response, Response } from 'express';
import { FileUploadService } from 'src/common/FileUpload/fileUpload.service';

@Controller('analysis')
export class BatchAnalysisController {
  constructor(
    private readonly batchAnalysis: BatchAnalysisService,
    private readonly fileUpload: FileUploadService,
  ) {}

  @Post('/getBatchId')
  async getBatchId(@Query('customer_id') query: any, @Res() res: Response) {
    try {
      let { customer_id } = query;

      let insertObjet = null;
      const insert = await this.batchAnalysis.insertInAnalysis(
        customer_id,
        insertObjet,
      );

      return res.status(200).json({
        status: 200,
        service: 'getBatchId',
        batch_id: insert,
      });
    } catch (e) {
      throw new Error(e);
    }
  }
}
