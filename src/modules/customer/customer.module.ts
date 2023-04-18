import { Module } from '@nestjs/common';
import { AnanalysisHistoryController } from './AnalysisHistory/analysisHistory.controller';
import { AnanalysisHistoryService } from './AnalysisHistory/analysisHistory.service';

import { DatabaseModule } from 'src/database/database.module';
import { FileUploadService } from 'src/common/FileUpload/fileUpload.service';
import { ConfigService } from 'aws-sdk';

@Module({
  imports: [DatabaseModule],
  controllers: [AnanalysisHistoryController],
  providers: [AnanalysisHistoryService, FileUploadService, ConfigService],
})
export class CustomerModule {}
