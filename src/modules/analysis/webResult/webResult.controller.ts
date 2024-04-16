import { Controller, Body, Get, Res, Param, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { WebResultService } from './webResult.service';
import { ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';

@ApiTags('WebResult')
@Controller('web-result')
export class WebResultController {
    constructor(private readonly webResult: WebResultService) {}

    @Get('/cndpskin/:batch_id')
    async getBatchId(@Param('batch_id') batch_id: number, @Res() res: Response) {
        try {
            const result = await this.webResult.getBatchId(batch_id);

            return res.status(200).json({
                status: 200,
                service: 'getAnalysisData for WebResult',
                body: result,
            });
        } catch (e) {
            throw new Error(e);
        }
    }
}

