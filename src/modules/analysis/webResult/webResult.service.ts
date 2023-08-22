import { Injectable, Inject, HttpException, ConsoleLogger, BadRequestException } from '@nestjs/common';

import { DatabaseService } from 'src/database/database.service';

@Injectable()
export class WebResultService {
    constructor(private database: DatabaseService) {}

    skinCondition(moistureT: number, moistureU: number, sebumT: number, sebumU: number) {
        let moisture = null;
        if (moistureT !== null || moistureU !== null) {
            moisture = (moistureT + moistureU) / 2;
        }
        let sebum = null;
        if (sebumT !== null || sebumU !== null) {
            sebum = (sebumT + moistureU) / 2;
        }
        return {
            moisture: Math.floor(moisture),
            sebum: Math.floor(sebum),
        };
    }

    check(moisture: number, sebum: number) {
        if ((moisture <= 33 && sebum <= 33) || sebum <= 33 || moisture <= 33) {
            return {
                keyword_value: 'Dry Skin',
                keyword_id: 1,
            }; // 1; //Dry
        } else if (sebum >= 66) {
            return {
                keyword_value: 'Oily Skin',
                keyword_id: 4,
            }; //4; //Oily
        } else if ((sebum <= 34 && sebum <= 66) || sebum !== 50 || moisture !== 50) {
            return {
                keyword_value: 'combination Skin',
                keyword_id: 3,
            }; //3; // combination
        } else if ((moisture === 50 && sebum === 50) || moisture === 50) {
            return {
                keyword_value: 'Normal Skin',
                keyword_id: 2,
            };
        } else {
            return null;
        }
    }
    async webResult(batch_id: number) {
        const result = await this.database.executeQuery(
            `
            WITH _results AS (
                SELECT DISTINCT
                    type_measurements."name" AS measurement,
                    to_json(original_img.scores) ->> 'score' as value, 
                    record.created_time::date as date,
                    record.created_time::time as time,
                    original_img.url AS original_image_url,
                    analyzed_img.url AS analyzed_image_url,
                    ROW_NUMBER() OVER (PARTITION BY type_measurements."name") AS ROW_NUMBER
                FROM
                    analysis record
                    LEFT JOIN measurements as original_img ON record.batch_id = original_img.batch_id  AND original_img.type_image_id = 21 
                    LEFT JOIN type_measurements ON type_measurements.ID = original_img.type_measurement_id 
                    LEFT JOIN measurements as analyzed_img ON record.batch_id = analyzed_img.batch_id AND analyzed_img.type_image_id = 18
                        AND (original_img.args ->> 'nth_analysis' = analyzed_img.args ->> 'nth_analysis' OR type_measurements."name" = 'moistureT' OR type_measurements."name" = 'moistureU') -- Add the join condition here                 
                WHERE
                    record.batch_id = $1 AND (analyzed_img.type_image_id = 18)  
                GROUP by type_measurements."name", original_img.url, analyzed_img.url, original_img.scores, record.created_time, original_img.type_measurement_id
            )
            SELECT
                measurement,
                value,
                date,
                time,
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
                SELECT 
                    round(AVG((to_json(scores) ->> 'score')::numeric),2) as avg, 
                    tp.name as measurement,
                    CASE
                        WHEN round(AVG((to_json(scores) ->> 'score')::numeric),2) BETWEEN 0 AND 6 THEN 'clear'
                        WHEN round(AVG((to_json(scores) ->> 'score')::numeric),2) BETWEEN 6 AND 16 THEN 'Almost Clear'
                        WHEN round(AVG((to_json(scores) ->> 'score')::numeric),2) BETWEEN 16 AND 49 THEN 'Mild'
                        WHEN round(AVG((to_json(scores) ->> 'score')::numeric),2) BETWEEN 49 AND 80 THEN 'Moderate'
                        WHEN round(AVG((to_json(scores) ->> 'score')::numeric),2) BETWEEN 80 AND 100 THEN 'Severe'
                        ELSE NULL -- or any default value if needed
                    END AS keyword_value,
                    CASE
                        WHEN round(AVG((to_json(scores) ->> 'score')::numeric),2) BETWEEN 0 AND 5 THEN 0
                        WHEN round(AVG((to_json(scores) ->> 'score')::numeric),2) BETWEEN 5 AND 15 THEN 1
                        WHEN round(AVG((to_json(scores) ->> 'score')::numeric),2) BETWEEN 15 AND 49 THEN 2
                        WHEN round(AVG((to_json(scores) ->> 'score')::numeric),2) BETWEEN 49 AND 80 THEN 3
                        WHEN round(AVG((to_json(scores) ->> 'score')::numeric),2) BETWEEN 80 AND 100 THEN 4
                        ELSE NULL -- or any default value if needed
                    END AS keyword_id
                FROM measurements as ms
                JOIN type_measurements as tp ON tp."id" = ms.type_measurement_id
                WHERE batch_id = $1 and type_image_id = 21
                GROUP BY tp.name
            `,
            [batch_id],
        );
        return result;
    }
}

