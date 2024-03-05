import { Injectable, Inject, HttpException, ConsoleLogger, BadRequestException } from '@nestjs/common';

import { DatabaseService } from 'src/database/database.service';

@Injectable()
export class WebResultService {
    constructor(private database: DatabaseService) {}

    skinCondition(moistureT: number, moistureU: number, sebumT: number, sebumU: number) {
        console.log('chack data', moistureT, moistureU, sebumT, sebumU, sebumU);
        let moisture = null;
        if (moistureT !== null || moistureU !== null) {
            moisture = (Number(moistureT) + Number(moistureU)) / 2;
        }
        let sebum = null;
        if (sebumT !== null || sebumU !== null) {
            sebum = (Number(sebumT) + Number(moistureU)) / 2;
        }
        console.log('check', moisture, sebum);
        return {
            moisture: moisture,
            sebum: sebum,
        };
    }

    check(moisture: number, sebum: number) {
        if ((moisture === null && sebum === null) || moisture === null) {
            return {
                keyword_value: '',
                keyword_id: 0,
            };
        } else if ((moisture <= 33 && sebum <= 33) || moisture <= 33) {
            return {
                keyword_value: 'Dry',
                keyword_id: 1,
            }; // 1; //Dry
        } else if (sebum >= 66) {
            return {
                keyword_value: 'Oily',
                keyword_id: 4,
            }; //4; //Oily
        } else if ((sebum <= 34 && sebum <= 66) || sebum !== 50 || moisture !== 50) {
            return {
                keyword_value: 'Combination',
                keyword_id: 3,
            }; //3; // combination
        } else if ((moisture === 50 && sebum === 50) || moisture === 50) {
            return {
                keyword_value: 'Normal',
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
                    to_json(original_img.scores) ->> 'computation_score' as computation_score,
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
                computation_score,
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
                ROUND(AVG_SCORE, 2) AS avg,
                NAME AS measurement,
                CASE
                    WHEN id IN (16, 17) THEN 
                        CASE 
                            WHEN AVG_SCORE BETWEEN 81 AND 100 THEN 'Very Hydrated'
                            WHEN AVG_SCORE BETWEEN 49 AND 80.99 THEN 'Hydrated'
                            WHEN AVG_SCORE BETWEEN 16 AND 48.99 THEN 'Normal'
                            WHEN AVG_SCORE BETWEEN 7 AND 15.99 THEN 'Dehydrated'
                            WHEN AVG_SCORE BETWEEN 0 AND 5.99 THEN 'Very Dehydrated'
                        END
                    WHEN id IN (9, 5, 15) THEN 
                        CASE 
                            WHEN AVG_SCORE BETWEEN 0 AND 5 THEN 'Very Dry'
                            WHEN AVG_SCORE BETWEEN 5.99 AND 15.99 THEN 'Dry'
                            WHEN AVG_SCORE BETWEEN 16 AND 48.99 THEN 'Normal'
                            WHEN AVG_SCORE BETWEEN 49 AND 80.99 THEN 'Oily'
                            WHEN AVG_SCORE BETWEEN 81 AND 100 THEN 'Very Oily'
                        END
                    ELSE
                        CASE 
                            WHEN AVG_SCORE BETWEEN 0 AND 5 THEN 'Clear'
                            WHEN AVG_SCORE BETWEEN 6 AND 15.99 THEN 'Almost Clear'
                            WHEN AVG_SCORE BETWEEN 16 AND 48.99 THEN 'Mild'
                            WHEN AVG_SCORE BETWEEN 49 AND 80.99 THEN 'Moderate'
                            WHEN AVG_SCORE BETWEEN 81 AND 100 THEN 'Severe'
                            ELSE NULL 
                        END
                END AS keyword_value,
                CASE
                    WHEN id IN (16, 17) THEN 
                        CASE 
                            WHEN AVG_SCORE BETWEEN 81 AND 100 THEN 5
                            WHEN AVG_SCORE BETWEEN 50 AND 80.99 THEN 4
                            WHEN AVG_SCORE BETWEEN 17 AND 48.99 THEN 3
                            WHEN AVG_SCORE BETWEEN 7 AND 15.99 THEN 2
                            WHEN AVG_SCORE BETWEEN 0 AND 6.99 THEN 1
                        END
                    WHEN id IN (9, 5, 15) THEN 
                        CASE 
                            WHEN AVG_SCORE BETWEEN 0 AND 5 THEN 1
                            WHEN AVG_SCORE BETWEEN 5.99 AND 15.99 THEN 2
                            WHEN AVG_SCORE BETWEEN 16 AND 48.99 THEN 3
                            WHEN AVG_SCORE BETWEEN 49 AND 80.99 THEN 4
                            WHEN AVG_SCORE BETWEEN 81 AND 100 THEN 5
                        END
                    ELSE
                        CASE 
                            WHEN AVG_SCORE BETWEEN 0 AND 5 THEN 1
                            WHEN AVG_SCORE BETWEEN 6 AND 15.99 THEN 2
                            WHEN AVG_SCORE BETWEEN 16 AND 48.99 THEN 3
                            WHEN AVG_SCORE BETWEEN 49 AND 80.99 THEN 4
                            WHEN AVG_SCORE BETWEEN 81 AND 100 THEN 5
                            ELSE NULL 
                        END
                END AS keyword_id
            FROM (
                SELECT 
                    tp.NAME as Name,
                    tp."id" as id,
                    COALESCE(ROUND(AVG((to_json(scores)->>'computation_score')::NUMERIC), 2), ROUND(AVG((to_json(scores)->>'score')::NUMERIC), 2)) AS AVG_SCORE
                FROM measurements AS ms
                JOIN type_measurements AS tp ON tp."id" = ms.type_measurement_id 
                WHERE batch_id = $1 AND type_image_id = 21
                GROUP BY tp.NAME, tp."id"
            ) AS subquery;
            `,
            [batch_id],
        );
        return result;
    }

    async getSkinAge(batch_id: number) {
        const result = await this.database.executeQuery(
            `SELECT scores ->> 'skinAge' as skin_age, created_time::date as date, created_time::time as time
            FROM measurements 
            WHERE batch_id = $1 AND type_image_id = 21 AND type_measurement_id = 5`,
            [batch_id],
        );

        return result;
    }
}

