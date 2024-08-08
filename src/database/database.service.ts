import { Inject, Injectable } from '@nestjs/common';
import { Pool, QueryResult } from 'pg';
import { MyLogger } from 'src/config/Logger/logger.service';
import { CONNECTION_POOL } from './database.module-definition';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class DatabaseService {
    private readonly logger = new MyLogger(DatabaseService.name);

    constructor(@Inject('DATABASE_POOL') private pool: Pool) {}

    executeQuery(queryText: string, values: any[] = []): Promise<any> {
        this.logger.debug(`Executing query: ${queryText} (${values})`);
        return this.pool.query(queryText, values).then((result: QueryResult) => {
            this.logger.debug(`Executed query, result size ${result.rows.length}`);
            return result.rows;
        });
    }

    async runQuery(query: string, params?: unknown[]) {
        return this.pool.query(query, params);
    }

    // Migration script
    async migrate() {
        const migrationDir = path.join(__dirname, 'migrations');

        const migrationFiles = fs.readdirSync(migrationDir).sort();

        const client = await this.pool.connect();

        try {
            await client.query('BEGIN'); // Start a transaction

            for (const migrationFile of migrationFiles) {
                const migrationPath = path.join(migrationDir, migrationFile);
                const migrationScript = fs.readFileSync(migrationPath, 'utf8');

                try {
                    // Execute the migration script inside the transaction
                    await client.query(migrationScript);
                    this.logger.log(`Migration ${migrationFile} applied successfully`);
                } catch (error) {
                    this.logger.error(`Error applying migration ${migrationFile}: ${error}`);
                    await client.query('ROLLBACK'); // Rollback the transaction
                    throw error;
                }
            }

            await client.query('COMMIT'); // Commit the transaction
            this.logger.log('All migrations applied successfully');
        } finally {
            client.release(); // Release the client back to the pool
        }
    }

    private extractTableNameFromMigration(migrationScript: string): string {
        // Extract the table name from the migration script (for example, from CREATE TABLE statement)
        // Modify this method based on the structure of your migration scripts
        // This is a simplified example assuming the table name is immediately after "CREATE TABLE"
        const regex = /CREATE\s+TABLE\s+(\w+)/i;
        const match = migrationScript.match(regex);
        if (match && match.length > 1) {
            return match[1];
        } else {
            throw new Error('Unable to extract table name from migration script');
        }
    }
}
