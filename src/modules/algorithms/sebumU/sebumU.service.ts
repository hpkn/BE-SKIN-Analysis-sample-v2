import { Injectable, Inject, HttpException } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { FileUploadService } from '../../../common/FileUpload/fileUpload.service';
import { BatchAnalysisService } from 'src/modules/analysis/batchAnalysis/batchAnalysis.service';
import { MoistureUDTO } from 'src/common/Dto/analysis/moistureU.dto';

@Injectable()
export class SebumUService {
    constructor(
        private database: DatabaseService,
        private S3Image: FileUploadService,
        private batchAnalysis: BatchAnalysisService,
    ) {}

    async saveData(data: MoistureUDTO, analyzedImageArgs: any, originalImageArgs: any, imageRecords: any) {
        // const analyzedImageArgs = this.S3Image.getImageArgs('analyzedImage', data.task.algoName, 'sebumU');

        // const originalImageArgs = this.S3Image.getImageArgs('originalImage', data.task.algoName, 'sebumU');

        const saveSql =
            'INSERT INTO measurements (batch_id, url, sys_url, hash, type_measurement_id, type_image_id, args, scores) values ($1, $2, $3, $4, $5, $6, $7, $8)';
        // const saveArgsSql = 'INSERT INTO keratin (batch_id, args) data ($1, $2)';
        const queries = [
            {
                variables: [
                    data.batch_id,
                    analyzedImageArgs.url,
                    analyzedImageArgs.sys_url,
                    analyzedImageArgs.hash,
                    5,
                    18,
                    JSON.stringify({ nth_analysis: imageRecords }),
                    null,
                ],
            },
            {
                variables: [
                    data.batch_id,
                    originalImageArgs.url,
                    originalImageArgs.sys_url,
                    originalImageArgs.hash,
                    5,
                    21,
                    JSON.stringify({ nth_analysis: imageRecords }),
                    JSON.stringify({
                        raw: data.raw,
                        score: data.score,
                    }),
                ],
            },
        ];

        for (let i = 0; i < queries.length; i++) {
            this.database.executeQuery(saveSql, queries[i].variables);
        }

        return 'saved';
    }
}
