import { Injectable, Inject } from '@nestjs/common';
import { Pool } from 'pg';
import { GetcustomerHistoryDTO } from 'src/common/Dto/customer/analysisHistory/analysisHistory.dto';
import { DatabaseService } from 'src/database/database.service';

@Injectable()
export class AnanalysisHistoryService {
    constructor(private database: DatabaseService) {}

    async GetcustomerHistory(customer_id: number, data: GetcustomerHistoryDTO) {
        try {
            let mainSQL = `SELECT
                        batch_id,
                        created_time,
                        to_json ( args ) ->> 'lat' AS lat,
                        to_json ( args ) ->> 'long' AS long,
                        to_json ( args ) ->> 'deviceOS' AS deviceOS,
                        to_json ( args ) ->> 'deviceModel' AS deviceModel,
                        to_json ( args ) ->> 'licenseId' AS licenseId,
                        to_json ( args ) ->> 'showing_image_flag' AS no_image_license
                    FROM
                        analysis 
                    `;
            let resp: any;
            let totalPages: any;
            let dateFilterSql: any;
            if (data.page && data.limit && !data.search && !data.from && !data.to) {
                dateFilterSql = ` WHERE customer_id = ${Number(customer_id)}
                 LIMIT ${Number(data.limit)} OFFSET ${Number((data.page - 1) * data.limit)};`;
                resp = await this.database.executeQuery(mainSQL + dateFilterSql);
            } else if (data.to && data.from && !data.search) {
                dateFilterSql = ` WHERE customer_id = ${Number(customer_id)} AND
                                    created_time >= timestamp '${data.from}'
                                    AND created_time <= timestamp '${data.to}'
                                    LIMIT ${Number(data.limit)} OFFSET ${Number((data.page - 1) * data.limit)};`;
                resp = await this.database.executeQuery(mainSQL + dateFilterSql);
            } else if (data.to && !data.from && !data.search) {
                dateFilterSql = ` WHERE customer_id = ${Number(customer_id)} AND
                                    created_time <= timestamp '${data.to}'
                                    LIMIT ${Number(data.limit)} OFFSET ${Number((data.page - 1) * data.limit)};`;
                resp = await this.database.executeQuery(mainSQL + dateFilterSql);
            } else if (!data.to && data.from && !data.search) {
                dateFilterSql = ` WHERE customer_id = ${Number(customer_id)} AND
                                    created_time >= timestamp '${data.from}'
                                    LIMIT ${Number(data.limit)} OFFSET ${Number((data.page - 1) * data.limit)};`;
                resp = await this.database.executeQuery(mainSQL + dateFilterSql);
            } else if (data.search) {
                dateFilterSql = ` WHERE customer_id = ${Number(customer_id)}
                                AND CAST(batch_id as TEXT) LIKE '${data.search}%'`;
                resp = await this.database.executeQuery(mainSQL + dateFilterSql);
            } else {
                resp = await this.database.executeQuery(mainSQL + ` WHERE customer_id = ${Number(customer_id)}`);
            }

            const result: any = await this.database.executeQuery(
                `
                select count(*)
                from analysis
                where customer_id = $1
            `,
                [Number(customer_id)],
            );

            totalPages = Math.ceil(Number(result?.[0]?.count) / Number(data.limit));

            const retObj = {
                status: 200,
                service: 'Customer Analysis History',
                count: result[0].count,
                totalPages: totalPages,
                currentPage: data.page,
                data: resp,
            };
            return retObj;
        } catch (error) {
            throw new Error();
        }
    }

    async getcustomerHistoryDetail(data: GetcustomerHistoryDTO) {
        const rows = await this.database.executeQuery(
            `
            select batch_id,
                customer_id,
                created_time,
                'cndp skin' as type,
                args
            from analysis
            where batch_id = $1;
        `,
            [data.batch_id],
        );

        const resObj = {
            status: 200,
            service: 'Customer Analysis History Details',
            device_details: '',
            customer_details: rows,
        };

        return resObj;
    }

    async analysisInfor(batch_id: number) {
        try {
            const result = await this.database.executeQuery(
                `WITH analyzed_records AS (
                    SELECT
                        batch_id,
                        url AS analyzed_url,
                        type_measurement_id,
                        ROW_NUMBER() OVER (PARTITION BY batch_id, type_measurement_id ORDER BY url) AS rn
                    FROM measurements
                    WHERE type_image_id = 18
                ),
                filtered_records AS (
                    SELECT
                        batch_id,
                        url AS original_image,
                        type_measurement_id,
                        hash,
                        scores AS args
                    FROM measurements
                    WHERE type_image_id = 21
                )
                SELECT
                    tm.name AS measurement,
                    A.analysis_comment,
                    A.args ->> 'lisenceId' as licenseId, 
                    A.args ->> 'showing_image_flag' as no_image_license,
                    r.batch_id,
                    CASE
                        WHEN (A.args ->> 'showing_image_flag') = 'true' OR (A.args ->> 'licenseId') = '5'
                        THEN NULL
                        ELSE r.original_image
                    END AS original_image,
                    CASE
                        WHEN (A.args ->> 'showing_image_flag') = 'true' OR (A.args ->> 'licenseId') = '5'
                        THEN NULL
                        ELSE ar.analyzed_url
                    END AS analyzed_url,
                    r.hash,
                    ti.name AS type,
                    r.args
                FROM
                    filtered_records r
                LEFT JOIN type_images ti ON ti.id = 21
                LEFT JOIN type_measurements tm ON tm.id = r.type_measurement_id
                LEFT JOIN analysis A ON A.batch_id = r.batch_id
                LEFT JOIN analyzed_records ar ON ar.batch_id = r.batch_id 
                    AND ar.type_measurement_id = r.type_measurement_id 
                    AND ar.rn = 1
                WHERE
                    r.batch_id = $1;
`,
                [batch_id],
            );

            return result;
        } catch (error) {
            console.log('error ======> ', error);
        }
    }
}
