import { Injectable, Inject, HttpException } from '@nestjs/common';
import { GetcustomerHistoryDTO } from 'src/common/Dto/customer/analysisHistory/analysisHistory.dto';
import { DatabaseService } from 'src/database/database.service';
import * as celery from 'celery-node';
import { AlgoAnalysisDTO } from 'src/common/Dto/analysis/algoAnalysis.dto';
import fs from 'fs';
import { FileUploadService } from '../../../common/FileUpload/fileUpload.service';
import { KeratinService } from 'src/modules/algorithms/keratin/keratin.service';
import { PoresService } from 'src/modules/algorithms/pores/pores.service';
import { LogError } from 'typeorm-model-generator/dist/src/Utils';
import { PorphyrinService } from 'src/modules/algorithms/porphyrin/porphyrin.service';
import { SebumService } from 'src/modules/algorithms/sebum/sebum.service';
import { SebumTService } from 'src/modules/algorithms/sebumT/sebumT.service';
import { ShineService } from 'src/modules/algorithms/shine/shine.service';
import { SpotsService } from 'src/modules/algorithms/spots/spots.service';
import { SkintoneService } from 'src/modules/algorithms/skinTone/skinTone.service';
import { SkinToneDiorService } from 'src/modules/algorithms/skinToneDior/skinToneDior.service';
import { WrinklesService } from 'src/modules/algorithms/wrinkles/wrinkles.service';
import { SensitivityScabsService } from 'src/modules/algorithms/sensitivityScabs/sensitivityScabs.service';
import { SensitivityRednessService } from 'src/modules/algorithms/sensitivityRedness/sensitivityRedness.service';
import { SensitivtyScalingService } from 'src/modules/algorithms/sensitivtyScaling/sensitivtyScaling.service';
import { FitzSGService } from 'src/modules/algorithms/fitzSG/fitzSG.service';

@Injectable()
export class AlgoAnalysisService {
    constructor(
        private database: DatabaseService,
        private keratin: KeratinService,
        private pores: PoresService,
        private porphyrin: PorphyrinService,
        private sebum: SebumService,
        private sebumT: SebumTService,
        private shine: ShineService,
        private spots: SpotsService,
        private skintone: SkintoneService,
        private skintone_dior: SkinToneDiorService,
        private wrinkles: WrinklesService,
        private sensitivityScabs: SensitivityScabsService,
        private sensitivityredness: SensitivityRednessService,
        private sensitivityScaling: SensitivtyScalingService,
        private fitzSG: FitzSGService,
        private S3Image: FileUploadService,
    ) {}

    getTaskByAlgoType(type: string) {
        switch (type) {
            case 'keratin':
                return { taskName: 'CNDP_SkinKeratin', algoName: 'keratin' };
            case 'pores':
                return { taskName: 'CNDP_SkinPore', algoName: 'pores' };
            case 'porphyrin':
                return { taskName: 'CNDP_SkinPorphyrin', algoName: 'porphyrin' };
            case 'sebum':
                return { taskName: 'CNDP_SkinSebum', algoName: 'sebum' };
            case 'shine':
                return { taskName: 'CNDP_SkinShine', algoName: 'shine' };
            case 'spots':
                return { taskName: 'CNDP_SkinSpots', algoName: 'spots' };
            case 'skintone':
                return { taskName: 'CNDP_SkinTone', algoName: 'skintone' };
            case 'skintone_dior':
                return { taskName: 'CNDP_SkinTone_Dior', algoName: 'skintone_dior' };
            case 'wrinkles':
                return { taskName: 'CNDP_SkinWrinkles', algoName: 'wrinkles' };
            case 'sensitivityscabs':
                return { taskName: 'CNDP_SensScabs', algoName: 'sensitivityscabs' };
            case 'sensitivityscaling':
                return { taskName: 'CNDP_SensScaling', algoName: 'sensitivityscaling' };
            case 'sensitivityredness':
                return { taskName: 'CNDP_SensRedness', algoName: 'sensitivityredness' };
            case 'fitzSG':
                return { taskName: 'CNDP_FitzSG', algoName: 'fitzSG' };
            default:
                throw new Error('Wrong algorithm TYPE!');
        }
    }

    async handleAnalysis(data: AlgoAnalysisDTO, taskResponse: any, imageArgs: any) {
        try {
            switch (data.type) {
                case 'keratin':
                    return this.keratin.analysis(data, taskResponse, imageArgs);

                case 'pores':
                    return this.pores.analysis(data, taskResponse, imageArgs);
                case 'porphyrin':
                    return this.porphyrin.analysis(data, taskResponse, imageArgs);
                case 'sebum':
                    return this.sebum.analysis(data, taskResponse, imageArgs);
                // case 'sebumT':
                //     return this.sebumT.analysis(data, taskResponse);
                case 'shine':
                    return this.shine.analysis(data, taskResponse, imageArgs);
                case 'spots':
                    return this.spots.analysis(data, taskResponse, imageArgs);
                case 'skintone':
                    return this.skintone.analysis(data, taskResponse, imageArgs);
                case 'skintone_dior':
                    return this.skintone_dior.analysis(data, taskResponse, imageArgs);
                case 'wrinkles':
                    return this.wrinkles.analysis(data, taskResponse, imageArgs);
                case 'sensitivityscabs':
                    return this.sensitivityScabs.analysis(data, taskResponse, imageArgs);
                case 'sensitivityscaling':
                    return this.sensitivityScaling.analysis(data, taskResponse, imageArgs);
                case 'sensitivityredness':
                    return this.sensitivityredness.analysis(data, taskResponse, imageArgs);
                // case 'fitzSG':
                //     return this.fitzSG.analysis(data, taskResponse, imageArgs);
                default:
                    throw new Error('No such analysis type');
            }
        } catch (e) {
            console.log(e);
        }
    }

    async handleSaving(
        data: AlgoAnalysisDTO,
        taskResponse: any,
        imageRecords: any,
        originalImage: any,
        imageArgs: any,
    ) {
        switch (data.type) {
            case 'keratin':
                this.keratin.saveData(data, taskResponse, imageRecords, originalImage, imageArgs);

                return;
            case 'pores':
                return this.pores.saveData(data, taskResponse, imageRecords, originalImage, imageArgs);
            case 'porphyrin':
                return this.porphyrin.saveData(data, taskResponse, imageRecords, originalImage, imageArgs);
            case 'sebum':
                return this.sebum.saveData(data, taskResponse, imageRecords, originalImage, imageArgs);
            // case 'sebumT':
            //     return this.sebumT.saveData(data, taskResponse, imageRecords, originalImage);
            case 'shine':
                return this.shine.saveData(data, taskResponse, imageRecords, originalImage, imageArgs);
            case 'spots':
                return this.spots.saveData(data, taskResponse, imageRecords, originalImage, imageArgs);
            case 'skintone':
                return this.skintone.saveData(data, taskResponse, imageRecords, originalImage, imageArgs);
            case 'skintone_dior':
                return this.skintone_dior.saveData(data, taskResponse, imageRecords, originalImage, imageArgs);
            case 'wrinkles':
                return this.wrinkles.saveData(data, taskResponse, imageRecords, originalImage, imageArgs);
            case 'sensitivityscabs':
                return this.sensitivityScabs.saveData(data, taskResponse, imageRecords, originalImage, imageArgs);
            case 'sensitivityscaling':
                return this.sensitivityScaling.saveData(data, taskResponse, imageRecords, originalImage, imageArgs);
            case 'sensitivityredness':
                return this.sensitivityredness.saveData(data, taskResponse, imageRecords, originalImage, imageArgs);
            case 'fitzSG':
                return this.fitzSG.saveData(data, taskResponse, imageRecords, originalImage, imageArgs);
            default:
                throw new Error('No such analysis type');
        }
    }

    handleImageArg(data: any) {
        let analyzedImageArgs;
        let analyzedImageArgsM;
        let analyzedImageArgsB;
        let maskImageArgs;
        let maskImageArgsM;
        let maskImageArgsB;
        let originalImageArgs;

        let analyzedImageRedArgs;
        let analyzedImageGreenArgs;
        let maskRImageArgs;
        let maskGImageArgs;
        let analyzedImageArgsYellow;
        let analyzedImageArgsOrange;
        let analyzedImageArgsGreen;
        let maskImageArgsYellow;
        let maskImageArgsOrange;
        let maskImageArgsGreen;
        let maskImageArgsBlack;

        switch (data.type) {
            case 'keratin':
                analyzedImageArgs = this.S3Image.getImageArgs('analyzedImage', data.task.algoName, 'keratin');
                maskImageArgs = this.S3Image.getImageArgs('maskImage', data.task.algoName, 'keratin');

                originalImageArgs = this.S3Image.getImageArgs('originalImage', data.task.algoName, 'keratin');
                return {
                    analyzedImageArgs: analyzedImageArgs,
                    maskImageArgs: maskImageArgs,
                    originalImageArgs: originalImageArgs,
                };
            case 'pores':
                analyzedImageArgs = this.S3Image.getImageArgs('analyzedImage', data.task.algoName, 'pores');
                analyzedImageArgs = this.S3Image.getImageArgs('analyzedImageSmall', data.task.algoName, 'pores');
                analyzedImageArgsM = this.S3Image.getImageArgs('analyzedImageMedium', data.task.algoName, 'pores');
                analyzedImageArgsB = this.S3Image.getImageArgs('analyzedImageBig', data.task.algoName, 'pores');
                maskImageArgs = this.S3Image.getImageArgs('maskImageSmall', data.task.algoName, 'pores');
                maskImageArgsM = this.S3Image.getImageArgs('maskImageMedium', data.task.algoName, 'pores');
                maskImageArgsB = this.S3Image.getImageArgs('maskImageBig', data.task.algoName, 'pores');
                originalImageArgs = this.S3Image.getImageArgs('originalImage', data.task.algoName, 'pores');
                return {
                    analyzedImageArgs: analyzedImageArgs,
                    analyzedImageArgsM: analyzedImageArgsM,
                    analyzedImageArgsB: analyzedImageArgsB,
                    maskImageArgs: maskImageArgs,
                    maskImageArgsM: maskImageArgsM,
                    maskImageArgsB: maskImageArgsB,
                    originalImageArgs: originalImageArgs,
                };
            case 'porphyrin':
                analyzedImageArgs = this.S3Image.getImageArgs('analyzedImage', data.task.algoName, 'porphyrin');
                analyzedImageRedArgs = this.S3Image.getImageArgs('analyzedImageRed', data.task.algoName, 'porphyrin');
                analyzedImageGreenArgs = this.S3Image.getImageArgs(
                    'analyzedImageGreen',
                    data.task.algoName,
                    'porphyrin',
                );
                maskRImageArgs = this.S3Image.getImageArgs('maskImageR', data.task.algoName, 'porphyrin');
                maskGImageArgs = this.S3Image.getImageArgs('maskImageG', data.task.algoName, 'porphyrin');

                originalImageArgs = this.S3Image.getImageArgs('originalImage', data.task.algoName, 'porphyrin');
                return {
                    analyzedImageArgs: analyzedImageArgs,
                    analyzedImageRedArgs: analyzedImageRedArgs,
                    analyzedImageGreenArgs: analyzedImageGreenArgs,
                    maskRImageArgs: maskRImageArgs,
                    maskGImageArgs: maskGImageArgs,
                    originalImageArgs: originalImageArgs,
                };
            case 'sebum':
                analyzedImageArgs = this.S3Image.getImageArgs('analyzedImage', data.task.algoName, 'sebum');
                maskImageArgs = this.S3Image.getImageArgs('maskImage', data.task.algoName, 'sebum');

                originalImageArgs = this.S3Image.getImageArgs('originalImage', data.task.algoName, 'sebum');

                return {
                    analyzedImageArgs: analyzedImageArgs,
                    maskImageArgs: maskImageArgs,
                    originalImageArgs: originalImageArgs,
                };
            // case 'sebumT':
            //     return this.sebumT.saveData(data, taskResponse, imageRecords, originalImage);
            case 'shine':
                analyzedImageArgs = this.S3Image.getImageArgs('analyzedImage', data.task.algoName, 'shine');
                maskImageArgs = this.S3Image.getImageArgs('maskImage', data.task.algoName, 'shine');

                originalImageArgs = this.S3Image.getImageArgs('originalImage', data.task.algoName, 'shine');
                return {
                    analyzedImageArgs: analyzedImageArgs,
                    maskImageArgs: maskImageArgs,
                    originalImageArgs: originalImageArgs,
                };
            case 'spots':
                analyzedImageArgs = this.S3Image.getImageArgs('analyzedImage', data.task.algoName, 'spots');
                analyzedImageArgsYellow = this.S3Image.getImageArgs('analyzedImageYellow', data.task.algoName, 'spots');
                analyzedImageArgsOrange = this.S3Image.getImageArgs('analyzedImageOrange', data.task.algoName, 'spots');
                analyzedImageArgsGreen = this.S3Image.getImageArgs('analyzedImageGreen', data.task.algoName, 'spots');
                maskImageArgsYellow = this.S3Image.getImageArgs('maskImageYellow', data.task.algoName, 'spots');
                maskImageArgsOrange = this.S3Image.getImageArgs('maskImageOrange', data.task.algoName, 'spots');
                maskImageArgsGreen = this.S3Image.getImageArgs('maskImageGreen', data.task.algoName, 'spots');
                originalImageArgs = this.S3Image.getImageArgs('originalImage', data.task.algoName, 'spots');
                return {
                    analyzedImageArgsYellow: analyzedImageArgsYellow,
                    analyzedImageArgsOrange: analyzedImageArgsOrange,
                    analyzedImageArgsGreen: analyzedImageArgsGreen,
                    maskImageArgsYellow: maskImageArgsYellow,
                    maskImageArgsOrange: maskImageArgsOrange,
                    maskImageArgsGreen: maskImageArgsGreen,
                    analyzedImageArgs: analyzedImageArgs,
                    originalImageArgs: originalImageArgs,
                };
            case 'skintone':
                analyzedImageArgs = this.S3Image.getImageArgs('analyzedImage', data.task.algoName, 'skintone');

                originalImageArgs = this.S3Image.getImageArgs('originalImage', data.task.algoName, 'skintone');

                return { analyzedImageArgs: analyzedImageArgs, originalImageArgs: originalImageArgs };
            case 'skintone_dior':
                analyzedImageArgs = this.S3Image.getImageArgs('analyzedImage', data.task.algoName, 'skintone');

                originalImageArgs = this.S3Image.getImageArgs('originalImage', data.task.algoName, 'skintone');

                return { analyzedImageArgs: analyzedImageArgs, originalImageArgs: originalImageArgs };

            case 'wrinkles':
                analyzedImageArgs = this.S3Image.getImageArgs('analyzedImage', data.task.algoName, 'wrinkles');

                maskImageArgsYellow = this.S3Image.getImageArgs('maskImageYellow', data.task.algoName, 'wrinkles');
                maskImageArgsOrange = this.S3Image.getImageArgs('maskImageOrange', data.task.algoName, 'wrinkles');
                maskImageArgsGreen = this.S3Image.getImageArgs('maskImageGreen', data.task.algoName, 'wrinkles');
                maskImageArgsBlack = this.S3Image.getImageArgs('maskImageBlack', data.task.algoName, 'wrinkles');
                originalImageArgs = this.S3Image.getImageArgs('originalImage', data.task.algoName, 'wrinkles');
                return {
                    analyzedImageArgs: analyzedImageArgs,
                    maskImageArgsYellow: maskImageArgsYellow,
                    maskImageArgsOrange: maskImageArgsOrange,
                    maskImageArgsGreen: maskImageArgsGreen,
                    maskImageArgsBlack: maskImageArgsBlack,
                    originalImageArgs: originalImageArgs,
                };
            case 'sensitivityscabs':
                analyzedImageArgs = this.S3Image.getImageArgs('analyzedImage', data.task.algoName, 'sensitivityscabs');
                maskImageArgs = this.S3Image.getImageArgs('maskImage', data.task.algoName, 'sensitivityscabs');

                originalImageArgs = this.S3Image.getImageArgs('originalImage', data.task.algoName, 'sensitivityscabs');

                return {
                    analyzedImageArgs: analyzedImageArgs,
                    maskImageArgs: maskImageArgs,
                    originalImageArgs: originalImageArgs,
                };
            case 'sensitivityscaling':
                analyzedImageArgs = this.S3Image.getImageArgs('analyzedImage', data.task.algoName, 'sensitivityscabs');
                maskImageArgs = this.S3Image.getImageArgs('maskImage', data.task.algoName, 'sensitivityscabs');

                originalImageArgs = this.S3Image.getImageArgs('originalImage', data.task.algoName, 'sensitivityscabs');

                return {
                    analyzedImageArgs: analyzedImageArgs,
                    maskImageArgs: maskImageArgs,
                    originalImageArgs: originalImageArgs,
                };
            case 'sensitivityredness':
                analyzedImageArgs = this.S3Image.getImageArgs('analyzedImage', data.task.algoName, 'sensitivityscabs');
                maskImageArgs = this.S3Image.getImageArgs('maskImage', data.task.algoName, 'sensitivityscabs');

                originalImageArgs = this.S3Image.getImageArgs('originalImage', data.task.algoName, 'sensitivityscabs');

                return {
                    analyzedImageArgs: analyzedImageArgs,
                    maskImageArgs: maskImageArgs,
                    originalImageArgs: originalImageArgs,
                };
            case 'fitzSG':
                return;
            default:
                throw new Error('No such analysis type');
        }
    }

    async finalAnalysis(data: AlgoAnalysisDTO, imageRecords: any, taskResponse: any, imageArg: any) {
        try {
            if (taskResponse.err) {
                throw new HttpException(`analysis - ${data.task.taskName} -> ${data.type}`, 40004);
            }

            let args = await this.handleAnalysis(data, taskResponse, imageArg);
            let responseBody = {
                batchId: data.batch_id,
                algorithm_type: data.type,
                ...args,
            };

            return responseBody;
        } catch (e) {
            console.log(e);
        }
    }

    async finalSave(
        data: AlgoAnalysisDTO,
        image: Express.Multer.File,
        imageRecords: any,
        taskResponse: any,
        imageArg: any,
    ) {
        if (taskResponse.err) {
            throw new HttpException(`analysis - ${data.task.taskName} -> ${data.type}`, 40004);
        }

        let args = await this.handleSaving(data, taskResponse, imageRecords, image.buffer, imageArg);
        let responseBody = {
            batchId: data.batch_id,
            algorithm_type: data.type,
            ...args,
        };

        return responseBody;
    }

    async insertImage(batch_id: any, url: string, sys_url: string, hash: string, type_image_id: any, args: any) {
        try {
            const insert = this.database.executeQuery(
                `
                  INSERT INTO images (batch_id, url, sys_url, hash, type_image_id, args) 
                  values (${batch_id}, '${url}', '${sys_url}', '${hash}', ${type_image_id}, '${args}')
                  `,
            );
            return (await insert).length;
        } catch (e) {
            throw new Error(e);
        }
    }

    async getImage(name: any) {
        try {
            const mesureId = await this.database.executeQuery(`SELECT id FROM type_images WHERE name = '${name}'`);
            if (mesureId['rows'][0]['id']) {
                return mesureId['rows'][0]['id'];
            } else {
                throw new Error('Image was not found');
            }
        } catch (e) {
            throw new Error(e);
        }
    }
}
