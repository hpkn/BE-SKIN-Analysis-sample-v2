import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DatabaseService } from 'src/database/database.service';
import { DataSavingController } from './dataSaving/dataSaving.controller';
import { DataSavingService } from './dataSaving/dataSaving.service';
import { config } from 'dotenv';
import { Pool } from 'pg';
import { FileUploadService } from 'src/common/FileUpload/fileUpload.service';
import { HistoryController } from './history/history.controller';
import { HistoryService } from './history/history.service';
import { ImagesController } from './images/images.controller';
import { ImagesService } from './images/images.service';

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
  imports: [],
  controllers: [
    DataSavingController,
    HistoryController,
    ImagesController
  ],
  providers: [
    ConfigService, 
    DataSavingService,
    DatabaseService,
    FileUploadService,  
    HistoryService,
    ImagesService, 
    
    {
      provide: 'DATABASE_POOL',
      useFactory: databasePoolFactory,
    },
    
    // 'DATABASE_POOL'
  ],
})
export class AnalysisModule {}