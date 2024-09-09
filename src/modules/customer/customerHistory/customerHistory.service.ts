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
                        to_json ( args ) ->> 'deviceModel' AS deviceModel 
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
        // const result = await this.database.executeQuery(
        //     `
        //     WITH
        //         original_img AS (
        //             SELECT
        //                 m.batch_id,
        //                 m.url,
        //                 m.hash,
        //                 m.scores,
        //                 m.type_measurement_id,
        //                 m.type_image_id
        //             FROM
        //                 measurements m
        //             WHERE
        //                 m.type_image_id = 21
        //         ),
        //         analyzed_img AS (
        //             SELECT
        //                 m.batch_id,
        //                 m.url,
        //                 m.type_measurement_id,
        //                 m.hash
        //             FROM
        //                 measurements m
        //             WHERE
        //                 m.type_image_id = 18
        //         )
        //     SELECT
        //         tm."name" AS measurement,
        //         r.analysis_comment,
        //         r.batch_id,
        //         oi.url AS original_image,
        //         ai.url AS analyzed_image,
        //         oi.hash,
        //         ti.name AS type,
        //         to_json(oi.scores) AS args,
        //         r.created_time
        //     FROM
        //         analysis r
        //         LEFT JOIN original_img oi
        //             ON r.batch_id = oi.batch_id
        //         LEFT JOIN analyzed_img ai
        //             ON r.batch_id = ai.batch_id
        //             AND oi.type_measurement_id = ai.type_measurement_id
        //         LEFT JOIN type_measurements tm
        //             ON tm.id = oi.type_measurement_id
        //         LEFT JOIN type_images ti
        //             ON ti.id = oi.type_image_id
        //     WHERE
        //         r.batch_id = $1
        //     GROUP BY
        //         tm."name",
        //         r.analysis_comment,
        //         r.batch_id,
        //         oi.url,
        //         ai.url,
        //         oi.hash,
        //         ti.name,
        //         oi.scores,
        //         r.created_time;
        //     `,
        //     [batch_id],
        // );

        const result = await this.database.executeQuery(
            `
        SELECT
          type_measurements."name" AS measurement,
          analysis_comment as analysis_comment,
          record.batch_id,
          url as original_image,
          hash,
          type_images.NAME AS TYPE,
          hash,
          to_json ( scores ) AS args
        FROM
          measurements record
          LEFT JOIN type_images ON type_images.ID = record.type_image_id
          LEFT JOIN type_measurements ON type_measurements.id = record.type_measurement_id
          LEFT JOIN analysis ON analysis.batch_id = record.batch_id
        WHERE
          record.batch_id = $1
          AND ( type_image_id = 21 );
      `,
            [batch_id],
        );

        return result;
    }
}
