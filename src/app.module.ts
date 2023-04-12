import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as Joi from '@hapi/joi'
import { DatabaseModule } from './database/database.module';
import { AnalysisModule } from './modules/analysis/analysis.module';
import { DatabaseService } from './database/database.service';
import { config } from 'dotenv';
import { Pool } from 'pg';
import { FileUploaddModule } from './common/FileUpload/fileUpload.module';
import { APP_FILTER } from '@nestjs/core';
import { AllExceptionsFilter } from './common/util/exceptionHandling/allException.filter';

config();

const configService = new ConfigService();

const databasePoolFactory = async () => {
  return new Pool({
    user: configService.get('POSTGRES_USER'),
    host: configService.get('POSTGRES_HOST'),
    database: configService.get('POSTGRES_DB'),
    password: configService.get('POSTGRES_PASSWORD'),
    port: configService.get('POSTGRES_PORT'),
  });
};
@Module({
  imports: [
 
    // ConfigModule.forRoot({
    //   validationSchema: Joi.object({
    //     POSTGRES_HOST: Joi.string().required(),
    //     POSTGRES_PORT: Joi.number().required(),
    //     POSTGRES_USER: Joi.string().required(),
    //     POSTGRES_PASSWORD: Joi.string().required(),
    //     POSTGRES_DB: Joi.string().required(),
    //     PORT: Joi.number(),
    //   })
    // }),
    
    // TypeOrmModule.forRoot(),
    DatabaseModule,
    // DatabaseModule
    AnalysisModule
  ],
  controllers: [],
  providers: [
    {
      provide: 'DATABASE_POOL',
      useFactory: databasePoolFactory,
    },

    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    DatabaseService,
    FileUploaddModule,
  ],
})
export class AppModule {}