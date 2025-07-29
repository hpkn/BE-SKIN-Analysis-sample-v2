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
    UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { query, Request, response, Response } from 'express';
import { GetcustomerHistoryDTO } from 'src/common/Dto/customer/analysisHistory/analysisHistory.dto';
import { AnanalysisHistoryService } from './customerHistory.service';
import { AuthMiddleware } from 'src/common/middleWare/authMiddlware/auth.middleware';
import { BatchIdCheckerDto, countCustomerDto } from 'src/common/Dto/analysis/algoAnalysis.dto';
import { CustomerAnalysisHistoryResponseDto } from 'src/common/Dto/analysis/response.dto';

@ApiTags('History')
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
        const result = await this.getAnalysisHistory.GetcustomerHistory(customer_id, query);

        return res.status(200).send(result);
    }

    @Get('/:customer_id/analysis-history/details')
    async getcustomerHistoryDetail(
        @Res() res: Response,
        @Param('customer_id') customer_id: number,
        @Query() query: GetcustomerHistoryDTO,
    ) {
        const result = await this.getAnalysisHistory.getcustomerHistoryDetail(query);

        return res.status(200).send(result);
    }

    @Get('/:customer_id/analysis-history/analysis-infor')
    @ApiResponse({
        status: 200,
        description: 'Successfully retrieved customer analysis history details.',
        type: CustomerAnalysisHistoryResponseDto,
    })
    // {customer_id: string}
    async getcustomerAnalysisInfor(
        @Query() query: BatchIdCheckerDto,
        @Param('customer_id') customer_id: number,
        @Res() res: Response,
    ) {
        try {
            const { batch_id } = query;
            const result = await this.getAnalysisHistory.analysisInfor(Number(batch_id));
            return res.status(200).send({
                status: 200,
                service: 'Customer Analysis History Details',
                data: result,
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
}

