import { Injectable, Inject, HttpException } from '@nestjs/common';
import { GetcustomerHistoryDTO } from 'src/common/Dto/customer/analysisHistory/analysisHistory.dto';
import { DatabaseService } from 'src/database/database.service';
import * as celery from 'celery-node';
import { v4 as uuidv4 } from 'uuid';
import { AlgoAnalysisDTO } from 'src/common/Dto/analysis/algoAnalysis.dto';
import fs from 'fs';
import { FileUploadService } from '../../../common/FileUpload/fileUpload.service';
import { BatchAnalysisService } from 'src/modules/analysis/batchAnalysis/batchAnalysis.service';

@Injectable()
export class ShineService {
    constructor(
        private database: DatabaseService,
        private S3Image: FileUploadService,
        private batchAnalysis: BatchAnalysisService,
    ) {}

    analysis(data: AlgoAnalysisDTO, taskResponse: any, imageArgs: any) {
        // console.log("taskResponse", taskResponse)

        const analyzedImageArgs = imageArgs.analyzedImageArgs;
        const maskImageArgs = imageArgs.maskImageArgs;

        const originalImageArgs = imageArgs.originalImageArgs;

        taskResponse = {
            ver: taskResponse.ver,
            score: taskResponse.score,
            raw: taskResponse.raw,
        };

        const retObj: any = {
            analyzedImage: {
                id: analyzedImageArgs.hash,
                url: analyzedImageArgs.url,
            },
            maskImage: {
                id: maskImageArgs.hash,
                url: maskImageArgs.url,
            },
            originalImage: {
                id: originalImageArgs.hash,
                url: originalImageArgs.url,
            },
        };

        taskResponse = { ...taskResponse, ...retObj };

        return taskResponse;
    }

    async saveData(data: AlgoAnalysisDTO, taskResponse: any, imageRecords: any, originalImage: any, imageArgs: any) {
        const analyzedImage = Buffer.from(taskResponse.img, 'base64');
        const maskImage = Buffer.from(taskResponse.mask, 'base64');
        const originalImageSave = Buffer.from(originalImage, 'base64');

        const analyzedImageArgs = imageArgs.analyzedImageArgs;
        const maskImageArgs = imageArgs.maskImageArgs;

        const originalImageArgs = imageArgs.originalImageArgs;
        await this.S3Image.uploadImage(analyzedImage, analyzedImageArgs.sys_url);
        await this.S3Image.uploadImage(maskImage, maskImageArgs.sys_url);
        await this.S3Image.uploadImage(originalImageSave, originalImageArgs.sys_url);

        delete taskResponse.img;
        delete taskResponse.mask;
        delete taskResponse.err;

        taskResponse = {
            ...taskResponse,
        };

        const environment = {
            deviceModel: data.deviceModel,
            deviceOS: data.deviceOS,
            nth_analysis: imageRecords,
            lat: data.lat,
            long: data.long,
            temperature: data.temperature,
            humidity: data.humidity,
            uv_index: data.uv_index,
            positionNumber: data.positionNumber,
        };

        await this.batchAnalysis.updateEnvironment(data.batch_id, environment);
        const saveSql =
            'INSERT INTO measurements (batch_id, url, sys_url, hash, type_measurement_id, type_image_id, args, scores) values ($1, $2, $3, $4, $5, $6, $7, $8)';
        // const saveArgsSql = 'INSERT INTO shine (batch_id, args) data ($1, $2)';
        const queries = [
            {
                variables: [
                    data.batch_id,
                    analyzedImageArgs.url,
                    analyzedImageArgs.sys_url,
                    analyzedImageArgs.hash,
                    10,
                    18,
                    JSON.stringify({
                        nth_analysis: imageRecords,
                    }),
                    null,
                ],
            },
            {
                // maskImgae

                variables: [
                    data.batch_id,
                    maskImageArgs.url,
                    maskImageArgs.sys_url,
                    maskImageArgs.hash,
                    10,
                    15,
                    JSON.stringify({
                        nth_analysis: imageRecords,
                    }),
                    null,
                ],
            },
            {
                variables: [
                    data.batch_id,
                    originalImageArgs.url,
                    originalImageArgs.sys_url,
                    originalImageArgs.hash,
                    11,
                    21,
                    JSON.stringify({
                        nth_analysis: imageRecords,
                    }),
                    JSON.stringify(taskResponse),
                ],
            },
        ];

        for (let i = 0; i < queries.length; i++) {
            this.database.executeQuery(saveSql, queries[i].variables);
        }

        return 'saved';
    }

    imageArgs(data: AlgoAnalysisDTO) {
        const analyzedImageArgs = this.S3Image.getImageArgs('analyzedImage', data.task.algoName, 'keratin');
        const maskImageArgs = this.S3Image.getImageArgs('maskImage', data.task.algoName, 'keratin');

        const originalImageArgs = this.S3Image.getImageArgs('originalImage', data.task.algoName, 'keratin');

        return {
            analyzedImageArgs: analyzedImageArgs,
            maskImageArgs: maskImageArgs,
            originalImageArgs: originalImageArgs,
        };
    }
}
