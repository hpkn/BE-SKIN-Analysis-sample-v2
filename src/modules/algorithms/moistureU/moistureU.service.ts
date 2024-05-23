import { Injectable, Inject, HttpException } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { AlgoAnalysisDTO } from 'src/common/Dto/analysis/algoAnalysis.dto';
import { FileUploadService } from '../../../common/FileUpload/fileUpload.service';
import { BatchAnalysisService } from 'src/modules/analysis/batchAnalysis/batchAnalysis.service';
import { MoistureDTO } from 'src/common/Dto/analysis/moisture.dto';

@Injectable()
export class MoistureUService {
    constructor(private database: DatabaseService) {}

    saveData(data: MoistureDTO) {
        const saveSql =
            'INSERT INTO measurements (batch_id, type_measurement_id, type_image_id, scores) values ($1, $2, $3, $4)';
        const queries = [data.batch_id, 17, 21, JSON.stringify(data)];

        this.database.executeQuery(saveSql, queries);

        if (data?.skinAge || data?.skinCondition) {
            const saveSql =
                'INSERT INTO measurements (batch_id, type_measurement_id, type_image_id, scores) values ($1, $2, $3, $4)';
            const queries = [
                data.batch_id,
                18,
                21,
                JSON.stringify({ skinAge: data?.skinAge ?? null, skinCondition: data?.skinCondition ?? null }),
            ];

            this.database.executeQuery(saveSql, queries);
        }

        return data;
    }
}
