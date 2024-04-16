import { Injectable, Inject } from '@nestjs/common';
import { Pool } from 'pg';
import { DatabaseService } from 'src/database/database.service';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class BatchAnalysisService {
    constructor(private database: DatabaseService) {}

    async insertInAnalysis(customer_id: any, token: any) {
        try {
            const decoded: any = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

            const tokenInfo = {
                consultant_id: decoded['consultant_id'],
                email: decoded['email'],
                app_id: decoded['app_id'],
            };

            const args = JSON.stringify(tokenInfo);

            const insert = await this.database.executeQuery(`
              INSERT INTO analysis (customer_id, args) 
              values (${customer_id}, '${args}') RETURNING *
            `);

            return insert[0]['batch_id'];
        } catch (e) {
            console.log(e);
        }
    }

    async updateEnvironment(batch_id: number, environment: any) {
        try {
            let data = JSON.stringify(environment);

            const update = `
                    UPDATE analysis
                    SET args = $1
                    WHERE batch_id = $2
                  `;

            this.database.executeQuery(update, [data, batch_id]);
            return update;
        } catch (e) {
            console.log('check', e);
        }
    }

    async deleleBatch(batch_id: number) {
        await this.database.executeQuery(
            `DELETE FROM measurements
            WHERE batch_id = ${batch_id};`,
        );

        const result = await this.database.executeQuery(
            `DELETE FROM analysis
            WHERE batch_id = ${batch_id};`,
        );

        return result;
    }

    //
}
