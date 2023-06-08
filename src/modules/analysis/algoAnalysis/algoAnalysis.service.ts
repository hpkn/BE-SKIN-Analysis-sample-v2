import { Injectable, Inject, HttpException, ConsoleLogger, BadRequestException } from '@nestjs/common';
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
import { promises } from 'dns';
import { OfflineDatasDTO } from 'src/common/Dto/analysis/offlineData.dto';

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

    handleAnalysis(data: AlgoAnalysisDTO, taskResponse: any, imageArgs: any) {
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
            // case 'skintone_dior':
            //     return this.skintone_dior.saveData(data, taskResponse, imageRecords, originalImage, imageArgs);
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
        let analyzedImageArgsS;
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
        let maskImageSmall;

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
                analyzedImageArgsS = this.S3Image.getImageArgs('analyzedImageSmall', data.task.algoName, 'pores');
                analyzedImageArgsM = this.S3Image.getImageArgs('analyzedImageMedium', data.task.algoName, 'pores');
                analyzedImageArgsB = this.S3Image.getImageArgs('analyzedImageBig', data.task.algoName, 'pores');
                maskImageSmall = this.S3Image.getImageArgs('maskImageSmall', data.task.algoName, 'pores');
                maskImageArgsM = this.S3Image.getImageArgs('maskImageMedium', data.task.algoName, 'pores');
                maskImageArgsB = this.S3Image.getImageArgs('maskImageBig', data.task.algoName, 'pores');

                originalImageArgs = this.S3Image.getImageArgs('originalImage', data.task.algoName, 'pores');
                return {
                    analyzedImageArgs: analyzedImageArgs,
                    analyzedImageArgsM: analyzedImageArgsM,
                    analyzedImageArgsB: analyzedImageArgsB,
                    // maskImageArgs: maskImageArgs,
                    maskImageSmall: maskImageSmall,
                    maskImageArgsM: maskImageArgsM,
                    maskImageArgsB: maskImageArgsB,
                    originalImageArgs: originalImageArgs,
                    analyzedImageArgsS: analyzedImageArgsS,
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

    //Data Offline Saving

    saveOfflineData(data: OfflineDatasDTO, imageRecords: any, imageArgs: any) {
        try {
            switch (data.type) {
                case 'keratin':
                    return this.keratin.offlineSaveData(data, imageRecords, imageArgs);

                case 'pores':
                    return this.pores.offlineSaveData(data, imageRecords, imageArgs);
                case 'porphyrin':
                    return this.porphyrin.offlineSaveData(data, imageRecords, imageArgs);
                case 'sebum':
                    return this.sebum.offlineSaveData(data, imageRecords, imageArgs);
                // case 'sebumT':
                //     return this.sebumT.analysis(data, taskResponse);
                case 'shine':
                    return this.shine.offlineSaveData(data, imageRecords, imageArgs);
                case 'spots':
                    return this.spots.offlineSaveData(data, imageRecords, imageArgs);
                case 'skintone':
                    return this.skintone.offlineSaveData(data, imageRecords, imageArgs);
                // case 'skintone_dior':
                //     return this.skintone_dior.offlineSaveData(data, imageRecords, imageArgs);
                case 'wrinkles':
                    return this.wrinkles.offlineSaveData(data, imageRecords, imageArgs);
                case 'sensitivityscabs':
                    return this.sensitivityScabs.offlineSaveData(data, imageRecords, imageArgs);
                case 'sensitivityscaling':
                    return this.sensitivityScaling.offlineSaveData(data, imageRecords, imageArgs);
                case 'sensitivityredness':
                    return this.sensitivityredness.offlineSaveData(data, imageRecords, imageArgs);
                // case 'fitzSG':
                //     return this.fitzSG.analysis(data, imageRecords, imageArgs);
                default:
                    throw new BadRequestException({
                        status: 400,
                        message: 'Analysis Type is incorrect',
                    });
            }
        } catch (e) {
            console.log(e);
        }
    }

    // offline image args
    handleofflineImageArg(data: any) {
        let analyzedImageArgs;

        let originalImageArgs;

        switch (data.type) {
            case 'keratin':
                analyzedImageArgs = this.S3Image.getImageArgs('analyzedImage', data.type, 'keratin');

                originalImageArgs = this.S3Image.getImageArgs('originalImage', data.type, 'keratin');
                return {
                    analyzedImageArgs: analyzedImageArgs,

                    originalImageArgs: originalImageArgs,
                };
            case 'pores':
                analyzedImageArgs = this.S3Image.getImageArgs('analyzedImage', data.type, 'pores');

                originalImageArgs = this.S3Image.getImageArgs('originalImage', data.type, 'pores');
                return {
                    analyzedImageArgs: analyzedImageArgs,
                    originalImageArgs: originalImageArgs,
                };
            case 'porphyrin':
                analyzedImageArgs = this.S3Image.getImageArgs('analyzedImage', data.type, 'porphyrin');

                originalImageArgs = this.S3Image.getImageArgs('originalImage', data.type, 'porphyrin');
                return {
                    analyzedImageArgs: analyzedImageArgs,

                    originalImageArgs: originalImageArgs,
                };
            case 'sebum':
                analyzedImageArgs = this.S3Image.getImageArgs('analyzedImage', data.type, 'sebum');

                originalImageArgs = this.S3Image.getImageArgs('originalImage', data.type, 'sebum');

                return {
                    analyzedImageArgs: analyzedImageArgs,

                    originalImageArgs: originalImageArgs,
                };
            // case 'sebumT':
            //     return this.sebumT.saveData(data, taskResponse, imageRecords, originalImage);
            case 'shine':
                analyzedImageArgs = this.S3Image.getImageArgs('analyzedImage', data.type, 'shine');

                originalImageArgs = this.S3Image.getImageArgs('originalImage', data.type, 'shine');
                return {
                    analyzedImageArgs: analyzedImageArgs,
                    originalImageArgs: originalImageArgs,
                };
            case 'spots':
                analyzedImageArgs = this.S3Image.getImageArgs('analyzedImage', data.type, 'spots');

                originalImageArgs = this.S3Image.getImageArgs('originalImage', data.type, 'spots');
                return {
                    analyzedImageArgs: analyzedImageArgs,
                    originalImageArgs: originalImageArgs,
                };
            case 'skintone':
                analyzedImageArgs = this.S3Image.getImageArgs('analyzedImage', data.type, 'skintone');

                originalImageArgs = this.S3Image.getImageArgs('originalImage', data.type, 'skintone');

                return { analyzedImageArgs: analyzedImageArgs, originalImageArgs: originalImageArgs };
            case 'skintone_dior':
                analyzedImageArgs = this.S3Image.getImageArgs('analyzedImage', data.type, 'skintone');

                originalImageArgs = this.S3Image.getImageArgs('originalImage', data.type, 'skintone');

                return { analyzedImageArgs: analyzedImageArgs, originalImageArgs: originalImageArgs };

            case 'wrinkles':
                analyzedImageArgs = this.S3Image.getImageArgs('analyzedImage', data.type, 'wrinkles');
                originalImageArgs = this.S3Image.getImageArgs('originalImage', data.type, 'wrinkles');
                return {
                    analyzedImageArgs: analyzedImageArgs,

                    originalImageArgs: originalImageArgs,
                };
            case 'sensitivityscabs':
                analyzedImageArgs = this.S3Image.getImageArgs('analyzedImage', data.type, 'sensitivityscabs');

                originalImageArgs = this.S3Image.getImageArgs('originalImage', data.type, 'sensitivityscabs');

                return {
                    analyzedImageArgs: analyzedImageArgs,
                    originalImageArgs: originalImageArgs,
                };
            case 'sensitivityscaling':
                analyzedImageArgs = this.S3Image.getImageArgs('analyzedImage', data.type, 'sensitivityscabs');
                originalImageArgs = this.S3Image.getImageArgs('originalImage', data.type, 'sensitivityscabs');

                return {
                    analyzedImageArgs: analyzedImageArgs,

                    originalImageArgs: originalImageArgs,
                };
            case 'sensitivityredness':
                analyzedImageArgs = this.S3Image.getImageArgs('analyzedImage', data.type, 'sensitivityscabs');

                originalImageArgs = this.S3Image.getImageArgs('originalImage', data.type, 'sensitivityscabs');

                return {
                    analyzedImageArgs: analyzedImageArgs,

                    originalImageArgs: originalImageArgs,
                };
            case 'fitzSG':
                return;
            default:
                throw new Error('No such analysis type');
        }
    }

    // OfflinesaveDataImage
    async saveOfflineImage(data: OfflineDatasDTO, originalImage: any, analyzedImage: any, imageArgs: any) {
        try {
            switch (data.type) {
                case 'keratin':
                    return this.keratin.offlinesaveDataImage(originalImage, analyzedImage, imageArgs);

                case 'pores':
                    return this.pores.offlinesaveDataImage(originalImage, analyzedImage, imageArgs);
                case 'porphyrin':
                    return this.porphyrin.offlinesaveDataImage(originalImage, analyzedImage, imageArgs);
                case 'sebum':
                    return this.sebum.offlinesaveDataImage(originalImage, analyzedImage, imageArgs);
                // case 'sebumT':
                //     return this.sebumT.analysis(data, taskResponse);
                case 'shine':
                    return this.shine.offlinesaveDataImage(originalImage, analyzedImage, imageArgs);
                case 'spots':
                    return this.spots.offlinesaveDataImage(originalImage, analyzedImage, imageArgs);
                case 'skintone':
                    return this.skintone.offlinesaveDataImage(originalImage, analyzedImage, imageArgs);
                // case 'skintone_dior':
                //     return this.skintone_dior.offlineSaveData(originalImage, analyzedImage, imageArgs);
                case 'wrinkles':
                    return this.wrinkles.offlinesaveDataImage(originalImage, analyzedImage, imageArgs);
                case 'sensitivityscabs':
                    return this.sensitivityScabs.offlinesaveDataImage(originalImage, analyzedImage, imageArgs);
                case 'sensitivityscaling':
                    return this.sensitivityScaling.offlinesaveDataImage(originalImage, analyzedImage, imageArgs);
                case 'sensitivityredness':
                    return this.sensitivityredness.offlinesaveDataImage(originalImage, analyzedImage, imageArgs);
                // case 'fitzSG':
                //     return this.fitzSG.analysis(originalImage, analyzedImage, imageArgs);
                default:
                    throw new BadRequestException({
                        status: 400,
                        message: 'Analysis Type is incorrect',
                    });
            }
        } catch (e) {
            console.log(e);
        }
    }
    async SaveDataFinal(data: OfflineDatasDTO, imageRecords: any, imageArg: any) {
        try {
            let args = await this.saveOfflineData(data, imageRecords, imageArg);

            return 'saved';
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
                    INSERT INTO images (batch_id,  url, sys  url, hash, type_image_id, args) 
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

    async getAnalysisData(batch_id: any) {
        console.log('here param', batch_id);
        try {
            const mesureId = await this.database.executeQuery(
                `SELECT 
                    analysis.batch_id,
                    ROUND( AVG ( ( scores ->> 'score' ) :: NUMERIC ) FILTER ( WHERE type_measurement_id = 1 ), 2 ) AS pores_score,
                    ROUND( AVG ( ( scores ->> 'score' ) :: NUMERIC ) FILTER ( WHERE type_measurement_id = 2 ), 2 ) AS sensitivity_scaling_score,
                    ROUND( AVG ( ( scores ->> 'score' ) :: NUMERIC ) FILTER ( WHERE type_measurement_id = 3 ), 2 ) AS porphiryn_score,
                    ROUND( AVG ( ( scores ->> 'score' ) :: NUMERIC ) FILTER ( WHERE type_measurement_id = 4 ), 2 ) AS wrinkles_score,
                    ROUND( AVG ( ( scores ->> 'score' ) :: NUMERIC ) FILTER ( WHERE type_measurement_id = 5 ), 2 ) AS sebum_u_score,
                    ROUND( AVG ( ( scores ->> 'score' ) :: NUMERIC ) FILTER ( WHERE type_measurement_id = 6 ), 2 ) AS skintone_score,
                    ROUND( AVG ( ( scores ->> 'score' ) :: NUMERIC ) FILTER ( WHERE type_measurement_id = 8 ), 2 ) AS spots_score,
                    ROUND( AVG ( ( scores ->> 'score' ) :: NUMERIC ) FILTER ( WHERE type_measurement_id = 9 ), 2 ) AS sebum_t_score, 
                    ROUND( AVG ( ( scores ->> 'score' ) :: NUMERIC ) FILTER ( WHERE type_measurement_id = 10 ), 2 ) AS shine_score,
                    ROUND( AVG ( ( scores ->> 'score' ) :: NUMERIC ) FILTER ( WHERE type_measurement_id = 11 ), 2 ) AS keratin_score,
                    ROUND( AVG ( ( scores ->> 'score' ) :: NUMERIC ) FILTER ( WHERE type_measurement_id = 12 ), 2 ) AS sensitivity_redness_score,
                    ROUND( AVG ( ( scores ->> 'score' ) :: NUMERIC ) FILTER ( WHERE type_measurement_id = 14 ), 2 ) AS sensitivity_scabs_score,
                    ROUND( AVG ( ( scores ->> 'score' ) :: NUMERIC ) FILTER ( WHERE type_measurement_id = 15 ), 2 ) AS sebum_score,
                    ROUND( AVG ( ( scores ->> 'score' ) :: NUMERIC ) FILTER ( WHERE type_measurement_id = 16 ), 2 ) AS moisture_t_score,
                    ROUND( AVG ( ( scores ->> 'score' ) :: NUMERIC ) FILTER ( WHERE type_measurement_id = 17 ), 2 ) AS moisture_u_score
                FROM analysis
                    LEFT JOIN answers_to_questions ON analysis.batch_id = answers_to_questions.batch_id
                    LEFT JOIN measurements ON analysis.batch_id = measurements.batch_id
                    LEFT JOIN type_measurements ON type_measurement_id = type_measurements."id" 
                WHERE
                    analysis.batch_id = $1 
                    AND type_image_id = 21    
                GROUP BY analysis.batch_id`,
                [batch_id],
            );
            console.log('here we are', mesureId);

            return mesureId[0];
            // if (mesureId['rows'][0]['id']) {
            //     return mesureId['rows'][0]['id'];
            // } else {
            //     throw new Error('Image was not found');
            // }
        } catch (e) {
            console.log(e);
            throw new Error(e);
        }
    }

    async getImageByBatch(batch_id: any) {
        try {
            const image = await this.database.executeQuery(
                `
                SELECT tps."name", ms.url
                FROM measurements ms 
                    LEFT JOIN type_measurements tps ON tps."id" = ms.type_measurement_id
                WHERE
                    batch_id = $1
                    AND type_image_id = 21`,
                [batch_id],
            );

            return image;
            // if (mesureId['rows'][0]['id']) {
            //     return mesureId['rows'][0]['id'];
            // } else {
            //     throw new Error('Image was not found');
            // }
        } catch (e) {
            throw new Error(e);
        }
    }

    async getAnalysisByBatchId(batch_id: number) {
        const result = await this.database.executeQuery(
            `SELECT 
                    analysis.batch_id,
                    to_timestamp(cast(analysis.created_time as TEXT), 'YYYY-MM-DD HH24:MI:SS') AS date,
                    ROUND( AVG ( ( scores ->> 'score' ) :: NUMERIC ) FILTER ( WHERE type_measurement_id = 1 ), 2 ) AS pores_score,
                    ROUND( AVG ( ( scores ->> 'score' ) :: NUMERIC ) FILTER ( WHERE type_measurement_id = 2 ), 2 ) AS sensitivity_scaling_score,
                    ROUND( AVG ( ( scores ->> 'score' ) :: NUMERIC ) FILTER ( WHERE type_measurement_id = 3 ), 2 ) AS porphiryn_score,
                    ROUND( AVG ( ( scores ->> 'score' ) :: NUMERIC ) FILTER ( WHERE type_measurement_id = 4 ), 2 ) AS wrinkles_score,
                    ROUND( AVG ( ( scores ->> 'score' ) :: NUMERIC ) FILTER ( WHERE type_measurement_id = 5 ), 2 ) AS sebum_u_score,
                    ROUND( AVG ( ( scores ->> 'score' ) :: NUMERIC ) FILTER ( WHERE type_measurement_id = 6 ), 2 ) AS skintone_score,
                    ROUND( AVG ( ( scores ->> 'score' ) :: NUMERIC ) FILTER ( WHERE type_measurement_id = 8 ), 2 ) AS spots_score,
                    ROUND( AVG ( ( scores ->> 'score' ) :: NUMERIC ) FILTER ( WHERE type_measurement_id = 9 ), 2 ) AS sebum_t_score, 
                    ROUND( AVG ( ( scores ->> 'score' ) :: NUMERIC ) FILTER ( WHERE type_measurement_id = 10 ), 2 ) AS shine_score,
                    ROUND( AVG ( ( scores ->> 'score' ) :: NUMERIC ) FILTER ( WHERE type_measurement_id = 11 ), 2 ) AS keratin_score,
                    ROUND( AVG ( ( scores ->> 'score' ) :: NUMERIC ) FILTER ( WHERE type_measurement_id = 12 ), 2 ) AS sensitivity_redness_score,
                    ROUND( AVG ( ( scores ->> 'score' ) :: NUMERIC ) FILTER ( WHERE type_measurement_id = 14 ), 2 ) AS sensitivity_scabs_score,
                    ROUND( AVG ( ( scores ->> 'score' ) :: NUMERIC ) FILTER ( WHERE type_measurement_id = 15 ), 2 ) AS sebum_score,
                    ROUND( AVG ( ( scores ->> 'score' ) :: NUMERIC ) FILTER ( WHERE type_measurement_id = 16 ), 2 ) AS moisture_t_score,
                    ROUND( AVG ( ( scores ->> 'score' ) :: NUMERIC ) FILTER ( WHERE type_measurement_id = 17 ), 2 ) AS moisture_u_score,
                    ROUND( AVG ( ( scores ->> 'score' ) :: NUMERIC ) FILTER ( WHERE type_measurement_id = 18 ), 2 ) AS moisture_score
                FROM analysis
                    LEFT JOIN answers_to_questions ON analysis.batch_id = answers_to_questions.batch_id
                    LEFT JOIN measurements ON analysis.batch_id = measurements.batch_id
                    LEFT JOIN type_measurements ON type_measurement_id = type_measurements."id" 
                WHERE
                    analysis.batch_id = $1 
                    AND type_image_id = 21    
                GROUP BY analysis.batch_id`,
            [batch_id],
        );
        return result[0];
    }

    //get all batch_id of customer

    async getCustomerBatchID(customer_id: number, per: number, page: number): Promise<any[]> {
        let offset = (page - 1) * per;

        let batchIds: any;
        if (!per || !page) {
            batchIds = await this.database.executeQuery(
                `SELECT batch_id FROM analysis WHERE customer_id = '${customer_id}'`,
            );
        } else {
            batchIds = await this.database.executeQuery(
                `SELECT batch_id FROM analysis WHERE customer_id = '${customer_id}' LIMIT ${per} OFFSET ${offset}`,
            );
        }

        return batchIds;
    }

    async userAnalysisHistory(customer_id: number, per: number, page: number): Promise<any[]> {
        let batchIds = await this.getCustomerBatchID(customer_id, per, page);

        const promises: Promise<any>[] = [];
        // geting result
        for (const batchId of batchIds) {
            promises.push(this.getAnalysisByBatchId(batchId['batch_id']));
        }

        try {
            const resultObj = await Promise.all(promises);
            // remooving empty object
            const nonEmptyResults: any[] = resultObj.filter((result) => result !== undefined);
            nonEmptyResults.map((val) => {
                val.customer_id = customer_id;
                val.sens_redness_combined_score = null;
                val.keratin_score = val.keratin_score === null ? null : Number(val.keratin_score);
                val.pores_score = val.pores_score === null ? null : Number(val.pores_score);
                val.sensitivity_redness_score =
                    val.sensitivity_redness_score === null ? null : Number(val.sensitivity_redness_score);
                val.spots_score = val.spots_score === null ? null : Number(val.spots_score);
                val.wrinkles_score = val.wrinkles_score === null ? null : Number(val.wrinkles_score);
                val.porphiryn_score = val.porphiryn_score === null ? null : Number(val.porphiryn_score);
                val.moisture_score = val.moisture_score === null ? null : Number(val.moisture_score);
                val.sebum_score = val.sebum_score === null ? null : Number(val.sebum_score);
                val.shine_score = val.shine_score === null ? null : Number(val.shine_score);
                val.skintone_score = val.skintone_score === null ? null : Number(val.skintone_score);
                val.sensitivity_scabs_score =
                    val.sensitivity_scabs_score === null ? null : Number(val.sensitivity_scabs_score);
                val.sensitivity_scaling_score =
                    val.sensitivity_scaling_score === null ? null : Number(val.sensitivity_scaling_score);
                val.moisture_u_score = val.moisture_u_score === null ? null : Number(val.moisture_u_score);
                val.moisture_t_score = val.moisture_t_score === null ? null : Number(val.moisture_t_score);
                val.sebum_u_score = val.sebum_u_score === null ? null : Number(val.sebum_u_score);
                val.sebum_t_score = val.sebum_t_score === null ? null : Number(val.sebum_t_score);
            });

            return nonEmptyResults;
        } catch (error) {
            console.log(error);
            throw error;
        }

        // await this.getAnalysisByBatchId
    }

    async getImageData(batch_id: number) {
        const result = await this.database.executeQuery(
            `
            SELECT  url,
            CASE 
                WHEN type_measurement_id = 1 THEN 'pores'
                WHEN type_measurement_id = 2 THEN 'sensitivityscaling'
                WHEN type_measurement_id = 3 THEN 'porphyrin'
                WHEN type_measurement_id = 4 THEN 'wrinkles'
                WHEN type_measurement_id = 5 THEN 'sebumU'
                WHEN type_measurement_id = 6 THEN 'skintone'
                WHEN type_measurement_id = 8 THEN 'spots'
                WHEN type_measurement_id = 9 THEN 'sebumT'
                WHEN type_measurement_id = 10 THEN 'shine'
                WHEN type_measurement_id = 11 THEN 'keratin'
                WHEN type_measurement_id = 12 THEN 'sensitivityredness'
                WHEN type_measurement_id = 14 THEN 'sensitivityscabs'
                WHEN type_measurement_id = 15 THEN 'sebum'
                WHEN type_measurement_id = 16 THEN 'moistureT'
                WHEN type_measurement_id = 17 THEN 'moistureU'
            END AS analysis_type,
            type_images.name as type,
            to_json ( scores ) ->> 'score' as score, 
            to_json(args) ->> 'nth_analysis' as hash,
            created_time
            FROM measurements record
            LEFT JOIN type_images ON type_images.ID = record.type_image_id 
            WHERE batch_id = $1 AND ( type_image_id = 18 OR type_image_id = 21);
            `,
            [batch_id],
        );
        return result;
    }

    async userAnalysisImageHistory(customer_id: number, per: number, page: number) {
        let batchIds = await this.getCustomerBatchID(customer_id, per, page);

        // const promises: Promise<any>[] = [];
        // // geting result
        // for (const batchId of batchIds) {
        //     console.log('===>', batchId['batch_id']);
        //     promises.push(this.getImageData(batchId['batch_id']));
        // }

        try {
            // const resultObj = await Promise.all(promises);

            // const image: any[] = [];
            const imagePromises: Promise<any>[] = batchIds.map(async (batchId: any) => {
                const rows = await this.getImageData(batchId['batch_id']);
                if (rows.length > 0) {
                    return {
                        batch_id: Number(batchId['batch_id']),
                        customer_id: customer_id,
                        images: [...rows],
                    };
                }
            });

            const image = await Promise.all(imagePromises);
            const result = image.filter((result) => result !== null);
            for (const entry of result) {
                const analyzedImages = entry.images.filter(
                    (image: any) => image.type === 'analyzedImage' && image.score === null,
                );

                for (const analyzedImage of analyzedImages) {
                    const { hash, analysis_type, url } = analyzedImage;
                    const originalImage = entry.images.find(
                        (image: any) =>
                            image.type === 'originalImage' &&
                            image.hash === hash &&
                            image.analysis_type === analysis_type,
                    );

                    if (originalImage) {
                        analyzedImage.score = originalImage.score;
                    }

                    // if (originalImage.url === null) originalImage.url = '';
                    // if (analyzedImage.url === null) analyzedImage.url = '';
                }
            }

            return result;
        } catch (error) {
            console.log(error);
            throw error;
        }
    }

    async userAnalysisImageHistoryWithBatchId(batch_id: number) {
        const result = await this.database.executeQuery(
            `
            SELECT  url,
            CASE 
                WHEN type_measurement_id = 1 THEN 'pores'
                WHEN type_measurement_id = 2 THEN 'sensitivityscaling'
                WHEN type_measurement_id = 3 THEN 'porphyrin'
                WHEN type_measurement_id = 4 THEN 'wrinkles'
                WHEN type_measurement_id = 5 THEN 'sebumU'
                WHEN type_measurement_id = 6 THEN 'skintone'
                WHEN type_measurement_id = 8 THEN 'spots'
                WHEN type_measurement_id = 9 THEN 'sebumT'
                WHEN type_measurement_id = 10 THEN 'shine'
                WHEN type_measurement_id = 11 THEN 'keratin'
                WHEN type_measurement_id = 12 THEN 'sensitivityredness'
                WHEN type_measurement_id = 14 THEN 'sensitivityscabs'
                WHEN type_measurement_id = 15 THEN 'sebum'
                WHEN type_measurement_id = 16 THEN 'moistureT'
                WHEN type_measurement_id = 17 THEN 'moistureU'
            END AS analysis_type,
            type_images.name as type,
            to_json ( scores ) ->> 'score' as score, 
            hash,
            created_time
            FROM measurements record
            LEFT JOIN type_images ON type_images.ID = record.type_image_id 
            WHERE batch_id = $1 AND ( type_image_id = 18 OR type_image_id = 21);
            `,
            [batch_id],
        );
        return result;
    }

    // MoistureU
    moistureU() {}
}
