import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
// import { DataSavingController } from './dataSaving/dataSaving.controller';
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
import { PorphyrinService } from '../algorithms/porphyrin/porphyrin.service';
import { SebumService } from '../algorithms/sebum/sebum.service';
import { DataSavingController } from './dataSaving/dataSaving.controller';
import { SebumTService } from '../algorithms/sebumT/sebumT.service';
import { ShineService } from '../algorithms/shine/shine.service';
import { SpotsService } from '../algorithms/spots/spots.service';
import { SkintoneService } from '../algorithms/skinTone/skinTone.service';
import { SkinToneDiorService } from '../algorithms/skinToneDior/skinToneDior.service';
import { WrinklesService } from '../algorithms/wrinkles/wrinkles.service';
import { SensitivityScabsService } from '../algorithms/sensitivityScabs/sensitivityScabs.service';
import { SensitivityRednessService } from '../algorithms/sensitivityRedness/sensitivityRedness.service';
import { SensitivtyScalingService } from '../algorithms/sensitivtyScaling/sensitivtyScaling.service';
import { FitzSGService } from '../algorithms/fitzSG/fitzSG.service';
import { BullModule } from '@nestjs/bull';

@Module({
    imports: [
        DatabaseModule,
        BullModule.registerQueue({
            name: 'dataSaving',
        }),
    ],
    controllers: [DataSavingController, AlgoAnalysisController, BatchAnalysisController],
    providers: [
        ConfigService,
        FileUploadService,
        DataSavingService,
        AlgoAnalysisService,
        KeratinService,
        BatchAnalysisService,
        PoresService,
        PorphyrinService,
        SebumService,
        SebumTService,
        ShineService,
        SpotsService,
        SkintoneService,
        SkinToneDiorService,
        WrinklesService,
        SensitivityScabsService,
        SensitivityRednessService,
        SensitivtyScalingService,
        FitzSGService,
        // UploadProcessor,
    ],
})
export class AnalysisModule {}

