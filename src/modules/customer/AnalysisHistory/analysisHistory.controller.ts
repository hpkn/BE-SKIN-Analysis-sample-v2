import {
  Controller,
  Body,
  Get,
  Post,
  UseInterceptors,
  UploadedFiles,
  Res,
  Param,
  Query,
} from '@nestjs/common';
import { ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { query, Request, response, Response } from 'express';
import { GetcustomerHistoryDTO } from 'src/common/Dto/customer/analysisHistory/analysisHistory.dto';
import { AnanalysisHistoryService } from './analysisHistory.service';

@Controller('cndpskin')
export class AnanalysisHistoryController {
  constructor(private readonly getAnalysisHistory: AnanalysisHistoryService) {}

  @Get('/:customer_id/analysis-history/')
  async getcustomerHistory(
    // @Body() data: GetcustomerHistoryDTO,
    @Param('customer_id') customer_id: number,
    @Query() query: GetcustomerHistoryDTO,
    @Res() res: Response,
  ) {
    console.log('param', query);
    const result = await this.getAnalysisHistory.GetcustomerHistory(
      customer_id,
      query,
    );

    return res.status(200).send(result);
  }

  @Get('/:customer_id/analysis-history/details')
  async getcustomerHistoryDetail(
    @Body() data: any,
    @Res() res: Response,
    @Query() query: GetcustomerHistoryDTO,
  ) {
    const result = await this.getAnalysisHistory.getcustomerHistoryDetail(
      query,
    );

    return res.status(200).send(result);
  }

  @Get('/:customer_id/analysis-history/analysis-infor')
  async getcustomerAnalysisInfor(@Body() data: any, @Res() res: Response) {}
}
