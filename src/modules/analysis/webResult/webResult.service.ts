import { Injectable, Inject, HttpException, ConsoleLogger, BadRequestException } from '@nestjs/common';

import { DatabaseService } from 'src/database/database.service';

@Injectable()
export class WebResultService {
    constructor(private database: DatabaseService) {}

    async webResult(batch_id: number) {
        const result = await this.database.executeQuery(
            `
            WITH _results AS (
                SELECT DISTINCT
                    type_measurements."name" AS measurement,
                    to_json ( original_img.scores ) ->> 'score' AS 
                VALUE
                    ,
                    record.created_time :: DATE AS DATE,
                    record.created_time :: TIME AS TIME,
                    original_img.url AS analyzed_image_url,
                    analyzed_img.url AS original_image_url,
                    ROW_NUMBER ( ) OVER ( PARTITION BY type_measurements."name" ) AS ROW_NUMBER 
                FROM
                    analysis record
                    LEFT JOIN measurements AS original_img ON record.batch_id = original_img.batch_id 
                    AND original_img.type_image_id = 21
                    LEFT JOIN type_measurements ON type_measurements.ID = original_img.type_measurement_id
                    LEFT JOIN measurements AS analyzed_img ON record.batch_id = analyzed_img.batch_id 
                    AND analyzed_img.type_image_id = 18 
                    AND ( original_img.args ->> 'nth_analysis' = analyzed_img.args ->> 'nth_analysis' OR type_measurements."name" = 'moistureT' OR type_measurements."name" = 'moistureU') 		
                WHERE
                    record.batch_id = $1 
                    AND ( analyzed_img.type_image_id = 18 OR analyzed_img.type_image_id = 21  ) 
                GROUP BY
                    type_measurements."name",
                    original_img.url,
                    analyzed_img.url,
                    original_img.scores,
                    record.created_time,
                    original_img.type_measurement_id 
                ) SELECT
                measurement,
                
            VALUE
                ,
                DATE,
                TIME,
                original_image_url,
                analyzed_image_url 
            FROM
                _results 
            WHERE
                ROW_NUMBER = 1;
        `,
            [batch_id],
        );
        return result;
    }

    // Check

    async webResultAverage(batch_id: number) {
        const result = await this.database.executeQuery(
            `
            SELECT round(AVG((to_json(scores) ->> 'score')::numeric),2) as avg, tp.name as measurement
            FROM measurements as ms
            JOIN type_measurements as tp ON tp."id" = ms.type_measurement_id
            WHERE batch_id = $1 and type_image_id = 21
            GROUP BY tp.name;;
            `,
            [batch_id],
        );
        return result;
    }
}
