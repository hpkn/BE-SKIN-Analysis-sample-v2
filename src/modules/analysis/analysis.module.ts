import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSavingController } from './dataSaving/dataSaving.controller';
import { DataSavingService } from './dataSaving/dataSaving.service';
import { DatabaseService } from 'src/database/database.service';
import { FileUploadService } from 'src/common/FileUpload/fileUpload.service';
import { DatabaseModule } from 'src/database/database.module';
import { AlgoAnalysisController } from './algoAnalysis/algoAnalysis.controller';
import { AlgoAnalysisService } from './algoAnalysis/algoAnalysis.service';
import { KeratinService } from '../algorithms/keratin/keratin.service';
import { BatchAnalysisController } from './batchAnalysis/batchAnalysis.controller';
import { BatchAnalysisService } from './batchAnalysis/batchAnalysis.service';
import { PoresService } from '../algorithms/pores/pores.service';

@Module({
  imports: [DatabaseModule],
  controllers: [
    DataSavingController,
    AlgoAnalysisController,
    BatchAnalysisController,
  ],
  providers: [
    ConfigService,
    FileUploadService,
    DataSavingService,
    AlgoAnalysisService,
    KeratinService,
    BatchAnalysisService,
    PoresService,
  ],
})
export class AnalysisModule {}
