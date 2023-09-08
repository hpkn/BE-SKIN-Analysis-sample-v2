import { Controller, Body, Get, Res, Param } from '@nestjs/common';
import { Response } from 'express';
import { WebResultService } from './webResult.service';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('WebResult')
@Controller('web-result')
export class WebResultController {
    constructor(private readonly webResult: WebResultService) {}

    @Get('/cndpskin/:batch_id')
    async getBatchId(@Param('batch_id') batch_id: number, @Res() res: Response) {
        try {
            const result = await this.webResult.webResult(batch_id);

            const avg = await this.webResult.webResultAverage(batch_id);

            // console.log(result);
            let moistureT = null;
            let moistureU = null;
            let sebumT = null;
            let sebumU = null;

            for (let i = 0; i < result.length; i++) {
                // console.log(result[i]['measurement'] === );
                if (result[i]['measurement'] === 'moistureT' || result[i]['measurement'] === 'moistureU') {
                    result[i]['analyzed_image_url'] = null;
                    result[i]['original_image_url'] = null;
                }

                result[i].value = +result[i].value;
                for (let j = 0; j < avg.length; j++) {
                    if (avg[j].measurement === 'moistureT') moistureT = avg[j].avg;
                    if (avg[j].measurement === 'moistureU') moistureU = avg[j].avg;
                    if (avg[j].measurement === 'sebumT') sebumT = avg[j].avg;
                    if (avg[j].measurement === 'sebumU') sebumU = avg[j].avg;

                    if (result[i]['measurement'] === avg[j].measurement) {
                        result[i]['avg_value'] = parseFloat(avg[i].avg);
                        result[i]['keyword_value'] = avg[i]['keyword_value'];
                        result[i]['keyword_id'] = parseFloat(avg[i].keyword_id);
                    }
                }
            }

            const condition = this.webResult.skinCondition(
                Number(moistureT),
                Number(moistureU),
                Number(sebumT),
                Number(sebumU),
            );
            const conditionResult = this.webResult.check(condition.moisture, condition.sebum);

            if(moistureT !== null || moistureU !== null || sebumT !== null || sebumU !== null){
                result.push({
                    measurement: 'Skin Condition',
                    value: null,
                    date: null,
                    time: null,
                    original_image_url: null,
                    analyzed_image_url: null,
                    avg_value: null,
                    keyword_value: conditionResult.keyword_value,
                    keyword_id: conditionResult.keyword_id,
                });
            }

            return res.status(200).json({
                status: 200,
                service: 'getAnalysisData for WebResult',
                body: result,
            });
        } catch (e) {
            console.log(e);
            throw new Error(e);
        }
    }
}
