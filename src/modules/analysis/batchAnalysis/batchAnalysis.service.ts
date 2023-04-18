import { Injectable, Inject } from '@nestjs/common';
import { Pool } from 'pg';
import { DatabaseService } from 'src/database/database.service';

@Injectable()
export class BatchAnalysisService {
  constructor(private database: DatabaseService) {}

  async insertInAnalysis(customer_id: any, args: any) {
    const insert = await this.database.executeQuery(`
                INSERT INTO analysis (customer_id, args) 
                values (${customer_id}, '${args}') RETURNING *
            `);

    // console.log("insert result", insert['rows'][0]['batch_id']);
    return insert['rows'][0]['batch_id'];
  }

  async updateEnvironment(batch_id: number, environment: any) {
    try {
      let data = JSON.stringify(environment);

      const update = await this.database.executeQuery(
        `
                UPDATE analysis
                SET args = args::jsonb || '${data}' :: jsonb
                WHERE batch_id = ${batch_id}
                `,
      );
    } catch (e) {
      console.log(e);
    }
  }
}
