import { GoneException, Injectable } from '@nestjs/common';

import { DatabaseService } from 'src/database/database.service';
import { AlgoAnalysisService } from '../algoAnalysis/algoAnalysis.service';
import { ComputationService } from 'src/modules/algorithms/computation/computation.service';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class WebResultService {
    constructor(
        private database: DatabaseService,
        private readonly AlgoAnalysis: AlgoAnalysisService,
        private readonly computation: ComputationService,
        private readonly httpService: HttpService,
    ) {}

    getSkinCondition(mScoreT: number, sScoreT: number, mScoreU: number, sScoreU: number, sebumQAScore: number) {
        const veryDry = 1;
        const dry = 2;
        const normal = 3;
        const oily = 4;
        const veryOily = 5;
        const combination = 6;

        let tZoneType = 0;
        let uZoneType = 0;
        let skinCondition = 0;

        if (sebumQAScore >= 0 && sScoreT > 0) {
            sScoreT = Math.round(0.8 * sScoreT + 0.2 * sebumQAScore);
        }

        // Logic for determining skin condition
        // ...
        // Combine t-zone sebum score with sebum Q&A score.
        if (sebumQAScore >= 0 && sScoreT === null) {
            sScoreT = Math.round(sebumQAScore);
        }

        // ---------- (1) ----------
        // When either one of the mositure scores is not available, we define skin/scalp condition with sebum scores.
        // -- This should only apply to CMA Hair, HH/CHP Hair where moisture measurement is not accurate.
        if (mScoreT == -1 || mScoreU == -1) {
            if (sScoreU >= 0 && sScoreU < 6) {
                if (sScoreT >= 0 && sScoreT < 6) skinCondition = veryDry;
                if (sScoreT >= 6 && sScoreT < 16) skinCondition = dry;
                if (sScoreT >= 16 && sScoreT < 49) skinCondition = dry;
                if (sScoreT >= 49 && sScoreT < 81) skinCondition = combination;
                if (sScoreT >= 81 && sScoreT <= 99) skinCondition = combination;
            }
            if (sScoreU >= 6 && sScoreU < 16) {
                if (sScoreT >= 0 && sScoreT < 6) skinCondition = dry;
                if (sScoreT >= 6 && sScoreT < 16) skinCondition = dry;
                if (sScoreT >= 16 && sScoreT < 49) skinCondition = dry;
                if (sScoreT >= 49 && sScoreT < 81) skinCondition = combination;
                if (sScoreT >= 81 && sScoreT <= 99) skinCondition = combination;
            }
            if (sScoreU >= 16 && sScoreU < 49) {
                if (sScoreT >= 0 && sScoreT < 6) skinCondition = dry;
                if (sScoreT >= 6 && sScoreT < 16) skinCondition = dry;
                if (sScoreT >= 16 && sScoreT < 49) skinCondition = normal;
                if (sScoreT >= 49 && sScoreT < 81) skinCondition = oily;
                if (sScoreT >= 81 && sScoreT <= 99) skinCondition = oily;
            }
            if (sScoreU >= 49 && sScoreU < 81) {
                if (sScoreT >= 0 && sScoreT < 6) skinCondition = combination;
                if (sScoreT >= 6 && sScoreT < 16) skinCondition = combination;
                if (sScoreT >= 16 && sScoreT < 49) skinCondition = oily;
                if (sScoreT >= 49 && sScoreT < 81) skinCondition = oily;
                if (sScoreT >= 81 && sScoreT <= 99) skinCondition = oily;
            }
            if (sScoreU >= 81 && sScoreU <= 99) {
                if (sScoreT >= 0 && sScoreT < 6) skinCondition = combination;
                if (sScoreT >= 6 && sScoreT < 16) skinCondition = combination;
                if (sScoreT >= 16 && sScoreT < 49) skinCondition = oily;
                if (sScoreT >= 49 && sScoreT < 81) skinCondition = oily;
                if (sScoreT >= 81 && sScoreT <= 99) skinCondition = veryOily;
            }
        }

        // ---------- (2) ---------
        // When both moisture scores and both sebum scores are available.
        // obtain T-zone skin/scalp type.
        if (mScoreT >= 0 && mScoreT < 6) {
            if (sScoreT >= 0 && sScoreT < 6) tZoneType = veryDry;
            if (sScoreT >= 6 && sScoreT < 16) tZoneType = dry;
            if (sScoreT >= 16 && sScoreT < 49) tZoneType = dry;
            if (sScoreT >= 49 && sScoreT < 81) tZoneType = oily;
            if (sScoreT >= 81 && sScoreT <= 99) tZoneType = veryOily;
        }

        if (mScoreT >= 6 && mScoreT < 16) {
            if (sScoreT >= 0 && sScoreT < 6) tZoneType = dry;
            if (sScoreT >= 6 && sScoreT < 16) tZoneType = dry;
            if (sScoreT >= 16 && sScoreT < 49) tZoneType = dry;
            if (sScoreT >= 49 && sScoreT < 81) tZoneType = oily;
            if (sScoreT >= 81 && sScoreT <= 99) tZoneType = veryOily;
        }

        if (mScoreT >= 16 && mScoreT < 49) {
            if (sScoreT >= 0 && sScoreT < 6) tZoneType = dry;
            if (sScoreT >= 6 && sScoreT < 16) tZoneType = normal;
            if (sScoreT >= 16 && sScoreT < 49) tZoneType = normal;
            if (sScoreT >= 49 && sScoreT < 81) tZoneType = oily; // Here
            if (sScoreT >= 81 && sScoreT <= 99) tZoneType = veryOily;
        }
        //
        if (mScoreT >= 49 && mScoreT < 81) {
            if (sScoreT >= 0 && sScoreT < 6) tZoneType = normal;
            if (sScoreT >= 6 && sScoreT < 16) tZoneType = normal;
            if (sScoreT >= 16 && sScoreT < 49) tZoneType = normal;
            if (sScoreT >= 49 && sScoreT < 81) tZoneType = oily;
            if (sScoreT >= 81 && sScoreT <= 99) tZoneType = veryOily;
        }
        if (mScoreT >= 81 && mScoreT <= 99) {
            if (sScoreT >= 0 && sScoreT < 6) tZoneType = normal;
            if (sScoreT >= 6 && sScoreT < 16) tZoneType = normal;
            if (sScoreT >= 16 && sScoreT < 49) tZoneType = normal;
            if (sScoreT >= 49 && sScoreT < 81) tZoneType = oily;
            if (sScoreT >= 81 && sScoreT <= 99) tZoneType = veryOily;
        }

        // define U-zone skin/scalp type.
        if (mScoreU >= 0 && mScoreU < 6) {
            if (sScoreU >= 0 && sScoreU < 6) uZoneType = veryDry;
            if (sScoreU >= 6 && sScoreU < 16) uZoneType = dry;
            if (sScoreU >= 16 && sScoreU < 49) uZoneType = dry;
            if (sScoreU >= 49 && sScoreU < 81) uZoneType = oily;
            if (sScoreU >= 81 && sScoreU <= 99) uZoneType = veryOily;
        }
        if (mScoreU >= 6 && mScoreU < 16) {
            if (sScoreU >= 0 && sScoreU < 6) uZoneType = dry;
            if (sScoreU >= 6 && sScoreU < 16) uZoneType = dry;
            if (sScoreU >= 16 && sScoreU < 49) uZoneType = dry;
            if (sScoreU >= 49 && sScoreU < 81) uZoneType = oily;
            if (sScoreU >= 81 && sScoreU <= 99) uZoneType = veryOily;
        }
        if (mScoreU >= 16 && mScoreU < 49) {
            if (sScoreU >= 0 && sScoreU < 6) uZoneType = dry;
            if (sScoreU >= 6 && sScoreU < 16) uZoneType = normal;
            if (sScoreU >= 16 && sScoreU < 49) uZoneType = normal;
            if (sScoreU >= 49 && sScoreU < 81) uZoneType = oily; // Here for Uzone
            if (sScoreU >= 81 && sScoreU <= 99) uZoneType = veryOily;
        }
        if (mScoreU >= 49 && mScoreU < 81) {
            if (sScoreU >= 0 && sScoreU < 6) uZoneType = normal;
            if (sScoreU >= 6 && sScoreU < 16) uZoneType = normal;
            if (sScoreU >= 16 && sScoreU < 49) uZoneType = normal;
            if (sScoreU >= 49 && sScoreU < 81) uZoneType = oily;
            if (sScoreU >= 81 && sScoreU <= 99) uZoneType = veryOily;
        }
        if (mScoreU >= 81 && mScoreU <= 99) {
            if (sScoreU >= 0 && sScoreU < 6) uZoneType = normal;
            if (sScoreU >= 6 && sScoreU < 16) uZoneType = normal;
            if (sScoreU >= 16 && sScoreU < 49) uZoneType = normal;
            if (sScoreU >= 49 && sScoreU < 81) uZoneType = oily;
            if (sScoreU >= 81 && sScoreU <= 99) uZoneType = veryOily;
        }

        // Conclude final skin/scalp condition.
        if (tZoneType == veryDry) {
            if (uZoneType == veryDry) skinCondition = veryDry;
            if (uZoneType == dry) skinCondition = dry;
            if (uZoneType == normal) skinCondition = dry;
            if (uZoneType == oily) skinCondition = combination;
            if (uZoneType == veryOily) skinCondition = combination;
        }
        if (tZoneType == dry) {
            if (uZoneType == veryDry) skinCondition = dry;
            if (uZoneType == dry) skinCondition = dry;
            if (uZoneType == normal) skinCondition = dry;
            if (uZoneType == oily) skinCondition = combination;
            if (uZoneType == veryOily) skinCondition = combination;
        }
        if (tZoneType == normal) {
            if (uZoneType == veryDry) skinCondition = dry;
            if (uZoneType == dry) skinCondition = dry;
            if (uZoneType == normal) skinCondition = normal;
            if (uZoneType == oily) skinCondition = oily;
            if (uZoneType == veryOily) skinCondition = oily;
        }
        if (tZoneType == oily) {
            if (uZoneType == veryDry) skinCondition = combination;
            if (uZoneType == dry) skinCondition = combination;
            if (uZoneType == normal) skinCondition = oily;
            if (uZoneType == oily) skinCondition = oily;
            if (uZoneType == veryOily) skinCondition = oily;
        }
        if (tZoneType == veryOily) {
            if (uZoneType == veryDry) skinCondition = combination;
            if (uZoneType == dry) skinCondition = combination;
            if (uZoneType == normal) skinCondition = oily;
            if (uZoneType == oily) skinCondition = oily;
            if (uZoneType == veryOily) skinCondition = veryOily;
        }

        let keyword_value = '';

        switch (skinCondition) {
            case veryDry:
                keyword_value = 'very_dry';
                break;
            case dry:
                keyword_value = 'dry';
                break;
            case combination:
                keyword_value = 'combination';
                break;
            case normal:
                keyword_value = 'normal';
                break;
            case oily:
                keyword_value = 'oily';
                break;
            case veryOily:
                keyword_value = 'very_oily';
                break;
        }

        return keyword_value;
    }

    // Kiosk SkinCondition
    computationSkinConditionKiosk100(moistureScore: number, sebumQAScore: number): string {
        // define some constants
        const veryDry: number = 1;
        const dry: number = 2;
        const normal: number = 3;
        const oily: number = 4;
        const veryOily: number = 5;
        const combination: number = 6;

        // define some variables
        let skinCondition: number = 0;

        // obtain skin type
        if (moistureScore >= 0 && moistureScore < 6) {
            if (sebumQAScore >= 0 && sebumQAScore < 6) skinCondition = veryDry;
            if (sebumQAScore >= 6 && sebumQAScore < 16) skinCondition = dry;
            if (sebumQAScore >= 16 && sebumQAScore < 49) skinCondition = dry;
            if (sebumQAScore >= 49 && sebumQAScore < 81) skinCondition = combination;
            if (sebumQAScore >= 81 && sebumQAScore <= 99) skinCondition = combination;
        }
        if (moistureScore >= 6 && moistureScore < 16) {
            if (sebumQAScore >= 0 && sebumQAScore < 6) skinCondition = dry;
            if (sebumQAScore >= 6 && sebumQAScore < 16) skinCondition = dry;
            if (sebumQAScore >= 16 && sebumQAScore < 49) skinCondition = dry;
            if (sebumQAScore >= 49 && sebumQAScore < 81) skinCondition = combination;
            if (sebumQAScore >= 81 && sebumQAScore <= 99) skinCondition = combination;
        }
        if (moistureScore >= 16 && moistureScore < 49) {
            if (sebumQAScore >= 0 && sebumQAScore < 6) skinCondition = dry;
            if (sebumQAScore >= 6 && sebumQAScore < 16) skinCondition = dry;
            if (sebumQAScore >= 16 && sebumQAScore < 49) skinCondition = normal;
            if (sebumQAScore >= 49 && sebumQAScore < 81) skinCondition = oily;
            if (sebumQAScore >= 81 && sebumQAScore <= 99) skinCondition = oily;
        }
        if (moistureScore >= 49 && moistureScore < 81) {
            if (sebumQAScore >= 0 && sebumQAScore < 6) skinCondition = combination;
            if (sebumQAScore >= 6 && sebumQAScore < 16) skinCondition = combination;
            if (sebumQAScore >= 16 && sebumQAScore < 49) skinCondition = oily;
            if (sebumQAScore >= 49 && sebumQAScore < 81) skinCondition = oily;
            if (sebumQAScore >= 81 && sebumQAScore <= 99) skinCondition = oily;
        }
        if (moistureScore >= 81 && moistureScore <= 99) {
            if (sebumQAScore >= 0 && sebumQAScore < 6) skinCondition = combination;
            if (sebumQAScore >= 6 && sebumQAScore < 16) skinCondition = combination;
            if (sebumQAScore >= 16 && sebumQAScore < 49) skinCondition = oily;
            if (sebumQAScore >= 49 && sebumQAScore < 81) skinCondition = oily;
            if (sebumQAScore >= 81 && sebumQAScore <= 99) skinCondition = veryOily;
        }

        // define and return skin condition keys/names
        // If either one of the sebum score is missing, we will always give "combination" as skin condition
        // Truth is in this case we should not call this algorithm at all
        let condition: string = 'combination';
        if (skinCondition === veryDry) condition = 'very_dry';
        if (skinCondition === dry) condition = 'dry';
        if (skinCondition === combination) condition = 'combination';
        if (skinCondition === normal) condition = 'normal';
        if (skinCondition === oily) condition = 'oily';
        if (skinCondition === veryOily) condition = 'very_oily';

        return condition;
    }

    keywordValue(keyword_value: string) {
        if (keyword_value === 'normal') {
            return {
                keyword_value: 'Normal',
                keyword_id: 1,
            };
        } else if (keyword_value === 'combination') {
            return {
                keyword_value: 'Combination',
                keyword_id: 2,
            };
        } else if (keyword_value === 'oily') {
            return {
                keyword_value: 'Oily',
                keyword_id: 3,
            };
        } else if (keyword_value === 'very_oily') {
            return {
                keyword_value: 'Very Oily',
                keyword_id: 4,
            };
        } else if (keyword_value === 'dry') {
            return {
                keyword_value: 'Dry',
                keyword_id: 5,
            };
        } else if (keyword_value === 'very_dry') {
            return {
                keyword_value: 'Very Dry',
                keyword_id: 6,
            };
        } else {
            return {
                keyword_value: '',
                keyword_id: 0,
            };
        }
    }

    async webResult(batch_id: number) {
        const result = await this.database.executeQuery(
            `
            WITH _results AS (
            SELECT DISTINCT
                type_measurements."name" AS measurement,
                to_json(original_img.scores) ->> 'score' AS value,
                to_json(original_img.scores) ->> 'computation_score' AS computation_score,
                record.created_time::date AS date,
                record.created_time::time AS time,
                record.analysis_comment AS analysis_comment,
                COALESCE(record.args ->> 'imageUpload', 'true') AS imageUpload,
                -- Conditionally set original_image_url to NULL
                CASE
                    WHEN (record.args ->> 'showing_image_flag') = 'true' OR (record.args ->> 'licenseId') = '5'
                    THEN NULL
                    ELSE original_img.url
                END AS original_image_url,
                -- Conditionally set analyzed_image_url to NULL
                CASE
                    WHEN (record.args ->> 'showing_image_flag') = 'true' OR (record.args ->> 'licenseId') = '5'
                    THEN NULL
                    ELSE analyzed_img.url
                END AS analyzed_image_url,
                ROW_NUMBER() OVER (PARTITION BY type_measurements."name") AS ROW_NUMBER
            FROM
                analysis record
            LEFT JOIN measurements AS original_img 
                ON record.batch_id = original_img.batch_id  
                AND original_img.type_image_id = 21 
            LEFT JOIN type_measurements 
                ON type_measurements.ID = original_img.type_measurement_id 
            LEFT JOIN measurements AS analyzed_img 
                ON record.batch_id = analyzed_img.batch_id 
                AND analyzed_img.type_image_id = 18
                AND (original_img.args ->> 'nth_analysis' = analyzed_img.args ->> 'nth_analysis' 
                    OR type_measurements."name" = 'moistureT' 
                    OR type_measurements."name" = 'moistureU') 
            WHERE
                record.batch_id = $1
                AND analyzed_img.type_image_id = 18  
            GROUP BY
                type_measurements."name", 
                original_img.url, 
                analyzed_img.url, 
                original_img.scores, 
                record.created_time, 
                record.analysis_comment, 
                original_img.type_measurement_id, 
                COALESCE(record.args ->> 'imageUpload', 'true'),
                -- Extracted fields from JSON for grouping
                (record.args ->> 'showing_image_flag'),
                (record.args ->> 'licenseId')
        )
        SELECT
            measurement,
            value,
            computation_score,
            date,
            time,
            original_image_url,
            analyzed_image_url,
            analysis_comment,
            imageUpload
        FROM
            _results 
        WHERE
            ROW_NUMBER = 1;  
            `,
            [batch_id],
        );
        return result;
    }

    async webResultNoImage(batch_id: number) {
        const result = await this.database.executeQuery(
            `
            WITH _results AS (
                SELECT DISTINCT
                    type_measurements."name" AS measurement,
                    to_json(original_img.scores) ->> 'score' as value,
                    to_json(original_img.scores) ->> 'computation_score' as computation_score,
                    record.created_time::date as date,
                    record.created_time::time as time,
                    record.analysis_comment as analysis_comment,
                    COALESCE(record.args ->> 'imageUpload', 'true') as imageUpload,
                    ROW_NUMBER() OVER (PARTITION BY type_measurements."name") AS ROW_NUMBER
                FROM
                    analysis record
                    LEFT JOIN measurements as original_img ON record.batch_id = original_img.batch_id  AND original_img.type_image_id = 21 
                    LEFT JOIN type_measurements ON type_measurements.ID = original_img.type_measurement_id 
                WHERE
                    record.batch_id = $1
                GROUP by type_measurements."name", original_img.scores, record.created_time, original_img.type_measurement_id, record.analysis_comment, COALESCE(record.args ->> 'imageUpload', 'true')
            )
            SELECT
                measurement,
                value,
                computation_score,
                date,
                time,
                analysis_comment,
                imageUpload
            FROM
                _results 
            WHERE
                ROW_NUMBER = 1;
                
            `,
            [batch_id],
        );
        return result;
    }

    async webResultAverageGeneral(batch_id: number) {
        const result = await this.database.executeQuery(
            `
            SELECT 
                ROUND(AVG_SCORE, 2) AS avg,
                NAME AS measurement,
                CASE
                    WHEN id IN (16, 17) THEN 
                        CASE 
                            WHEN ROUND(AVG_SCORE) BETWEEN 81 AND 100 THEN 'Very Hydrated'
                            WHEN ROUND(AVG_SCORE) BETWEEN 49 AND 80.99 THEN 'Hydrated'
                            WHEN ROUND(AVG_SCORE) BETWEEN 16 AND 48.99 THEN 'Normal'
                            WHEN ROUND(AVG_SCORE) BETWEEN 7 AND 15.99 THEN 'Dehydrated'
                            WHEN ROUND(AVG_SCORE) BETWEEN 0 AND 5.99 THEN 'Very Dehydrated'
                        END
                    WHEN id IN (9, 5, 15) THEN 
                        CASE 
                            WHEN ROUND(AVG_SCORE) BETWEEN 0 AND 5 THEN 'Very Dry'
                            WHEN ROUND(AVG_SCORE) BETWEEN 5.99 AND 15.99 THEN 'Dry'
                            WHEN ROUND(AVG_SCORE) BETWEEN 16 AND 48.99 THEN 'Normal'
                            WHEN ROUND(AVG_SCORE) BETWEEN 49 AND 80.99 THEN 'Oily'
                            WHEN ROUND(AVG_SCORE) BETWEEN 81 AND 100 THEN 'Very Oily'
                        END
                    ELSE
                        CASE 
                            WHEN ROUND(AVG_SCORE) BETWEEN 0 AND 5.99 THEN 'Clear'
                            WHEN ROUND(AVG_SCORE) BETWEEN 6 AND 15.99 THEN 'Almost Clear'
                            WHEN ROUND(AVG_SCORE) BETWEEN 16 AND 48.99 THEN 'Mild'
                            WHEN ROUND(AVG_SCORE) BETWEEN 49 AND 80.99 THEN 'Moderate'
                            WHEN ROUND(AVG_SCORE) BETWEEN 81 AND 100 THEN 'Severe'
                            ELSE NULL 
                        END
                END AS keyword_value,
                CASE
                    WHEN id IN (16, 17) THEN 
                        CASE 
                            WHEN ROUND(AVG_SCORE) BETWEEN 81 AND 100 THEN 5
                            WHEN ROUND(AVG_SCORE) BETWEEN 50 AND 80.99 THEN 4
                            WHEN ROUND(AVG_SCORE) BETWEEN 17 AND 48.99 THEN 3
                            WHEN ROUND(AVG_SCORE) BETWEEN 7 AND 15.99 THEN 2
                            WHEN ROUND(AVG_SCORE) BETWEEN 0 AND 6.99 THEN 1
                        END
                    WHEN id IN (9, 5, 15) THEN 
                        CASE 
                            WHEN ROUND(AVG_SCORE) BETWEEN 0 AND 5 THEN 1
                            WHEN ROUND(AVG_SCORE) BETWEEN 5.99 AND 15.99 THEN 2
                            WHEN ROUND(AVG_SCORE) BETWEEN 16 AND 48.99 THEN 3
                            WHEN ROUND(AVG_SCORE) BETWEEN 49 AND 80.99 THEN 4
                            WHEN ROUND(AVG_SCORE) BETWEEN 81 AND 100 THEN 5
                        END
                    ELSE
                        CASE 
                            WHEN ROUND(AVG_SCORE) BETWEEN 0 AND 5.99 THEN 1
                            WHEN ROUND(AVG_SCORE) BETWEEN 6 AND 15.99 THEN 2
                            WHEN ROUND(AVG_SCORE) BETWEEN 16 AND 48.99 THEN 3
                            WHEN ROUND(AVG_SCORE) BETWEEN 49 AND 80.99 THEN 4
                            WHEN ROUND(AVG_SCORE) BETWEEN 81 AND 100 THEN 5
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
            `SELECT scores ->> 'skinAge' as skin_age, scores ->> 'skinCondtion' as skin_condition, created_time::date as date, created_time::time as time
            FROM measurements 
            WHERE batch_id = $1 AND type_image_id = 21 AND type_measurement_id = 18`,
            [batch_id],
        );

        return result;
    }

    // Check Kiosk
    async checkIfkiosk(batch_id: number) {
        const result = await this.database.executeQuery(
            `
                SELECT args ->> 'kiosk' as kiosk, args ->> 'app_id' as app_id
                FROM analysis WHERE batch_id = $1
            `,
            [batch_id],
        );

        return result[0];
    }

    /* 
        Analysis Web Result
    */
    async getBatchId(batch_id: number) {
        // let result = await this.webResult(batch_id);
        // const checkKiosk = await this.checkIfkiosk(batch_id);

        // const avg = await this.webResultAverage(batch_id, checkKiosk);
        // const skinAgeCondition = await this.getSkinAge(batch_id);

        let result = await this.getCombinedResults(batch_id);
        const analysis_comment = result[0]?.analysis_comment;

        let moistureT = null;
        let moistureU = null;
        let sebumT = null;
        let sebumU = null;

        let finalResult: any = [];
        let skinAge = null;
        let skinCondition;

        for (let i = 0; i < result.length; i++) {
            if (!result[i]['original_image_url']) result[i]['original_image_url'] = null;
            if (!result[i]['analyzed_image_url']) result[i]['analyzed_image_url'] = null;

            if (result[i]['measurement'] === 'moistureT' || result[i]['measurement'] === 'moistureU') {
                result[i]['analyzed_image_url'] = null;
                result[i]['original_image_url'] = null;
            }

            if (result[i]['skin_age'] !== null) skinAge = result[i]['skin_age'];
            if (result[i]['skin_condition'] !== null) skinCondition = result[i]['skin_condition'];
            result[i].value = +result[i].value;
            result[i]['avg_value'] = parseFloat(result[i].avg_score);
            result[i]['keyword_id'] = parseFloat(result[i].keyword_id);

            if (result[i]['computation_score']) {
                result[i]['computation_score'] = Number(result[i]['computation_score']);
            }

            if (result[i]['measurement'] === 'skinCondition') delete result[i];
            if (result[i]?.imageupload) delete result[i]?.imageupload;
            // delete result[i]?.analysis_comment;
            delete result[i]?.skin_age;
            delete result[i]?.skin_condition;
            delete result[i]?.app_id;
            delete result[i]?.kiosk;
            delete result[i]?.avg_score;

            console.log(result[i]);
            if (result[i] !== undefined) {
                finalResult.push(result[i]);
            }
        }

        console.log('skinAge, skinCondition ===>', skinAge, skinCondition);

        const answers = await this.AlgoAnalysis.fetchQuestion(Number(batch_id));

        let questFr = -1;
        if (answers !== null) {
            questFr = this.computation.questionnaireFrequency(answers, 5);
        }

        const conditionResult = this.keywordValue(skinCondition);

        if (skinCondition !== null) {
            finalResult.push({
                measurement: 'Skin Condition',
                value: null,
                date: finalResult[0]?.date ?? null,
                time: finalResult[0]?.time ?? null,
                original_image_url: null,
                analyzed_image_url: null,
                avg_value: null,
                keyword_value: conditionResult.keyword_value,
                keyword_id: conditionResult.keyword_id,
            });

            finalResult.push({
                measurement: 'SkinAge',
                value: skinAge,
                date: finalResult[0]?.date,
                time: finalResult[0]?.time,
                original_image_url: null,
                analyzed_image_url: null,
                avg_value: null,
                keyword_value: skinAge,
                keyword_id: null,
            });
        }

        return {
            result: finalResult,
            analysis_comment: analysis_comment,
        };
    }

    async checkExpiration(batch_id: number, checkDuration: number) {
        const result = await this.database.executeQuery(`SELECT request_date FROM analysis WHERE batch_id = $1`, [
            batch_id,
        ]);

        if (result.length === 0) {
            return true;
        }
        if (result[0].request_date === null) {
            const update = `
                    UPDATE analysis
                    SET request_date = $1
                    WHERE batch_id = $2
                  `;

            this.database.executeQuery(update, [new Date(), batch_id]);
            return true;
        }
        const requestDate = new Date(result[0].request_date);

        const differenceInMs = new Date().getTime() - requestDate.getTime();
        const differenceInSeconds = differenceInMs / 1000;

        return differenceInSeconds > checkDuration;
    }

    async getRequestDate(batch_id: number) {
        const result = await this.database.executeQuery(`SELECT request_date FROM analysis WHERE batch_id = $1`, [
            batch_id,
        ]);

        return result[0].request_date;
    }

    async addRequestDate(batch_id: number) {
        const result = await this.database.executeQuery(`UPDATE analysis SET request_date = $1 WHERE batch_id = $2`, [
            new Date(),
            batch_id,
        ]);

        return result;
    }

    numberToBoolean(number: any) {
        if (number === 1) {
            return true;
        } else if (number === 0) {
            return false;
        } else {
            return true;
        }
    }

    async decodeToken(token: string): Promise<any> {
        const url = process.env.CRM + '/web-results/decode_web_result';
        const data = {
            token,
        };

        try {
            const response = await firstValueFrom(
                this.httpService.post(url, data, {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }),
            );

            return response.data;
        } catch (err) {
            console.error(err);
            throw err;
        }
    }

    async finalWebResult(token: string) {
        const decodeToken = await this.decodeToken(token);

        if (decodeToken?.expires) {
            throw new GoneException({
                status: 410,
                message: 'Web result is expired',
            });
        }

        return this.getBatchId(decodeToken?.batch_id);
    }

    async getCombinedResults(batch_id: number) {
        const query = `
           WITH filtered_measurements AS (
                SELECT 
                    m.batch_id,
                    tm."name" AS measurement,
                    tm.id AS type_measurement_id,
                    m.args ->> 'nth_analysis' AS nth_analysis,
                    MAX(m.scores ->> 'skinAge') AS skin_age,
                    MAX(m.scores ->> 'skinCondtion') AS skin_condition,
                    MAX(to_json(m.scores) ->> 'score') AS value,
                    MAX(to_json(m.scores) ->> 'computation_score') AS computation_score,
                    MAX(CASE WHEN m.type_image_id = 21 THEN m.url ELSE NULL END) AS original_image_url,
                    MAX(CASE WHEN m.type_image_id = 18 THEN m.url ELSE NULL END) AS analyzed_image_url
                FROM measurements m
                INNER JOIN type_measurements tm 
                    ON tm.id = m.type_measurement_id
                WHERE m.batch_id = $1
                GROUP BY m.batch_id, tm."name", tm.id, m.args ->> 'nth_analysis'
            ),
            analysis_kiosk AS (
                SELECT 
                    CASE 
                        WHEN EXISTS (
                            SELECT 1 
                            FROM analysis a 
                            WHERE a.batch_id = $1 AND a.args ->> 'kiosk' = 'true'
                        ) THEN 'true'
                        ELSE 'false'
                    END AS kiosk_value
            ), 
            classification_keywords AS (
                SELECT 
                    tp."name" AS measurement,
                    tp."id" AS type_measurement_id,
                    COALESCE(
                        ROUND(AVG((m.scores ->> 'computation_score')::NUMERIC), 2), 
                        ROUND(AVG((m.scores ->> 'score')::NUMERIC), 2)
                    ) AS avg_score,
                    CASE WHEN ak.kiosk_value = 'true' THEN
                            CASE
                                WHEN tp."id" IN (16, 17) THEN 
                                    CASE 
                                        WHEN COALESCE(ROUND(AVG((m.scores ->> 'computation_score')::NUMERIC), 2), ROUND(AVG((m.scores ->> 'score')::NUMERIC), 2)) BETWEEN 71 AND 100 THEN 'Hydrated'
                                        WHEN COALESCE(ROUND(AVG((m.scores ->> 'computation_score')::NUMERIC), 2), ROUND(AVG((m.scores ->> 'score')::NUMERIC), 2))  BETWEEN 26 AND 70.99 THEN 'Normal'
                                        WHEN COALESCE(ROUND(AVG((m.scores ->> 'computation_score')::NUMERIC), 2), ROUND(AVG((m.scores ->> 'score')::NUMERIC), 2)) BETWEEN 0 AND 25.99 THEN 'Dehydrated'
                                    END
                                ELSE
                                    CASE 
                                        WHEN COALESCE(ROUND(AVG((m.scores ->> 'computation_score')::NUMERIC), 2), ROUND(AVG((m.scores ->> 'score')::NUMERIC), 2)) BETWEEN 0 AND 25.99 THEN 'Preventive Care'
                                        WHEN COALESCE(ROUND(AVG((m.scores ->> 'computation_score')::NUMERIC), 2), ROUND(AVG((m.scores ->> 'score')::NUMERIC), 2)) BETWEEN 26 AND 70.99 THEN 'Protective Care'
                                        WHEN COALESCE(ROUND(AVG((m.scores ->> 'computation_score')::NUMERIC), 2), ROUND(AVG((m.scores ->> 'score')::NUMERIC), 2)) BETWEEN 71 AND 99.99 THEN 'Intensive Care'
                                    END
                            END
                        ELSE
                            CASE
                                WHEN tp."id" IN (16, 17) THEN 
                                    CASE 
                                        WHEN COALESCE(ROUND(AVG((m.scores ->> 'computation_score')::NUMERIC), 2), ROUND(AVG((m.scores ->> 'score')::NUMERIC), 2)) BETWEEN 81 AND 100 THEN 'Very Hydrated'
                                        WHEN COALESCE(ROUND(AVG((m.scores ->> 'computation_score')::NUMERIC), 2), ROUND(AVG((m.scores ->> 'score')::NUMERIC), 2)) BETWEEN 49 AND 80.99 THEN 'Hydrated'
                                        WHEN COALESCE(ROUND(AVG((m.scores ->> 'computation_score')::NUMERIC), 2), ROUND(AVG((m.scores ->> 'score')::NUMERIC), 2)) BETWEEN 16 AND 48.99 THEN 'Normal'
                                        WHEN COALESCE(ROUND(AVG((m.scores ->> 'computation_score')::NUMERIC), 2), ROUND(AVG((m.scores ->> 'score')::NUMERIC), 2)) BETWEEN 7 AND 15.99 THEN 'Dehydrated'
                                        WHEN COALESCE(ROUND(AVG((m.scores ->> 'computation_score')::NUMERIC), 2), ROUND(AVG((m.scores ->> 'score')::NUMERIC), 2)) BETWEEN 0 AND 5.99 THEN 'Very Dehydrated'
                                    END
                                WHEN tp."id" IN (9, 5, 15) THEN 
                                    CASE 
                                        WHEN COALESCE(ROUND(AVG((m.scores ->> 'computation_score')::NUMERIC), 2), ROUND(AVG((m.scores ->> 'score')::NUMERIC), 2)) BETWEEN 0 AND 5 THEN 'Very Dry'
                                        WHEN COALESCE(ROUND(AVG((m.scores ->> 'computation_score')::NUMERIC), 2), ROUND(AVG((m.scores ->> 'score')::NUMERIC), 2)) BETWEEN 5.99 AND 15.99 THEN 'Dry'
                                        WHEN COALESCE(ROUND(AVG((m.scores ->> 'computation_score')::NUMERIC), 2), ROUND(AVG((m.scores ->> 'score')::NUMERIC), 2)) BETWEEN 16 AND 48.99 THEN 'Normal'
                                        WHEN COALESCE(ROUND(AVG((m.scores ->> 'computation_score')::NUMERIC), 2), ROUND(AVG((m.scores ->> 'score')::NUMERIC), 2)) BETWEEN 49 AND 80.99 THEN 'Oily'
                                        WHEN COALESCE(ROUND(AVG((m.scores ->> 'computation_score')::NUMERIC), 2), ROUND(AVG((m.scores ->> 'score')::NUMERIC), 2)) BETWEEN 81 AND 100 THEN 'Very Oily'
                                    END        
                                ELSE
                                    CASE 
                                        WHEN COALESCE(ROUND(AVG((m.scores ->> 'computation_score')::NUMERIC), 2), ROUND(AVG((m.scores ->> 'score')::NUMERIC), 2)) BETWEEN 0 AND 5.99 THEN 'Clear'
                                        WHEN COALESCE(ROUND(AVG((m.scores ->> 'computation_score')::NUMERIC), 2), ROUND(AVG((m.scores ->> 'score')::NUMERIC), 2)) BETWEEN 6 AND 15.99 THEN 'Almost Clear'
                                        WHEN COALESCE(ROUND(AVG((m.scores ->> 'computation_score')::NUMERIC), 2), ROUND(AVG((m.scores ->> 'score')::NUMERIC), 2)) BETWEEN 16 AND 48.99 THEN 'Mild'
                                        WHEN COALESCE(ROUND(AVG((m.scores ->> 'computation_score')::NUMERIC), 2), ROUND(AVG((m.scores ->> 'score')::NUMERIC), 2)) BETWEEN 49 AND 80.99 THEN 'Moderate'
                                        WHEN COALESCE(ROUND(AVG((m.scores ->> 'computation_score')::NUMERIC), 2), ROUND(AVG((m.scores ->> 'score')::NUMERIC), 2)) BETWEEN 81 AND 100 THEN 'Severe'
                                        ELSE NULL 
                                    END
                            END
                    END AS keyword_value,
                    CASE WHEN ak.kiosk_value = 'true' THEN
                            CASE
                                WHEN tp."id" IN (16, 17) THEN 
                                    CASE 
                                        WHEN COALESCE(ROUND(AVG((m.scores ->> 'computation_score')::NUMERIC), 2), ROUND(AVG((m.scores ->> 'score')::NUMERIC), 2)) BETWEEN 71 AND 100 THEN 3
                                        WHEN COALESCE(ROUND(AVG((m.scores ->> 'computation_score')::NUMERIC), 2), ROUND(AVG((m.scores ->> 'score')::NUMERIC), 2)) BETWEEN 26 AND 70.99 THEN 2
                                        WHEN COALESCE(ROUND(AVG((m.scores ->> 'computation_score')::NUMERIC), 2), ROUND(AVG((m.scores ->> 'score')::NUMERIC), 2)) BETWEEN 0 AND 25.99 THEN 1
                                    END
                                ELSE
                                    CASE 
                                        WHEN COALESCE(ROUND(AVG((m.scores ->> 'computation_score')::NUMERIC), 2), ROUND(AVG((m.scores ->> 'score')::NUMERIC), 2)) BETWEEN 0 AND 25.99 THEN 1
                                        WHEN COALESCE(ROUND(AVG((m.scores ->> 'computation_score')::NUMERIC), 2), ROUND(AVG((m.scores ->> 'score')::NUMERIC), 2)) BETWEEN 26 AND 70.99 THEN 2
                                        WHEN COALESCE(ROUND(AVG((m.scores ->> 'computation_score')::NUMERIC), 2), ROUND(AVG((m.scores ->> 'score')::NUMERIC), 2)) BETWEEN 71 AND 99.99 THEN 3
                                    END
                            END
                        ELSE
                            CASE
                                WHEN tp."id" IN (16, 17) THEN 
                                    CASE 
                                        WHEN COALESCE(ROUND(AVG((m.scores ->> 'computation_score')::NUMERIC), 2), ROUND(AVG((m.scores ->> 'score')::NUMERIC), 2)) BETWEEN 81 AND 100 THEN 5
                                        WHEN COALESCE(ROUND(AVG((m.scores ->> 'computation_score')::NUMERIC), 2), ROUND(AVG((m.scores ->> 'score')::NUMERIC), 2)) BETWEEN 50 AND 80.99 THEN 4
                                        WHEN COALESCE(ROUND(AVG((m.scores ->> 'computation_score')::NUMERIC), 2), ROUND(AVG((m.scores ->> 'score')::NUMERIC), 2)) BETWEEN 17 AND 48.99 THEN 3
                                        WHEN COALESCE(ROUND(AVG((m.scores ->> 'computation_score')::NUMERIC), 2), ROUND(AVG((m.scores ->> 'score')::NUMERIC), 2)) BETWEEN 7 AND 15.99 THEN 2
                                        WHEN COALESCE(ROUND(AVG((m.scores ->> 'computation_score')::NUMERIC), 2), ROUND(AVG((m.scores ->> 'score')::NUMERIC), 2)) BETWEEN 0 AND 6.99 THEN 1
                                    END
                                WHEN tp."id" IN (9, 5, 15) THEN 
                                    CASE 
                                        WHEN COALESCE(ROUND(AVG((m.scores ->> 'computation_score')::NUMERIC), 2), ROUND(AVG((m.scores ->> 'score')::NUMERIC), 2)) BETWEEN 0 AND 5 THEN 1
                                        WHEN COALESCE(ROUND(AVG((m.scores ->> 'computation_score')::NUMERIC), 2), ROUND(AVG((m.scores ->> 'score')::NUMERIC), 2)) BETWEEN 5.99 AND 15.99 THEN 2
                                        WHEN COALESCE(ROUND(AVG((m.scores ->> 'computation_score')::NUMERIC), 2), ROUND(AVG((m.scores ->> 'score')::NUMERIC), 2)) BETWEEN 16 AND 48.99 THEN 3
                                        WHEN COALESCE(ROUND(AVG((m.scores ->> 'computation_score')::NUMERIC), 2), ROUND(AVG((m.scores ->> 'score')::NUMERIC), 2)) BETWEEN 49 AND 80.99 THEN 4
                                        WHEN COALESCE(ROUND(AVG((m.scores ->> 'computation_score')::NUMERIC), 2), ROUND(AVG((m.scores ->> 'score')::NUMERIC), 2)) BETWEEN 81 AND 100 THEN 5
                                    END    
                                ELSE
                                    CASE 
                                        WHEN COALESCE(ROUND(AVG((m.scores ->> 'computation_score')::NUMERIC), 2), ROUND(AVG((m.scores ->> 'score')::NUMERIC), 2)) BETWEEN 0 AND 5.99 THEN 1
                                        WHEN COALESCE(ROUND(AVG((m.scores ->> 'computation_score')::NUMERIC), 2), ROUND(AVG((m.scores ->> 'score')::NUMERIC), 2)) BETWEEN 6 AND 15.99 THEN 2
                                        WHEN COALESCE(ROUND(AVG((m.scores ->> 'computation_score')::NUMERIC), 2), ROUND(AVG((m.scores ->> 'score')::NUMERIC), 2)) BETWEEN 16 AND 48.99 THEN 3
                                        WHEN COALESCE(ROUND(AVG((m.scores ->> 'computation_score')::NUMERIC), 2), ROUND(AVG((m.scores ->> 'score')::NUMERIC), 2)) BETWEEN 49 AND 80.99 THEN 4
                                        WHEN COALESCE(ROUND(AVG((m.scores ->> 'computation_score')::NUMERIC), 2), ROUND(AVG((m.scores ->> 'score')::NUMERIC), 2)) BETWEEN 81 AND 100 THEN 5
                                        ELSE NULL 
                                    END
                            END
                    END AS keyword_id
                FROM measurements m
                INNER JOIN type_measurements tp ON tp."id" = m.type_measurement_id
                CROSS JOIN analysis_kiosk ak
                WHERE m.batch_id = $1 AND m.type_image_id = 21
                GROUP BY tp."name", tp."id", ak.kiosk_value
            ),
            filtered_analysis AS (
                SELECT 
                    a.batch_id,
                    a.created_time::date AS date,
                    a.created_time::time AS time,
                    a.analysis_comment,
                    COALESCE(a.args ->> 'imageUpload', 'true') AS imageUpload,
                    a.args ->> 'kiosk' AS kiosk,
                    a.args ->> 'app_id' AS app_id
                FROM analysis a
                WHERE a.batch_id = $1
            )
            SELECT DISTINCT ON (fm.measurement)  
                fm.measurement,
                fm.skin_age,
                fm.skin_condition,
                fm.computation_score,
                fm.value,
                fm.original_image_url,
                fm.analyzed_image_url,
                ck.avg_score,
                ck.keyword_value,
                ck.keyword_id,
                fa.date,
                fa.time,
                fa.analysis_comment,
                fa.imageUpload,
                fa.kiosk,
                fa.app_id
            FROM filtered_measurements fm
            LEFT JOIN classification_keywords ck 
                ON fm.measurement = ck.measurement
            LEFT JOIN filtered_analysis fa 
                ON fm.batch_id = fa.batch_id
            ORDER BY fm.measurement, fm.nth_analysis;

        `;

        const result = await this.database.executeQuery(query, [batch_id]);
        return result;
    }
}
