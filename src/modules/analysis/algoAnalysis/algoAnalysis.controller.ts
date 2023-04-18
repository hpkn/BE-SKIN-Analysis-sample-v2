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
} from '@nestjs/common';
import { ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { query, Request, response, Response } from 'express';
import { GetcustomerHistoryDTO } from 'src/common/Dto/customer/analysisHistory/analysisHistory.dto';
import { AlgoAnalysisService } from './algoAnalysis.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { AlgoAnalysisDTO } from 'src/common/Dto/analysis/algoAnalysis.dto';

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

    const result = await this.AlgoAnalysis.finalAnalysis(data, image);

    return res.send({ status: 200, message: 'Success', body: result });
  }
}
