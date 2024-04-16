import { Controller, Get, Res, Param, Query } from '@nestjs/common';
import { Response } from 'express';
import { WebResultService } from './webResult.service';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('WebResult')
@Controller('web-result')
export class WebResultController {
    constructor(private readonly webResult: WebResultService) {}

    @Get('/cndpskin/:batch_id')
    async getBatchId(
        @Param('batch_id') batch_id: number,
        @Res() res: Response,
        @Query('check') checkExpiration: number,
    ) {
        try {
            const requestDate = await this.webResult.getRequestDate(batch_id);

            if (!requestDate) {
                await this.webResult.addRequestDate(batch_id);
            }

            if (this.webResult.numberToBoolean(Number(checkExpiration))) {
                const isExpired = await this.webResult.checkExpiration(batch_id);
                if (isExpired) {
                    return res.status(410).json({
                        status: 410,
                        message: 'Web result is expired',
                    });
                }
            }

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
