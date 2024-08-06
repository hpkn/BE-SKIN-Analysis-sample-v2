import { Injectable, Inject, HttpException, ConsoleLogger, BadRequestException } from '@nestjs/common';
import { GetcustomerHistoryDTO } from 'src/common/Dto/customer/analysisHistory/analysisHistory.dto';
import { DatabaseService } from 'src/database/database.service';
import * as celery from 'celery-node';
import { AlgoAnalysisDTO } from 'src/common/Dto/analysis/algoAnalysis.dto';
import fs from 'fs';
import { FileUploadService } from '../../../common/FileUpload/fileUpload.service';
import { KeratinService } from 'src/modules/algorithms/keratin/keratin.service';
import { PoresService } from 'src/modules/algorithms/pores/pores.service';
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
import * as moment from 'moment';
import { analysisCBBDTO, OfflineDataCBBDTO, OfflineDatasDTO } from 'src/common/Dto/analysis/offlineData.dto';
import { toLower } from 'lodash';
import { ComputationService } from 'src/modules/algorithms/computation/computation.service';
import { v4 as uuidv4 } from 'uuid';
import * as jwt from 'jsonwebtoken';
import { throwError } from 'rxjs';

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
        private readonly computation: ComputationService,
    ) {}

    convertScoresToNumbers = (data: any) => {
        for (const key in data) {
            if (Array.isArray(data[key])) {
                data[key].forEach((item: any) => {
                    if (item.score) {
                        item.score = parseInt(item.score, 10);
                    }
                });
            }
        }
    };

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

    // getCBBTaskByAlgoType
    getCBBTaskByAlgoType(type: number) {
        switch (type) {
            case 1:
                return { taskName: 'CNDP_SkinKeratin', algoName: 'keratin', id: 11 };
            case 2:
                return { taskName: 'CNDP_SkinPore', algoName: 'pores', id: 1 };
            case 3:
                return { taskName: 'CNDP_SkinPorphyrin', algoName: 'porphyrin', id: 3 };
            case 4:
                return { taskName: 'CNDP_SkinSebum', algoName: 'sebum', id: 15 };
            case 5:
                return { taskName: 'CNDP_SkinShine', algoName: 'shine', id: 10 };
            case 6:
                return { taskName: 'CNDP_SkinSpots', algoName: 'spots', id: 8 };
            // case 'skintone':
            //     return { taskName: 'CNDP_SkinTone', algoName: 'skintone' };
            // case 'skintone_dior':
            //     return { taskName: 'CNDP_SkinTone_Dior', algoName: 'skintone_dior' };
            case 7:
                return { taskName: 'CNDP_SkinWrinkles', algoName: 'wrinkles', id: 4 };

            case 8:
                return { taskName: 'CNDP_SensScabs', algoName: 'sensitivityscabs', id: 1 };
            case 9:
                return { taskName: 'CNDP_SensScaling', algoName: 'sensitivityscaling', id: 2 };
            case 10:
                return { taskName: 'CNDP_SensRedness', algoName: 'sensitivityredness', id: 12 };

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
        coputaionResutl: any,
        data: AlgoAnalysisDTO,
        taskResponse: any,
        imageRecords: any,
        originalImage: any,
        imageArgs: any,
    ) {
        switch (data.type) {
            case 'keratin':
                this.keratin.saveData(coputaionResutl, data, taskResponse, imageRecords, originalImage, imageArgs);

                return;
            case 'pores':
                return this.pores.saveData(coputaionResutl, data, taskResponse, imageRecords, originalImage, imageArgs);
            case 'porphyrin':
                return this.porphyrin.saveData(
                    coputaionResutl,
                    data,
                    taskResponse,
                    imageRecords,
                    originalImage,
                    imageArgs,
                );
            case 'sebum':
                return this.sebum.saveData(coputaionResutl, data, taskResponse, imageRecords, originalImage, imageArgs);
            case 'shine':
                return this.shine.saveData(coputaionResutl, data, taskResponse, imageRecords, originalImage, imageArgs);
            case 'spots':
                return this.spots.saveData(coputaionResutl, data, taskResponse, imageRecords, originalImage, imageArgs);
            case 'skintone':
                return this.skintone.saveData(
                    coputaionResutl,
                    data,
                    taskResponse,
                    imageRecords,
                    originalImage,
                    imageArgs,
                );
            case 'wrinkles':
                return this.wrinkles.saveData(
                    coputaionResutl,
                    data,
                    taskResponse,
                    imageRecords,
                    originalImage,
                    imageArgs,
                );
            case 'sensitivityscabs':
                return this.sensitivityScabs.saveData(
                    coputaionResutl,
                    data,
                    taskResponse,
                    imageRecords,
                    originalImage,
                    imageArgs,
                );
            case 'sensitivityscaling':
                return this.sensitivityScaling.saveData(
                    coputaionResutl,
                    data,
                    taskResponse,
                    imageRecords,
                    originalImage,
                    imageArgs,
                );
            case 'sensitivityredness':
                return this.sensitivityredness.saveData(
                    coputaionResutl,
                    data,
                    taskResponse,
                    imageRecords,
                    originalImage,
                    imageArgs,
                );
            case 'fitzSG':
                return this.fitzSG.saveData(
                    coputaionResutl,
                    data,
                    taskResponse,
                    imageRecords,
                    originalImage,
                    imageArgs,
                );
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

    handleCBBImageArg(data: any) {
        let analyzedImageArgs;
        let originalImageArgs;
        let fineImageArgs;
        let ultraFineImageArgs;
        let deepImageArgs;
        let ultraDeepImageArgs;

        switch (Number(data.type)) {
            case 1:
                analyzedImageArgs = this.S3Image.getImageArgs('analyzedImage', data.type, 'keratin');
                originalImageArgs = this.S3Image.getImageArgs('originalImage', data.type, 'keratin');
                return {
                    analyzedImageArgs: analyzedImageArgs,
                    originalImageArgs: originalImageArgs,
                };
            case 2:
                analyzedImageArgs = this.S3Image.getImageArgs('analyzedImage', data.type, 'pores');
                originalImageArgs = this.S3Image.getImageArgs('originalImage', data.type, 'pores');
                return {
                    analyzedImageArgs: analyzedImageArgs,
                    originalImageArgs: originalImageArgs,
                };
            case 3:
                analyzedImageArgs = this.S3Image.getImageArgs('analyzedImage', data.type, 'porphyrin');
                originalImageArgs = this.S3Image.getImageArgs('originalImage', data.type, 'porphyrin');
                return {
                    analyzedImageArgs: analyzedImageArgs,
                    originalImageArgs: originalImageArgs,
                };
            case 4:
                analyzedImageArgs = this.S3Image.getImageArgs('analyzedImage', data.type, 'sebum');
                originalImageArgs = this.S3Image.getImageArgs('originalImage', data.type, 'sebum');
                return {
                    analyzedImageArgs: analyzedImageArgs,
                    originalImageArgs: originalImageArgs,
                };
            // case 'sebumT':
            //     return this.sebumT.saveData(data, taskResponse, imageRecords, originalImage);
            case 5:
                analyzedImageArgs = this.S3Image.getImageArgs('analyzedImage', data.type, 'shine');
                originalImageArgs = this.S3Image.getImageArgs('originalImage', data.type, 'shine');
                return {
                    analyzedImageArgs: analyzedImageArgs,
                    originalImageArgs: originalImageArgs,
                };
            case 6:
                analyzedImageArgs = this.S3Image.getImageArgs('analyzedImage', data.type, 'spots');
                originalImageArgs = this.S3Image.getImageArgs('originalImage', data.type, 'spots');
                return {
                    analyzedImageArgs: analyzedImageArgs,
                    originalImageArgs: originalImageArgs,
                };
            // case 'skintone':
            //     analyzedImageArgs = this.S3Image.getImageArgs('analyzedImage', data.type, 'skintone');

            //     originalImageArgs = this.S3Image.getImageArgs('originalImage', data.type, 'skintone');

            //     return { analyzedImageArgs: analyzedImageArgs, originalImageArgs: originalImageArgs };
            // case 'skintone_dior':
            //     analyzedImageArgs = this.S3Image.getImageArgs('analyzedImage', data.type, 'skintone');

            //     originalImageArgs = this.S3Image.getImageArgs('originalImage', data.type, 'skintone');

            //     return { analyzedImageArgs: analyzedImageArgs, originalImageArgs: originalImageArgs };

            case 7:
                analyzedImageArgs = this.S3Image.getImageArgs('analyzedImage', data.type, 'wrinkles');
                originalImageArgs = this.S3Image.getImageArgs('originalImage', data.type, 'wrinkles');
                fineImageArgs = this.S3Image.getImageArgs('fineImage', data.type, 'wrinkles');
                ultraFineImageArgs = this.S3Image.getImageArgs('ultraFineImage', data.type, 'wrinkles');
                deepImageArgs = this.S3Image.getImageArgs('deepImage', data.type, 'wrinkles');
                ultraDeepImageArgs = this.S3Image.getImageArgs('ultraDeepImage', data.type, 'wrinkles');

                return {
                    analyzedImageArgs: analyzedImageArgs,
                    originalImageArgs: originalImageArgs,
                    fineImageArgs: fineImageArgs,
                    ultraFineImageArgs: ultraFineImageArgs,
                    deepImageArgs: deepImageArgs,
                    ultraDeepImageArgs: ultraDeepImageArgs,
                };
            case 8:
                analyzedImageArgs = this.S3Image.getImageArgs('analyzedImage', data.type, 'sensitivityscabs');
                originalImageArgs = this.S3Image.getImageArgs('originalImage', data.type, 'sensitivityscabs');
                return {
                    analyzedImageArgs: analyzedImageArgs,
                    originalImageArgs: originalImageArgs,
                };
            case 9:
                analyzedImageArgs = this.S3Image.getImageArgs('analyzedImage', data.type, 'sensitivityscabs');
                originalImageArgs = this.S3Image.getImageArgs('originalImage', data.type, 'sensitivityscabs');
                return {
                    analyzedImageArgs: analyzedImageArgs,
                    originalImageArgs: originalImageArgs,
                };
            case 10:
                analyzedImageArgs = this.S3Image.getImageArgs('analyzedImage', data.type, 'sensitivityscabs');
                originalImageArgs = this.S3Image.getImageArgs('originalImage', data.type, 'sensitivityscabs');
                return {
                    analyzedImageArgs: analyzedImageArgs,
                    originalImageArgs: originalImageArgs,
                };

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
                case 'keratin' || 1:
                    return this.keratin.offlineSaveData(data, imageRecords, imageArgs);
                case 'pores' || 2:
                    return this.pores.offlineSaveData(data, imageRecords, imageArgs);
                case 'porphyrin' || 3:
                    return this.porphyrin.offlineSaveData(data, imageRecords, imageArgs);
                case 'sebum' || 4:
                    return this.sebum.offlineSaveData(data, imageRecords, imageArgs);
                // case 'sebumT':
                //     return this.sebumT.analysis(data, taskResponse);
                case 'shine' || 5:
                    return this.shine.offlineSaveData(data, imageRecords, imageArgs);
                case 'spots' || 6:
                    return this.spots.offlineSaveData(data, imageRecords, imageArgs);
                // case 'skintone' || 7:
                //     return this.skintone.offlineSaveData(data, imageRecords, imageArgs);
                // case 'skintone_dior':
                //     return this.skintone_dior.offlineSaveData(data, imageRecords, imageArgs);
                case 'wrinkles' || 7:
                    return this.wrinkles.offlineSaveData(data, imageRecords, imageArgs);
                case 'sensitivityscabs' || 8:
                    return this.sensitivityScabs.offlineSaveData(data, imageRecords, imageArgs);
                case 'sensitivityscaling' || 9:
                    return this.sensitivityScaling.offlineSaveData(data, imageRecords, imageArgs);
                case 'sensitivityredness' || 10:
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
        let fineImageArgs;
        let ultraFineImageArgs;
        let deepImageArgs;
        let ultraDeepImageArgs;

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
                fineImageArgs = this.S3Image.getImageArgs('fineImage', data.type, 'wrinkles');
                ultraFineImageArgs = this.S3Image.getImageArgs('ultraFineImage', data.type, 'wrinkles');
                deepImageArgs = this.S3Image.getImageArgs('deepImage', data.type, 'wrinkles');
                ultraDeepImageArgs = this.S3Image.getImageArgs('ultraDeepImage', data.type, 'wrinkles');

                return {
                    analyzedImageArgs: analyzedImageArgs,
                    originalImageArgs: originalImageArgs,
                    fineImageArgs: fineImageArgs,
                    ultraFineImageArgs: ultraFineImageArgs,
                    deepImageArgs: deepImageArgs,
                    ultraDeepImageArgs: ultraDeepImageArgs,
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
    async saveOfflineImage(
        data: OfflineDatasDTO,
        originalImage: any,
        analyzedImage: any,
        imageArgs: any,
        fineImage?: any,
        ultraFineImage?: any,
        deepImage?: any,
        ultraDeepImage?: any,
    ) {
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
                    return this.wrinkles.offlinesaveDataImage(
                        originalImage,
                        analyzedImage,
                        imageArgs,
                        fineImage,
                        ultraFineImage,
                        deepImage,
                        ultraDeepImage,
                    );
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
            await this.saveOfflineData(data, imageRecords, imageArg);

            return 'saved';
        } catch (e) {
            console.log(e);
        }
    }

    async updateEnvironment(batch_id: number, environment: any) {
        try {
            let data = JSON.stringify(environment);

            const update = `
                    UPDATE analysis
                    SET args = jsonb_concat((args)::jsonb, '${data}'::jsonb)
                    WHERE batch_id = $1
                  `;

            this.database.executeQuery(update, [batch_id]);
            return update;
        } catch (e) {
            console.log('check', e);
        }
    }

    async finalSave(
        coputaionResutl: any,
        data: AlgoAnalysisDTO,
        image: Express.Multer.File,
        imageRecords: any,
        taskResponse: any,
        imageArg: any,
    ) {
        if (taskResponse.err) {
            throw new HttpException(`analysis - ${data.task.taskName} -> ${data.type}`, 40004);
        }

        let args = await this.handleSaving(coputaionResutl, data, taskResponse, imageRecords, image?.buffer, imageArg);
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
        try {
            const mesureId = await this.database.executeQuery(
                `SELECT
                analysis.batch_id,
                to_timestamp( CAST ( analysis.created_time AS TEXT ), 'YYYY-MM-DD HH24:MI:SS' ) AS DATE,
                ROUND( AVG ( ( scores ->> 'score' ) :: NUMERIC ) FILTER ( WHERE type_measurement_id = 1 ), 2 ) AS pores_score,
                ROUND( MAX ( ( scores ->> 'computation_score' ) :: NUMERIC ) FILTER ( WHERE type_measurement_id = 1 ), 2 ) AS pores_computation,
                ROUND( AVG ( ( scores ->> 'score' ) :: NUMERIC ) FILTER ( WHERE type_measurement_id = 2 ), 2 ) AS sensitivity_scaling_score,
                ROUND( MAX ( ( scores ->> 'computation_score' ) :: NUMERIC ) FILTER ( WHERE type_measurement_id = 2 ), 2 ) AS sensitivity_scaling_computation,
                ROUND( AVG ( ( scores ->> 'score' ) :: NUMERIC ) FILTER ( WHERE type_measurement_id = 3 ), 2 ) AS porphiryn_score,
                ROUND( MAX ( ( scores ->> 'computation_score' ) :: NUMERIC ) FILTER ( WHERE type_measurement_id = 3 ), 2 ) AS porphiryn_computation,
                ROUND( AVG ( ( scores ->> 'score' ) :: NUMERIC ) FILTER ( WHERE type_measurement_id = 4 ), 2 ) AS wrinkles_score,
                ROUND( MAX ( ( scores ->> 'computation_score' ) :: NUMERIC ) FILTER ( WHERE type_measurement_id = 4 ), 4 ) AS wrinkles_computation,
                ROUND( AVG ( ( scores ->> 'score' ) :: NUMERIC ) FILTER ( WHERE type_measurement_id = 5 ), 2 ) AS sebum_u_score,
                ROUND( MAX ( ( scores ->> 'computation_score' ) :: NUMERIC ) FILTER ( WHERE type_measurement_id = 5 ), 5 ) AS sebum_u_computation,
                ROUND( AVG ( ( scores ->> 'score' ) :: NUMERIC ) FILTER ( WHERE type_measurement_id = 6 ), 2 ) AS skintone_score,
                ROUND( MAX ( ( scores ->> 'computation_score' ) :: NUMERIC ) FILTER ( WHERE type_measurement_id = 6 ), 2 ) AS skintone_computation,
                ROUND( AVG ( ( scores ->> 'score' ) :: NUMERIC ) FILTER ( WHERE type_measurement_id = 8 ), 2 ) AS spots_score,
                ROUND( MAX ( ( scores ->> 'computation_score' ) :: NUMERIC ) FILTER ( WHERE type_measurement_id = 8 ), 2 ) AS spots_computation,
                ROUND( AVG ( ( scores ->> 'score' ) :: NUMERIC ) FILTER ( WHERE type_measurement_id = 9 ), 2 ) AS sebum_t_score,
                ROUND( MAX ( ( scores ->> 'computation_score' ) :: NUMERIC ) FILTER ( WHERE type_measurement_id = 9 ), 2 ) AS sebum_t_computation,
                ROUND( AVG ( ( scores ->> 'score' ) :: NUMERIC ) FILTER ( WHERE type_measurement_id = 10 ), 2 ) AS shine_score,
                ROUND( MAX ( ( scores ->> 'computation_score' ) :: NUMERIC ) FILTER ( WHERE type_measurement_id = 10 ), 2 ) AS shine_computation,
                ROUND( AVG ( ( scores ->> 'score' ) :: NUMERIC ) FILTER ( WHERE type_measurement_id = 11 ), 2 ) AS keratin_score,
                ROUND( MAX ( ( scores ->> 'computation_score' ) :: NUMERIC ) FILTER ( WHERE type_measurement_id = 11 ), 2 ) AS keratin_computation,
                ROUND( AVG ( ( scores ->> 'score' ) :: NUMERIC ) FILTER ( WHERE type_measurement_id = 12 ), 2 ) AS sensitivity_redness_score,
                ROUND( MAX ( ( scores ->> 'computation_score' ) :: NUMERIC ) FILTER ( WHERE type_measurement_id = 12 ), 2 ) AS sensitivity_redness_computation,
                ROUND( AVG ( ( scores ->> 'score' ) :: NUMERIC ) FILTER ( WHERE type_measurement_id = 14 ), 2 ) AS sensitivity_scabs_score,
                ROUND( MAX ( ( scores ->> 'computation_score' ) :: NUMERIC ) FILTER ( WHERE type_measurement_id = 14 ), 2 ) AS sensitivity_scabs_computation,
                ROUND( AVG ( ( scores ->> 'score' ) :: NUMERIC ) FILTER ( WHERE type_measurement_id = 15 ), 2 ) AS sebum_score,
                ROUND( MAX ( ( scores ->> 'computation_score' ) :: NUMERIC ) FILTER ( WHERE type_measurement_id = 15 ), 2 ) AS sebum_computation,
                ROUND( AVG ( ( scores ->> 'score' ) :: NUMERIC ) FILTER ( WHERE type_measurement_id = 16 ), 2 ) AS moisture_t_score,
                ROUND( MAX ( ( scores ->> 'computation_score' ) :: NUMERIC ) FILTER ( WHERE type_measurement_id = 16 ), 2 ) AS moisture_t_computation,
                ROUND( AVG ( ( scores ->> 'score' ) :: NUMERIC ) FILTER ( WHERE type_measurement_id = 17 ), 2 ) AS moisture_u_score,
                ROUND( MAX ( ( scores ->> 'computation_score' ) :: NUMERIC ) FILTER ( WHERE type_measurement_id = 17 ), 2 ) AS moisture_u_computation,
                ROUND( AVG ( ( scores ->> 'score' ) :: NUMERIC ) FILTER ( WHERE type_measurement_id = 18 ), 2 ) AS moisture_score,
                ROUND( MAX ( ( scores ->> 'computation_score' ) :: NUMERIC ) FILTER ( WHERE type_measurement_id = 18 ), 2 ) AS moisture_computation
            FROM
                analysis
                LEFT JOIN answers_to_questions ON analysis.batch_id = answers_to_questions.batch_id
                LEFT JOIN measurements ON analysis.batch_id = measurements.batch_id
                LEFT JOIN type_measurements ON type_measurement_id = type_measurements."id" 
            WHERE
                analysis.batch_id = $1 
                AND type_image_id = 21 
            GROUP BY
                analysis.batch_id`,
                [batch_id],
            );

            // mesureId[0].filter((result) => result !== undefined);
            const val = mesureId[0];
            const final = {
                ...val,
                // keratin
                keratin_computation: val.keratin_computation === null ? val.keratin_score : val.keratin_computation,
                // pores

                pores_computation: val.pores_computation === null ? val.pores_score : val.pores_computation,
                // sensitivity_redness
                sensitivity_redness_computation:
                    val.sensitivity_redness_computation === null
                        ? val.sensitivity_redness_score
                        : val.sensitivity_redness_computation,
                // spots

                spots_computation: val.spots_computation === null ? val.spots_score : val.spots_computation,
                //wrinkles

                wrinkles_computation: val.wrinkles_computation === null ? val.wrinkles_score : val.wrinkles_computation,
                // porphyrim

                porphiryn_computation:
                    val.porphiryn_computation === null ? val.porphiryn_score : val.porphiryn_computation,
                //moisture

                moisture_computation: val.moisture_computation === null ? val.moisture_score : val.moisture_computation,
                //sebum

                sebum_computation: val.sebum_computation === null ? val.sebum_score : val.sebumn_computation,
                //shine

                shine_computation: val.shine_computation === null ? val.shine_score : val.shine_computation,
                //skintone

                skintone_computation: val.skintone_computation === null ? val.skintone_score : val.skintone_computation,
                // sensitivity_scabs

                sensitivity_scabs_computation:
                    val.sensitivity_scabs_computation === null
                        ? val.sensitivity_scabs_score
                        : val.sensitivity_scabs_computation,
                // sensitivity_scaling

                sensitivity_scaling_computation:
                    val.sensitivity_scaling_computation === null
                        ? val.sensitivity_scaling_score
                        : val.sensitivity_scaling_computation,
                //moisture_u

                moisture_u_computation:
                    val.moisture_u_computation === null ? val.moisture_u_score : val.moisture_u_computation,
                // moisture_t_score

                moisture_t_computation:
                    val.moisture_t_computation === null ? val.moisture_t_score : val.moisture_t_computation,
                //sebum_u

                sebum_u_computation: val.sebum_u_computation === null ? val.sebum_u_score : val.sebum_u_computation,

                // sebum_t

                sebum_t_computation: val.sebum_t_computation === null ? val.sebum_t_score : val.sebum_t_computation,
            };

            return final;

            // return mesureId[0];
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

    // private async getAnalysisByBatchId(batch_id: number) {
    //     const query = `
    //     WITH pre_aggregated AS (
    //         SELECT
    //             analysis.batch_id,
    //             analysis.analysis_comment,
    //             to_timestamp(CAST(analysis.created_time AS TEXT), 'YYYY-MM-DD HH24:MI:SS') AS DATE,
    //             type_measurement_id,
    //             ROUND(AVG((scores ->> 'score')::NUMERIC), 2) AS avg_score,
    //             ROUND(MAX((scores ->> 'computation_score')::NUMERIC), 2) AS max_computation_score
    //         FROM
    //             analysis
    //             LEFT JOIN answers_to_questions ON analysis.batch_id = answers_to_questions.batch_id
    //             LEFT JOIN measurements ON analysis.batch_id = measurements.batch_id
    //             LEFT JOIN type_measurements ON type_measurement_id = type_measurements."id"
    //         WHERE
    //             analysis.batch_id = $1
    //             AND type_image_id = 21
    //         GROUP BY
    //             analysis.batch_id, analysis.analysis_comment, analysis.created_time, type_measurement_id
    //     )
    //     SELECT
    //         batch_id,
    //         analysis_comment,
    //         DATE,
    //         MAX(CASE WHEN type_measurement_id = 1 THEN avg_score END) AS pores_score,
    //         MAX(CASE WHEN type_measurement_id = 1 THEN max_computation_score END) AS pores_computation,
    //         MAX(CASE WHEN type_measurement_id = 2 THEN avg_score END) AS sensitivity_scaling_score,
    //         MAX(CASE WHEN type_measurement_id = 2 THEN max_computation_score END) AS sensitivity_scaling_computation,
    //         MAX(CASE WHEN type_measurement_id = 3 THEN avg_score END) AS porphiryn_score,
    //         MAX(CASE WHEN type_measurement_id = 3 THEN max_computation_score END) AS porphiryn_computation,
    //         MAX(CASE WHEN type_measurement_id = 4 THEN avg_score END) AS wrinkles_score,
    //         MAX(CASE WHEN type_measurement_id = 4 THEN max_computation_score END) AS wrinkles_computation,
    //         MAX(CASE WHEN type_measurement_id = 5 THEN avg_score END) AS sebum_u_score,
    //         MAX(CASE WHEN type_measurement_id = 5 THEN max_computation_score END) AS sebum_u_computation,
    //         MAX(CASE WHEN type_measurement_id = 6 THEN avg_score END) AS skintone_score,
    //         MAX(CASE WHEN type_measurement_id = 6 THEN max_computation_score END) AS skintone_computation,
    //         MAX(CASE WHEN type_measurement_id = 8 THEN avg_score END) AS spots_score,
    //         MAX(CASE WHEN type_measurement_id = 8 THEN max_computation_score END) AS spots_computation,
    //         MAX(CASE WHEN type_measurement_id = 9 THEN avg_score END) AS sebum_t_score,
    //         MAX(CASE WHEN type_measurement_id = 9 THEN max_computation_score END) AS sebum_t_computation,
    //         MAX(CASE WHEN type_measurement_id = 10 THEN avg_score END) AS shine_score,
    //         MAX(CASE WHEN type_measurement_id = 10 THEN max_computation_score END) AS shine_computation,
    //         MAX(CASE WHEN type_measurement_id = 11 THEN avg_score END) AS keratin_score,
    //         MAX(CASE WHEN type_measurement_id = 11 THEN max_computation_score END) AS keratin_computation,
    //         MAX(CASE WHEN type_measurement_id = 12 THEN avg_score END) AS sensitivity_redness_score,
    //         MAX(CASE WHEN type_measurement_id = 12 THEN max_computation_score END) AS sensitivity_redness_computation,
    //         MAX(CASE WHEN type_measurement_id = 14 THEN avg_score END) AS sensitivity_scabs_score,
    //         MAX(CASE WHEN type_measurement_id = 14 THEN max_computation_score END) AS sensitivity_scabs_computation,
    //         MAX(CASE WHEN type_measurement_id = 15 THEN avg_score END) AS sebum_score,
    //         MAX(CASE WHEN type_measurement_id = 15 THEN max_computation_score END) AS sebum_computation,
    //         MAX(CASE WHEN type_measurement_id = 16 THEN avg_score END) AS moisture_t_score,
    //         MAX(CASE WHEN type_measurement_id = 16 THEN max_computation_score END) AS moisture_t_computation,
    //         MAX(CASE WHEN type_measurement_id = 17 THEN avg_score END) AS moisture_u_score,
    //         MAX(CASE WHEN type_measurement_id = 17 THEN max_computation_score END) AS moisture_u_computation,
    //         MAX(CASE WHEN type_measurement_id = 18 THEN avg_score END) AS moisture_score,
    //         MAX(CASE WHEN type_measurement_id = 18 THEN max_computation_score END) AS moisture_computation
    //     FROM
    //         pre_aggregated
    //     GROUP BY
    //         batch_id, analysis_comment, DATE;
    //   `;
    //     return await this.database.executeQuery(query, [batch_id]);
    // }

    async getAnalysisByBatchId(batch_id: number) {
        const result = await this.database.executeQuery(
            `SELECT
                analysis.batch_id,
                analysis.analysis_comment,
                to_timestamp( CAST ( analysis.created_time AS TEXT ), 'YYYY-MM-DD HH24:MI:SS' ) AS DATE,
                ROUND( AVG ( ( scores ->> 'score' ) :: NUMERIC ) FILTER ( WHERE type_measurement_id = 1 ), 2 ) AS pores_score,
                ROUND( MAX ( ( scores ->> 'computation_score' ) :: NUMERIC ) FILTER ( WHERE type_measurement_id = 1 ), 2 ) AS pores_computation,
                ROUND( AVG ( ( scores ->> 'score' ) :: NUMERIC ) FILTER ( WHERE type_measurement_id = 2 ), 2 ) AS sensitivity_scaling_score,
                ROUND( MAX ( ( scores ->> 'computation_score' ) :: NUMERIC ) FILTER ( WHERE type_measurement_id = 2 ), 2 ) AS sensitivity_scaling_computation,
                ROUND( AVG ( ( scores ->> 'score' ) :: NUMERIC ) FILTER ( WHERE type_measurement_id = 3 ), 2 ) AS porphiryn_score,
                ROUND( MAX ( ( scores ->> 'computation_score' ) :: NUMERIC ) FILTER ( WHERE type_measurement_id = 3 ), 2 ) AS porphiryn_computation,
                ROUND( AVG ( ( scores ->> 'score' ) :: NUMERIC ) FILTER ( WHERE type_measurement_id = 4 ), 2 ) AS wrinkles_score,
                ROUND( MAX ( ( scores ->> 'computation_score' ) :: NUMERIC ) FILTER ( WHERE type_measurement_id = 4 ), 4 ) AS wrinkles_computation,
                ROUND( AVG ( ( scores ->> 'score' ) :: NUMERIC ) FILTER ( WHERE type_measurement_id = 5 ), 2 ) AS sebum_u_score,
                ROUND( MAX ( ( scores ->> 'computation_score' ) :: NUMERIC ) FILTER ( WHERE type_measurement_id = 5 ), 5 ) AS sebum_u_computation,
                ROUND( AVG ( ( scores ->> 'score' ) :: NUMERIC ) FILTER ( WHERE type_measurement_id = 6 ), 2 ) AS skintone_score,
                ROUND( MAX ( ( scores ->> 'computation_score' ) :: NUMERIC ) FILTER ( WHERE type_measurement_id = 6 ), 2 ) AS skintone_computation,
                ROUND( AVG ( ( scores ->> 'score' ) :: NUMERIC ) FILTER ( WHERE type_measurement_id = 8 ), 2 ) AS spots_score,
                ROUND( MAX ( ( scores ->> 'computation_score' ) :: NUMERIC ) FILTER ( WHERE type_measurement_id = 8 ), 2 ) AS spots_computation,
                ROUND( AVG ( ( scores ->> 'score' ) :: NUMERIC ) FILTER ( WHERE type_measurement_id = 9 ), 2 ) AS sebum_t_score,
                ROUND( MAX ( ( scores ->> 'computation_score' ) :: NUMERIC ) FILTER ( WHERE type_measurement_id = 9 ), 2 ) AS sebum_t_computation,
                ROUND( AVG ( ( scores ->> 'score' ) :: NUMERIC ) FILTER ( WHERE type_measurement_id = 10 ), 2 ) AS shine_score,
                ROUND( MAX ( ( scores ->> 'computation_score' ) :: NUMERIC ) FILTER ( WHERE type_measurement_id = 10 ), 2 ) AS shine_computation,
                ROUND( AVG ( ( scores ->> 'score' ) :: NUMERIC ) FILTER ( WHERE type_measurement_id = 11 ), 2 ) AS keratin_score,
                ROUND( MAX ( ( scores ->> 'computation_score' ) :: NUMERIC ) FILTER ( WHERE type_measurement_id = 11 ), 2 ) AS keratin_computation,
                ROUND( AVG ( ( scores ->> 'score' ) :: NUMERIC ) FILTER ( WHERE type_measurement_id = 12 ), 2 ) AS sensitivity_redness_score,
                ROUND( MAX ( ( scores ->> 'computation_score' ) :: NUMERIC ) FILTER ( WHERE type_measurement_id = 12 ), 2 ) AS sensitivity_redness_computation,
                ROUND( AVG ( ( scores ->> 'score' ) :: NUMERIC ) FILTER ( WHERE type_measurement_id = 14 ), 2 ) AS sensitivity_scabs_score,
                ROUND( MAX ( ( scores ->> 'computation_score' ) :: NUMERIC ) FILTER ( WHERE type_measurement_id = 14 ), 2 ) AS sensitivity_scabs_computation,
                ROUND( AVG ( ( scores ->> 'score' ) :: NUMERIC ) FILTER ( WHERE type_measurement_id = 15 ), 2 ) AS sebum_score,
                ROUND( MAX ( ( scores ->> 'computation_score' ) :: NUMERIC ) FILTER ( WHERE type_measurement_id = 15 ), 2 ) AS sebum_computation,
                ROUND( AVG ( ( scores ->> 'score' ) :: NUMERIC ) FILTER ( WHERE type_measurement_id = 16 ), 2 ) AS moisture_t_score,
                ROUND( MAX ( ( scores ->> 'computation_score' ) :: NUMERIC ) FILTER ( WHERE type_measurement_id = 16 ), 2 ) AS moisture_t_computation,
                ROUND( AVG ( ( scores ->> 'score' ) :: NUMERIC ) FILTER ( WHERE type_measurement_id = 17 ), 2 ) AS moisture_u_score,
                ROUND( MAX ( ( scores ->> 'computation_score' ) :: NUMERIC ) FILTER ( WHERE type_measurement_id = 17 ), 2 ) AS moisture_u_computation,
                ROUND( AVG ( ( scores ->> 'score' ) :: NUMERIC ) FILTER ( WHERE type_measurement_id = 18 ), 2 ) AS moisture_score,
                ROUND( MAX ( ( scores ->> 'computation_score' ) :: NUMERIC ) FILTER ( WHERE type_measurement_id = 18 ), 2 ) AS moisture_computation
            FROM
                analysis
                LEFT JOIN answers_to_questions ON analysis.batch_id = answers_to_questions.batch_id
                LEFT JOIN measurements ON analysis.batch_id = measurements.batch_id
                LEFT JOIN type_measurements ON type_measurement_id = type_measurements."id"
            WHERE
                analysis.batch_id = $1
                AND type_image_id = 21
            GROUP BY
                analysis.batch_id`,
            [batch_id],
        );
        return result[0];
    }

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

    private transformResult(val: any, customerId: number): any {
        val.customer_id = customerId;
        // User Comment
        val.analysis_comment = val?.analysis_comment ?? null;
        val.sens_redness_combined_score = null;

        // keratin
        val.keratin_score = val.keratin_score === null ? null : Number(val.keratin_score);
        val.keratin_computation = val.keratin_computation === null ? val.keratin_score : val.keratin_computation;

        // pores
        val.pores_score =
            val.pores_score !== null ? (isNaN(parseFloat(val.pores_score)) ? null : parseFloat(val.pores_score)) : null;
        val.pores_computation = val.pores_computation === null ? val.pores_score : val.pores_computation;

        // sensitivity_redness
        val.sensitivity_redness_score =
            val.sensitivity_redness_score === null ? null : Number(val.sensitivity_redness_score);
        val.sensitivity_redness_computation =
            val.sensitivity_redness_computation === null
                ? val.sensitivity_redness_score
                : val.sensitivity_redness_computation;

        // spots
        val.spots_score = val.spots_score === null ? null : Number(val.spots_score);
        val.spots_computation = val.spots_computation === null ? val.spots_score : val.spots_computation;

        // wrinkles
        val.wrinkles_score = val.wrinkles_score === null ? null : Number(val.wrinkles_score);
        val.wrinkles_computation = val.wrinkles_computation === null ? val.wrinkles_score : val.wrinkles_computation;

        // porphiryn
        val.porphiryn_score = val.porphiryn_score === null ? null : Number(val.porphiryn_score);
        val.porphiryn_computation =
            val.porphiryn_computation === null ? val.porphiryn_score : val.porphiryn_computation;

        // moisture
        val.moisture_score = val.moisture_score === null ? null : Number(val.moisture_score);
        val.moisture_computation = val.moisture_computation === null ? val.moisture_score : val.moisture_computation;

        // sebum
        val.sebum_score = val.sebum_score === null ? null : Number(val.sebum_score);
        val.sebum_computation = val.sebum_computation === null ? val.sebum_score : val.sebum_computation;

        // shine
        val.shine_score = val.shine_score === null ? null : Number(val.shine_score);
        val.shine_computation = val.shine_computation === null ? val.shine_score : val.shine_computation;

        // skintone
        val.skintone_score = val.skintone_score === null ? null : Number(val.skintone_score);
        val.skintone_computation = val.skintone_computation === null ? val.skintone_score : val.skintone_computation;

        // sensitivity_scabs
        val.sensitivity_scabs_score = val.sensitivity_scabs_score === null ? null : Number(val.sensitivity_scabs_score);
        val.sensitivity_scabs_computation =
            val.sensitivity_scabs_computation === null
                ? val.sensitivity_scabs_score
                : val.sensitivity_scabs_computation;

        // sensitivity_scaling
        val.sensitivity_scaling_score =
            val.sensitivity_scaling_score === null ? null : Number(val.sensitivity_scaling_score);
        val.sensitivity_scaling_computation =
            val.sensitivity_scaling_computation === null
                ? val.sensitivity_scaling_score
                : val.sensitivity_scaling_computation;

        // moisture_u
        val.moisture_u_score = val.moisture_u_score === null ? null : Number(val.moisture_u_score);
        val.moisture_u_computation =
            val.moisture_u_computation === null ? val.moisture_u_score : val.moisture_u_computation;

        // moisture_t_score
        val.moisture_t_score = val.moisture_t_score === null ? null : Number(val.moisture_t_score);
        val.moisture_t_computation =
            val.moisture_t_computation === null ? val.moisture_t_score : val.moisture_t_computation;

        // sebum_u
        val.sebum_u_score = val.sebum_u_score === null ? null : Number(val.sebum_u_score);
        val.sebum_u_computation = val.sebum_u_computation === null ? val.sebum_u_score : val.sebum_u_computation;

        // sebum_t
        val.sebum_t_score = val.sebum_t_score === null ? null : Number(val.sebum_t_score);
        val.sebum_t_computation = val.sebum_t_computation === null ? val.sebum_t_score : val.sebum_t_computation;

        return val;
    }

    async userAnalysisHistory(customer_id: number, per: number, page: number): Promise<any[]> {
        let batchIds = await this.getCustomerBatchID(customer_id, per, page);

        try {
            const queries = batchIds.map((batchId) => this.getAnalysisByBatchId(batchId['batch_id']));
            const results = await Promise.all(queries);
            const nonEmptyResults = results.flat().filter((result) => result);

            return nonEmptyResults.map((val) => this.transformResult(val, customer_id));
        } catch (error) {
            console.log(error);
            throw error;
        }
    }

    async getImageData(batch_id: number) {
        const result = await this.database.executeQuery(
            `
            SELECT  
                url,
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
                to_json ( scores ) ->> 'label' as label, 
                to_json ( scores ) ->> 'comment' as comment, 
                to_json ( scores ) ->> 'xy_coordinates' as xy_coordinates, 
                to_json ( scores ) ->> 'fine_score' AS fine_score,
                to_json ( scores ) ->> 'ultra_fine_score' AS ultra_fine_score,
                to_json ( scores ) ->> 'deep_score' AS deep_score,
                to_json ( scores ) ->> 'ultra_deep_score' AS ultra_deep_score,
                to_json ( args ) ->> 'nth_analysis' as hash,
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

        try {
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
                if (!entry) {
                    continue;
                }

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
                }

                entry.images.forEach((val: any) => {
                    if (val.analysis_type !== 'wrinkles') {
                        delete val.fine_score;
                        delete val.ultra_fine_score;
                        delete val.deep_score;
                        delete val.ultra_deep_score;
                    }

                    if (val.url === null) {
                        val.url = '';
                    }
                    if (val.hash === null) {
                        val.hash = '';
                    }
                });
            }

            const filteredData = result.filter((item) => item !== undefined);
            return filteredData;
        } catch (error) {
            console.log(error);
            throw error;
        }
    }

    // Remove identical object
    removeIdenticalObjects = (arr: any[]) => {
        const uniqueObjects = arr.filter(
            (obj, index, self) => index === self.findIndex((o) => JSON.stringify(o) === JSON.stringify(obj)),
        );
        return uniqueObjects;
    };

    removeDuplicate(array: any) {
        // if (!Array.isArray(array)) {
        //     return false;
        // }
        const seen = new Set();
        return array.filter((item: any) => {
            const analyzedId = item.analyzedImage?.id;
            const originalId = item.originalImage?.id;
            const identifier = `${analyzedId}-${originalId}`;
            if (item.score === null || item.raw === null || !item.score) {
                return false;
            } else {
                seen.add(identifier);
                return true;
            }
        });
    }

    // (item.score != null || item.raw != null) && !seen.has(identifier)

    // removeDuplicate_(array) {
    //     if (!Array.isArray(array)) {
    //         return [];
    //     }
    
    //     const seen = new Set();
    
    removeDuplicate_(array: any) {
        const seen = new Set();

        return array.filter((item: any) => {
            const analyzedId = item.analyzedImage?.id;
            const originalId = item.originalImage?.id;
            const identifier = `${analyzedId}-${originalId}`;

            if ((item.score === null || item.raw === null) && seen.has(identifier)) {
                return false;
            } else {
                seen.add(identifier);
                return true;
            }
        });
    }

 
    // transform wrinkles

    async userHistoryWithBatchId(batch_id: number) {
        try {
            const result = await this.database.executeQuery(
                `
                SELECT
                analysis_type,
                jsonb_agg ( TEMP ) 
            FROM
                (
                SELECT DISTINCT
                    record.analysis_type AS analysis_type,
                    jsonb_agg ( img ) AS images,
                    record.args AS args,
                    record.type_image,
                    record.DATE AS DATE,
                    record.TIME AS TIME
                FROM
                    (
                    SELECT
                        tm."name" AS analysis_type,
                        type_image_id AS type_image,
                        type_measurement_id,
                        args ->> 'nth_analysis' as unique_id,                        
                        CASE
                            WHEN type_image_id = 21 THEN
                            scores 
                        END AS args,
                        created_time :: DATE AS DATE,
                        created_time :: TIME AS TIME,
                        batch_id 
                    FROM
                        measurements ms
                        LEFT JOIN type_measurements tm ON tm.ID = ms.type_measurement_id 
                    WHERE
                        (
                            type_measurement_id = 17
                            OR type_measurement_id = 16  
                            OR type_measurement_id = 9 
                            OR type_measurement_id = 5 
                            OR type_measurement_id = 11 
                            OR type_measurement_id = 1 
                            OR type_measurement_id = 3 
                            OR type_measurement_id = 15 
                            OR type_measurement_id = 12 
                            OR type_measurement_id = 14 
                            OR type_measurement_id = 2 
                            OR type_measurement_id = 6 
                            OR type_measurement_id = 8 
                            OR type_measurement_id = 4 
                        ) 
                        AND batch_id = $1
						
                    ) AS record
                    LEFT JOIN (
                    SELECT
                        batch_id,
                        type_image_id,
                        type_measurement_id,
                        tpi.NAME AS TYPE,
                        scores || jsonb_build_object ( 'nth_analysis', to_json ( args ) ->> 'nth_analysis' ) AS args,
                        json_build_object ( 'id', to_json ( args ) ->> 'nth_analysis', 'url', url ) AS url,
                        args ->> 'nth_analysis' as unique_id,
                        to_json(scores) ->> 'label' AS label,
                        to_json(scores) ->> 'comment' AS comment,
                        to_json(scores) ->> 'xy_coordinates' AS xy_coordinates
                    FROM
                        measurements AS ms
                        LEFT JOIN type_images AS tpi ON tpi.ID = ms.type_image_id 
                        WHERE batch_id = $1

                    ) AS img ON img.batch_id = record.batch_id AND img.type_measurement_id = record.type_measurement_id 
                    WHERE record.type_measurement_id = img.type_measurement_id 
                    AND (record.unique_id = img.unique_id OR record."analysis_type" = 'moistureT' OR record."analysis_type" = 'moistureU')
                GROUP BY
                    record.analysis_type,
                    record.args,
                    record.DATE,
                    record.TIME,
                    record.type_image
                ) TEMP 
            GROUP BY
                analysis_type;
            `,
                [batch_id],
            );

            // console.log(result);

            // const removeDuplicate = this.removeIdenticalObjects(result);
            // console.log(removeDuplicate);

            let respObj: any = {};
            for (let i = 0; i < result.length; i++) {
                let obj: any = {};
                for (let j = 0; j < result[i].jsonb_agg.length; j++) {
                    let imgObj: any = {};
                    // console.log('image check ', result[i].jsonb_agg[j]);
                    for (let k = 0; k < result[i].jsonb_agg[j].images.length; k++) {
                        // console.log('Checking this --->', result[i].jsonb_agg[j]);
                        if (result[i].analysis_type === 'moistureT' || result[i].analysis_type === 'moistureU') {
                            continue;
                        }
                        // console.log(result[i].jsonb_agg[j].images[k].url);
                        if (result[i].jsonb_agg[j].time === result[i].jsonb_agg[j].time) {
                            imgObj[result[i].jsonb_agg[j].images[k].type] = { ...result[i].jsonb_agg[j].images[k].url };
                        }
                    }
                    if (!obj[result[i].analysis_type]) {
                        // console.log(
                        //     '----->',

                        // );
                        if (
                            (result[i]?.jsonb_agg[j]?.args?.score && result[i].jsonb_agg[j]?.args['score'] !== null) ===
                            true
                        ) {
                            obj[result[i].analysis_type] = [
                                {
                                    ...result[i].jsonb_agg[j].args,
                                    analysis_type: result[i].jsonb_agg[j].analysis_type,
                                    date: result[i].jsonb_agg[j].date,
                                    time: result[i].jsonb_agg[j].time,
                                    ...imgObj,
                                },
                            ];
                        }
                    } else {
                        if (
                            (result[i]?.jsonb_agg[j]?.args?.score && result[i].jsonb_agg[j]?.args['score'] !== null) ===
                            true
                        ) {
                            obj[result[i].analysis_type] = [
                                ...obj[result[i].analysis_type],
                                {
                                    ...result[i].jsonb_agg[j].args,
                                    analysis_type: result[i].jsonb_agg[j].analysis_type,
                                    date: result[i].jsonb_agg[j].date,
                                    time: result[i].jsonb_agg[j].time,
                                    ...imgObj,
                                },
                            ];
                        }
                    }
                }
                respObj = { ...respObj, ...obj };
            }

            respObj?.moistureT?.forEach((value: any) => {
                value.raw = +value.raw;
                value.score = +value.score;
            });
            respObj?.moistureU?.forEach((value: any) => {
                value.raw = +value.raw;
                value.score = +value.score;
            });

            // if (respObj?.sebumU && Array.isArray(respObj?.sebumU)) {
            //     respObj.sebumU = respObj.sebumU[0];
            // }

            // if (respObj?.sebumT && Array.isArray(respObj?.sebumT)) {
            //     respObj.sebumT = respObj.sebumT[0];
            // }

            if (respObj?.moistureU && Array.isArray(respObj?.moistureU)) {
                respObj.moistureU = respObj.moistureU[0];
            }

            if (respObj?.moistureT && Array.isArray(respObj?.moistureT)) {
                respObj.moistureT = respObj.moistureT[0];
            }
            respObj?.sebumT?.forEach((value: any) => {
                value.raw = +value.raw;
                value.score = +value.score;
            });
            respObj?.sebumU?.forEach((value: any) => {
                value.raw = +value.raw;
                value.score = +value.score;
            });
            respObj?.keratin?.forEach((value: any) => {
                value.raw = +value.raw;
                value.score = +value.score;
            });
            respObj?.moisture?.forEach((value: any) => {
                value.raw = +value.raw;
                value.score = +value.score;
            });
            respObj?.pores?.forEach((value: any) => {
                value.raw = +value.raw;
                value.score = +value.score;
            });
            respObj?.porphyrin?.forEach((value: any) => {
                value.raw = +value.raw;
                value.score = +value.score;
            });
            respObj?.sebum?.forEach((value: any) => {
                value.raw = +value.raw;
                value.score = +value.score;
            });
            respObj?.fullsensitivity?.forEach((value: any) => {
                value.raw = +value.raw;
                value.score = +value.score;
            });
            respObj?.sensitivityredness?.forEach((value: any) => {
                value.raw = +value.raw;
                value.score = +value.score;
            });
            respObj?.sensitivityscabs?.forEach((value: any) => {
                value.raw = +value.raw;
                value.score = +value.score;
            });
            respObj?.sensitivityscaling?.forEach((value: any) => {
                value.raw = +value.raw;
                value.score = +value.score;
            });
            respObj?.shine?.forEach((value: any) => {
                value.raw = +value.raw;
                value.score = +value.score;
            });
            respObj?.skintone?.forEach((value: any) => {
                value.raw = +value.raw;
                value.score = +value.score;
            });
            respObj?.spots?.forEach((value: any) => {
                value.raw = +value.raw;
                value.score = +value.score;
            });

            respObj?.wrinkles?.forEach((value: any) => {
                value.raw = +value.raw;
                value.score = +value.score;

                // Data combined
            });

            // respObj.wrinkles = this.removeDuplicate_(respObj.wrinkles);

            // respObj.wrinkles = this.removeDuplicate(respObj.wrinkles);

            respObj?.pores?.forEach((value: any) => {
                value.raw = +value.raw;
                value.score = +value.score;
            });
            return respObj;
        } catch (e) {
            console.log(e);
        }
    }

    // MoistureU
    // CBB offline saving
    offlineCBBSaveData(dataObject: any[]) {
        if (!dataObject || dataObject.length === 0) {
            return;
        }

        const query = `
            INSERT INTO measurements
            (batch_id, url, sys_url, hash, type_measurement_id, type_image_id, args, scores)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `;

        for (const data of dataObject) {
            const values = [
                data.batch_id,
                data.url,
                data.sys_url,
                data.hash,
                data.type_measurement_id,
                data.type_image_id,
                data.args,
                data.scores,
            ];

            this.database.executeQuery(query, values);
        }

        // await this.batchAnalysis.updateEnvironment(data.batchId, environment);

        return 'saved';
    }

    async getAlgoID(algorithm: string): Promise<any[]> {
        const result = await this.database.executeQuery(
            `SELECT id, name FROM type_measurements WHERE name LIKE '${algorithm}'`,
        );

        return result;
    }

    async offlineCBBSaveImage(originalImage: any, analyzedImage: any, imageArgs: any, data: any) {
        const analyzedImageArgs = imageArgs.analyzedImageArgs;
        const originalImageArgs = imageArgs.originalImageArgs;

        await this.S3Image.uploadImage(analyzedImage, analyzedImageArgs.sys_url);
        await this.S3Image.uploadImage(originalImage, originalImageArgs.sys_url);
        // await this.S3Image.uploadImage(maskImage, maskImageArgs.sys_url);

        return 'saved';
    }

    async offlineCBBWrinklesSaveImage(
        fineImage: any,
        ultraFineImage: any,
        deepImage: any,
        ultraDeepImage: any,
        imageArgs: any,
        data: any,
    ) {
        const fineImageArgs = imageArgs.fineImageArgs;
        const ultraFineImageArgs = imageArgs.ultraFineImageArgs;
        const deepImageArgs = imageArgs.deepImageArgs;
        const ultraDeepImageArgs = imageArgs.ultraDeepImageArgs;

        await Promise.all([
            this.S3Image.uploadImage(fineImage, fineImageArgs.sys_url),
            this.S3Image.uploadImage(ultraFineImage, ultraFineImageArgs.sys_url),
            this.S3Image.uploadImage(deepImage, deepImageArgs.sys_url),
            this.S3Image.uploadImage(ultraDeepImage, ultraDeepImageArgs.sys_url),
        ]);

        return 'saved';
    }

    async updateData(data: any, imageRecords: string) {
        const environment = {
            deviceModel: data.deviceModel,
            deviceOS: data.deviceOS,
            nth_analysis: '',
            lat: data.lat,
            long: data.long,
            temperature: data.temperature,
            humidity: data.humidity,
            uv_index: data.uv_index,
            appVersion: data.appVersion,
            gender: data.gender ?? '',
            skin_color_group: data.skin_color_group ?? '',
            ethnicities: data.ethnicities ?? '',
            kiosk: data?.kiosk,
            lisenceId: data?.licenseId ?? 1,
        };

        await this.updateEnvironment(data.batch_id, environment);
    }

    // Save Log for data upload faillure
    getErrorLog(batch_id: number) {
        const kr_time = new Date().toLocaleString();
        const errorLog = `batch id: ${batch_id} - Image upload failes\n\n
        ${JSON.stringify(kr_time)}\n\n`;

        return errorLog;
    }

    async countAnalysis(customer_ids: number[]) {
        try {
            const update = await this.database.executeQuery(
                `
                SELECT 
                CASE WHEN customer_id IS NULL THEN 'Total' ELSE CAST(customer_id AS TEXT) END AS customer,
                COUNT(*) AS count
                FROM analysis
                WHERE customer_id = ANY($1::int[])
                GROUP BY ROLLUP (customer_id);
            `,
                [customer_ids],
            );
            return update;
        } catch (e) {
            console.log('check', e);
            throw new Error();
        }
    }

    async fetchAgeCondition(batchId: number) {
        try {
            const update = await this.database.executeQuery(
                `
                SELECT
                    CASE
                        WHEN tp.id = 8 THEN  'spots'
                        WHEN tp.id = 4 THEN 'wrinkles'
                        WHEN tp.id = 16 THEN 'moistureT'
                        WHEN tp.id = 9 THEN 'sebumT'
                        WHEN tp.id = 17 THEN 'moistureU'
                        WHEN tp.id = 5 THEN 'sebumU'
                    END AS measurement,
                    CASE
                        WHEN tp.id = 8 THEN  round(AVG((to_json(scores) ->> 'computation_score')::numeric),2)
                        WHEN tp.id = 4 THEN round(AVG((to_json(scores) ->> 'computation_score')::numeric),2)
                        WHEN tp.id = 16 THEN round(AVG((to_json(scores) ->> 'score')::numeric),2)
                        WHEN tp.id = 9 THEN round(AVG((to_json(scores) ->> 'score')::numeric),2)
                        WHEN tp.id = 17 THEN round(AVG((to_json(scores) ->> 'score')::numeric),2)
                        WHEN tp.id = 5 THEN round(AVG((to_json(scores) ->> 'score')::numeric),2)
                    END AS AVG 
                FROM
                    measurements AS ms
                    JOIN type_measurements AS tp ON tp."id" = ms.type_measurement_id 
                WHERE
                    batch_id = $1 
                    AND type_image_id = 21 
                GROUP BY tp.NAME, tp.ID
            `,
                [batchId],
            );
            console.log('update', update);
            return update;
        } catch (e) {
            console.log('check', e);
            throw new Error();
        }
    }

    async fetchQuestion(batchId: number) {
        try {
            const result = await this.database.executeQuery(
                `
                SELECT
                    MAX(CASE
                    WHEN type_measurement_id = 8 THEN ((to_json(scores) ->> 'answers'))
                    WHEN type_measurement_id = 4 THEN ((to_json(scores) ->> 'answers'))
                        WHEN type_measurement_id = 1 THEN ((to_json(scores) ->> 'answers'))
                        WHEN type_measurement_id = 7 THEN ((to_json(scores) ->> 'answers'))
                        WHEN type_measurement_id = 11 THEN ((to_json(scores) ->> 'answers'))
                    END) AS answers
                FROM
                    measurements
                WHERE
                    batch_id = $1
                    AND type_image_id = 21
                    AND (to_json(scores) ->> 'answers') IS NOT NULL
                LIMIT 1	
            `,
                [batchId],
            );
            const finalRes = result[0].answers;
            return finalRes;
        } catch (e) {
            console.log('check', e);
            throw new Error();
        }
    }

    async skinAgeOperation(batchId: number) {
        const result = await this.fetchAgeCondition(batchId);

        let spots = null;
        let wrinkles = null;
        let moistureT = null;
        let sebumT = null;
        let moistureU = null;
        let sebumU = null;

        for (let i = 0; i < result.length; i++) {
            if (result[i]['measurement'] === 'spots') spots = result[i]['avg'];
            if (result[i]['measurement'] === 'wrinkles') wrinkles = result[i]['avg'];
            if (result[i]['measurement'] === 'moistureT') moistureT = result[i]['avg'];
            if (result[i]['measurement'] === 'sebumT') sebumT = result[i]['avg'];
            if (result[i]['measurement'] === 'moistureU') moistureU = result[i]['avg'];
            if (result[i]['measurement'] === 'sebumU') sebumU = result[i]['avg'];
        }

        return {
            spots: spots,
            wrinkles: wrinkles,
            moistureT: moistureT,
            sebumT: sebumT,
            moistureU: moistureU,
            sebumU: sebumU,
        };
    }

    async saveSkinValue(batch_id: number, skinCondtion: any, skinAge: any) {
        const condition = skinCondtion.length === 0 ? '-1' : skinCondtion;
        try {
            const update = `
                UPDATE measurements 
                SET scores =
                    CASE
                        WHEN scores ->> 'skinCondtion' IS NULL 
                        AND scores ->> 'skinAge' IS NULL THEN
                            jsonb_set ( jsonb_set ( scores, '{skinCondtion}', $1, TRUE ), '{skinAge}', $2, TRUE ) ELSE scores 
                    END 
                WHERE batch_id = $3 AND type_measurement_id = 5 AND type_image_id = 21
            `;

            this.database.executeQuery(update, [JSON.stringify(condition), JSON.stringify(skinAge), batch_id]);
            return update;
        } catch (e) {
            console.log('check', e);
        }
    }

    saveSkinCondtion(batch_id: number, skinCondtion: any, skinAge: any) {
        const condition = skinCondtion.length === 0 ? '-1' : skinCondtion;
        console.log('condition', condition);
        try {
            const update = `
                INSERT INTO measurements (batch_id, type_measurement_id, type_image_id, scores)
                VALUES (${batch_id}, 18, 21, '{"skinCondtion": ${JSON.stringify(
                condition,
            )}, "skinAge": ${JSON.stringify(skinAge)}}')
            `;

            this.database.executeQuery(update);
            return update;
        } catch (e) {
            console.log('check', e);
        }
    }

    async calculateRevisit(CUSTOMER_ID_LIST: number[], THIS_MONTH: string) {
        const query = `
                SELECT batch_id, customer_id, created_time
                FROM analysis
                WHERE customer_id = ANY($1)
            `;

        const result = await this.database.executeQuery(query, [CUSTOMER_ID_LIST]);

        const analysisData = result;

        const analysisDf = analysisData.map((row: any) => ({
            batch_id: row.batch_id,
            customer_id: row.customer_id,
            created_time: moment(row.created_time).format('YYYY-MM-DD'),
        }));

        const uniqueCustomerIds = [...new Set(analysisDf.map((row: any) => row.customer_id))];

        const revisitCountDict: Record<number, number> = {};
        const revisitDayTermDict: Record<number, number> = {};
        const revisitCountInThisMonthDict: Record<number, number> = {};

        for (const customerId of uniqueCustomerIds) {
            const customerDf = analysisDf.filter((row: any) => row.customer_id === customerId);
            const sortedCustomerDf = customerDf.sort((a: any, b: any) => {
                return moment(a.created_time).isBefore(moment(b.created_time)) ? -1 : 1;
            });

            const visitCount = sortedCustomerDf.length;

            if (revisitCountDict[visitCount - 1]) {
                revisitCountDict[visitCount - 1]++;
            } else {
                revisitCountDict[visitCount - 1] = 1;
            }

            if (visitCount > 1) {
                for (let i = 0; i < visitCount - 1; i++) {
                    const dayTerm = moment(sortedCustomerDf[i + 1].created_time).diff(
                        moment(sortedCustomerDf[i].created_time),
                        'days',
                    );

                    if (revisitDayTermDict[dayTerm]) {
                        revisitDayTermDict[dayTerm]++;
                    } else {
                        revisitDayTermDict[dayTerm] = 1;
                    }
                }
            }

            const revisitCountInThisMonth = sortedCustomerDf.filter((row: any) =>
                moment(row.created_time).isSame(THIS_MONTH, 'month'),
            ).length;

            if (revisitCountInThisMonthDict[revisitCountInThisMonth]) {
                revisitCountInThisMonthDict[revisitCountInThisMonth]++;
            } else {
                revisitCountInThisMonthDict[revisitCountInThisMonth] = 1;
            }
        }

        let revisitSum = 0;
        for (const key in revisitCountDict) {
            if (revisitCountDict.hasOwnProperty(key)) {
                revisitSum += Number(key) * revisitCountDict[key];
            }
        }

        console.log('revisitCountInThisMonthDict', revisitCountInThisMonthDict);
        console.log('revisitDayTermDict', revisitDayTermDict);
        console.log('revisitCountDict', revisitCountDict);
        console.log('revisitSum', revisitSum);
        return {
            revisitCountDict: revisitCountDict,
            revisitDayTermDict: revisitDayTermDict,
            revisitCountInThisMonthDict: revisitCountInThisMonthDict,
            revisitSum: revisitSum,
        };
    }

    isPrimitive(obj: any): boolean {
        return (typeof obj !== 'object' && typeof obj !== 'function') || obj === null;
    }

    scoreDecrypt(input: any) {
        const firstDigitMap: any = {
            'P5': '0',
            'am': '1',
            '!0': '2',
            'c0': '3',
            '3d': '4',
            '*l': '5',
            '~~': '6',
            'zt': '7',
            '=y': '8',
            '?.': '9',
        };

        const secondDigitMap: any = {
            'HPC': '0',
            '*v7': '1',
            '-ua': '2',
            'zgq': '3',
            'x91': '4',
            'man': '5',
            'pan': '6',
            'aZH': '7',
            '++8': '8',
            'kim': '9',
        };

        if (input.length === 2) {
            return Number(firstDigitMap[input]);
        } else if (input.length > 2) {
            let firstPart: any = input.slice(0, 2);

            firstPart = firstDigitMap[firstPart];

            let secondPart: any = input.slice(2);
            secondPart = secondDigitMap[secondPart];

            console.log(secondPart, firstPart);
            const concatResult = Number(firstPart + secondPart);

            return concatResult;
        } else {
            return null;
        }
    }

    preprocessing(
        data: any,
        files: {
            analyzedImage: Express.Multer.File[];
            originalImage: Express.Multer.File[];
            fineImage?: Express.Multer.File[];
            ultraFineImage?: Express.Multer.File[];
            deepImage?: Express.Multer.File[];
            ultraDeepImage?: Express.Multer.File[];
        },
        token: string,
    ) {
        data.kiosk = this.checkIfKiosk(token, data);

        if (!files?.analyzedImage || !files?.originalImage) {
            throw new BadRequestException({
                status: 40002,
                type: 'BadRequestError',
                message: 'No file!',
            });
        }

        if (files?.analyzedImage.length !== files?.originalImage.length) {
            throw new BadRequestException({
                status: 40002,
                type: 'BadRequestError',
                message: 'The number of analyzed images does not match number of original images',
            });
        }

        data.label = Array.isArray(data.label)
            ? data.label?.map((str: any) => str.trim())
            : data.label?.split(',').map((str: string) => str.trim());

        data.comment = Array.isArray(data.comment)
            ? data.comment?.map((str: string) => str.trim())
            : data.comment?.split(',').map((str: string) => str.trim());

        data.xy_coordinates = Array.isArray(data.xy_coordinates)
            ? data.xy_coordinates?.map((str: string) => str.trim())
            : data.xy_coordinates?.split(',').map((str: string) => str.trim());

        if (data.fineScore) {
            data.fineScore = Array.isArray(data.fineScore) ? data.fineScore : data.fineScore.split(',').map(Number);
            console.log(data.fineScore);
            data.fineScore = Array.isArray(data.fineScore)
                ? data.fineScore.map((str: any) => {
                      if (typeof str === 'string') {
                          return Number(str.trim());
                      }
                      return Number(str); // or handle the case when str is not a string
                  })
                : data.fineScore?.split(',').map((str: string) => Number(str.trim()));
        }

        if (data.ultraFineScore) {
            data.ultraFineScore = Array.isArray(data.ultraFineScore)
                ? data.ultraFineScore
                : data.ultraFineScore.split(',').map(Number);

            data.ultraFineScore = Array.isArray(data.ultraFineScore)
                ? data.ultraFineScore.map((str: any) => {
                      if (typeof str === 'string') {
                          return Number(str.trim());
                      }
                      return Number(str); // or handle the case when str is not a string
                  })
                : data.ultraFineScore?.split(',').map((str: string) => Number(str.trim()));
        }

        if (data.deepScore) {
            data.deepScore = Array.isArray(data.deepScore) ? data.deepScore : data.deepScore.split(',').map(Number);

            console.log(data.deepScore);
            data.deepScore = Array.isArray(data.deepScore)
                ? data.deepScore.map((str: any) => {
                      if (typeof str === 'string') {
                          return Number(str.trim());
                      }
                      return Number(str); // or handle the case when str is not a string
                  })
                : data.deepScore?.split(',').map((str: string) => Number(str.trim()));
        }

        if (data.ultraDeepScore) {
            data.ultraDeepScore = Array.isArray(data.ultraDeepScore)
                ? data.ultraDeepScore
                : data.ultraDeepScore.split(',').map(Number);
            console.log(data.ultraDeepScore);

            data.ultraDeepScore = Array.isArray(data.ultraDeepScore)
                ? data.ultraDeepScore.map((str: any) => {
                      if (typeof str === 'string') {
                          return Number(str.trim());
                      }
                      return Number(str); // or handle the case when str is not a string
                  })
                : data.ultraDeepScore?.split(',').map((str: string) => Number(str.trim()));
        }

        return data;
    }

    async offlineCbbOperation(
        data: OfflineDataCBBDTO,
        files: {
            analyzedImage: Express.Multer.File[];
            originalImage: Express.Multer.File[];
            fineImage?: Express.Multer.File[];
            ultraFineImage?: Express.Multer.File[];
            deepImage?: Express.Multer.File[];
            ultraDeepImage?: Express.Multer.File[];
        },
    ) {
        data.batch_id = Number(data.batchId);

        let algo: any;
        let algoId;
        let algoName;
        if (/[0-9]/.test(data.type)) {
            algo = this.getCBBTaskByAlgoType(Number(data.type));
            algoName = algo.algoName;
            algoId = algo.id;
        } else {
            data.task = this.getTaskByAlgoType(data.type);
            algo = await this.getAlgoID(toLower(data.type));
            algoId = algo['id'];
            algoName = algo['name'];
        }

        const analyzed: any[] = [];
        const original: any[] = [];
        const fine: any[] = [];
        const ultraFine: any[] = [];
        const deep: any[] = [];
        const ultraDeep: any[] = [];

        const retunAnalyzed: any[] = [];
        const returnOriginal: any[] = [];
        const returnFine: any[] = [];
        const returnUltraFine: any[] = [];
        const returnDeep: any[] = [];
        const returnUltraDeep: any[] = [];

        let saveFine: any = [];
        let saveUltraFine: any = [];
        let saveDeep: any = [];
        let saveUltraDeep: any = [];

        let scores: number[];
        let raw: number[];
        let decryptedScores = [];
        let decryptedRaw = [];
        let promitive = this.isPrimitive(data.args);

        if (promitive === true) {
            scores = JSON.parse(data.args).score;
            raw = JSON.parse(data.args).raw;

            if (data.encryptedCBB === true) {
                for (let i = 0; i < scores.length; i++) {
                    decryptedScores.push(this.scoreDecrypt(scores[i]));
                    decryptedRaw.push(this.scoreDecrypt(raw[i]));
                }
                scores = decryptedScores;
                raw = decryptedRaw;
            }
        } else {
            scores = data.args.score;
            raw = data.args.raw;
            if (data.encryptedCBB === true) {
                for (let i = 0; i < scores.length; i++) {
                    decryptedScores.push(this.scoreDecrypt(scores[i]));
                    decryptedRaw.push(this.scoreDecrypt(raw[i]));
                }
                scores = decryptedScores;
                raw = decryptedRaw;
            }
        }

        const savingPromise: Promise<any>[] = [];
        let sum = 0;
        scores = this.convertToNumbers(scores);
        sum = scores.reduce((accumulator, currentValue) => accumulator + currentValue);

        let computation = this.computation.computationResult(
            Number(data.type),
            data?.answers === undefined ? '' : data?.answers,
            scores,
            data?.kiosk,
        );

        /* K-HEADSPA LOGIC START */
        if (data.kHeadSpa === true) {
            const kHeadSpaResult = await this.kheadSpaCheck(data.batch_id, algoName, computation['computation_score']);

            if (kHeadSpaResult.timeWith24h === true) {
                computation['computation_score'] = kHeadSpaResult?.computationScore ?? computation['computation_score'];
                computation['keyWord'] = kHeadSpaResult.keywordScaling?.keyWord ?? computation['keyWord'];
                computation['keyword_id'] = kHeadSpaResult.keywordScaling?.keyword_id ?? computation['keyword_id'];
            } else {
                computation = computation;
            }
        }
        /* K-HEADSPA LOGIC END */

        const avg = sum / scores.length;
        const addLabel = data?.label?.length === files?.analyzedImage?.length;
        const addComment = data?.comment?.length === files?.analyzedImage?.length;
        const addXY = data?.xy_coordinates?.length === files?.analyzedImage?.length;
        // const addFineScore = data.fineScore?.length === files.analyzedImage?.length;
        // const addUltraFineScore = data.ultraFineScore?.length === files.analyzedImage?.length;
        // const addDeepScore = data.deepScore?.length === files.analyzedImage?.length;
        // const addUltraDeepScore = data.ultraDeepScore?.length === files.analyzedImage?.length;

        let imageRecordsList = [];
        for (let i = 0; i < files.analyzedImage?.length; i++) {
            imageRecordsList.push(uuidv4());
        }

        for (let i = 0; i < files.analyzedImage?.length; i++) {
            const imageRecords = imageRecordsList[i];
            const imageArg = this.handleCBBImageArg(data);
            analyzed.push([
                data.batch_id,
                imageArg.analyzedImageArgs.url,
                imageArg.analyzedImageArgs.sys_url,
                imageArg.analyzedImageArgs.hash,
                algoId,
                18,
                JSON.stringify({
                    nth_analysis: imageRecords,
                }),
                0,
            ]);

            original.push([
                data.batch_id,
                imageArg.originalImageArgs.url,
                imageArg.originalImageArgs.sys_url,
                imageArg.originalImageArgs.hash,
                algoId,
                21,
                JSON.stringify({
                    nth_analysis: imageRecords,
                    kiosk: data.kiosk,
                }),
                JSON.stringify({
                    score: scores[i],
                    raw: raw[i],
                    computation_score: computation['computation_score']?.toFixed(2),
                    questionnaire_score: computation['questionnaire_score']?.toFixed(2),
                    score_average: avg?.toFixed(2),
                    answers: data?.answers === undefined ? '' : data?.answers,
                    keyWord: computation['keyWord'],
                    label: addLabel ?? null,
                    comment: addComment ?? null,
                    xy_coordinates: addXY ?? null,
                    fine_score: algoId === 4 && data?.fineScore ? data?.fineScore[i] : null,
                    ultra_fine_score: algoId === 4 && data?.ultraFineScore ? data?.ultraFineScore[i] : null,
                    deep_score: algoId === 4 && data?.deepScore ? data?.deepScore[i] : null,
                    ultra_deep_score: algoId === 4 && data?.ultraDeepScore ? data?.ultraDeepScore[i] : null,
                    sebumType: data?.sebumType ? data?.sebumType : null,
                }),
            ]);

            //Image saving
            const savingData = this.offlineCBBSaveImage(
                files?.originalImage[i].buffer,
                files?.analyzedImage[i].buffer,
                imageArg,
                data,
            );
            savingPromise.push(savingData);
        }

        if (data.type && Number(data.type) === 7 && files.fineImage?.length > 0) {
            const ratio = Math.ceil(files.fineImage?.length / files.analyzedImage?.length);
            // if (addFineScore && addUltraFineScore && addDeepScore && addUltraDeepScore) {

            for (let i = 0; i < files.fineImage?.length; i++) {
                const imageRecords = imageRecordsList[Math.floor(i / ratio)];
                const imageArg = this.handleCBBImageArg(data);

                fine.push([
                    data.batch_id,
                    imageArg.fineImageArgs.url,
                    imageArg.fineImageArgs.sys_url,
                    imageArg.fineImageArgs.hash,
                    algoId,
                    28,
                    JSON.stringify({
                        nth_analysis: imageRecords,
                    }),
                    0,
                ]);

                ultraFine.push([
                    data.batch_id,
                    imageArg.ultraFineImageArgs.url,
                    imageArg.ultraFineImageArgs.sys_url,
                    imageArg.ultraFineImageArgs.hash,
                    algoId,
                    29,
                    JSON.stringify({
                        nth_analysis: imageRecords,
                    }),
                    0,
                ]);

                deep.push([
                    data.batch_id,
                    imageArg.deepImageArgs.url,
                    imageArg.deepImageArgs.sys_url,
                    imageArg.deepImageArgs.hash,
                    algoId,
                    30,
                    JSON.stringify({
                        nth_analysis: imageRecords,
                    }),
                    0,
                ]);

                ultraDeep.push([
                    data.batch_id,
                    imageArg.ultraDeepImageArgs.url,
                    imageArg.ultraDeepImageArgs.sys_url,
                    imageArg.ultraDeepImageArgs.hash,
                    algoId,
                    31,
                    JSON.stringify({
                        nth_analysis: imageRecords,
                    }),
                    0,
                ]);

                const savingData = this.offlineCBBWrinklesSaveImage(
                    files?.fineImage[i].buffer,
                    files?.ultraFineImage[i].buffer,
                    files?.deepImage[i].buffer,
                    files?.ultraDeepImage[i].buffer,
                    imageArg,
                    data,
                );

                savingPromise.push(savingData);
            }

            saveFine = fine.map((item) => {
                returnFine.push({
                    batchId: data.batch_id,
                    algorithm_type: data.type,
                    score: promitive === true ? JSON.parse(item[7]).score : item[7].score,
                    fineImage: {
                        id: item[3],
                        url: item[1],
                    },
                });
                return {
                    batch_id: item[0],
                    url: item[1],
                    sys_url: item[2],
                    hash: item[3],
                    type_measurement_id: item[4],
                    type_image_id: item[5],
                    args: item[6],
                    scores: item[7],
                };
            });

            saveUltraFine = ultraFine.map((item) => {
                returnUltraFine.push({
                    batchId: data.batch_id,
                    algorithm_type: data.type,
                    score: promitive === true ? JSON.parse(item[7]).score : item[7].score,
                    ultraFineImage: {
                        id: item[3],
                        url: item[1],
                    },
                });
                return {
                    batch_id: item[0],
                    url: item[1],
                    sys_url: item[2],
                    hash: item[3],
                    type_measurement_id: item[4],
                    type_image_id: item[5],
                    args: item[6],
                    scores: item[7],
                };
            });

            saveDeep = deep.map((item) => {
                returnDeep.push({
                    batchId: data.batch_id,
                    algorithm_type: data.type,
                    score: promitive === true ? JSON.parse(item[7]).score : item[7].score,
                    deepImage: {
                        id: item[3],
                        url: item[1],
                    },
                });
                return {
                    batch_id: item[0],
                    url: item[1],
                    sys_url: item[2],
                    hash: item[3],
                    type_measurement_id: item[4],
                    type_image_id: item[5],
                    args: item[6],
                    scores: item[7],
                };
            });

            saveUltraDeep = ultraDeep.map((item) => {
                returnUltraDeep.push({
                    batchId: data.batch_id,
                    algorithm_type: data.type,
                    score: promitive === true ? JSON.parse(item[7]).score : item[7].score,
                    ultraDeepImage: {
                        id: item[3],
                        url: item[1],
                    },
                });
                return {
                    batch_id: item[0],
                    url: item[1],
                    sys_url: item[2],
                    hash: item[3],
                    type_measurement_id: item[4],
                    type_image_id: item[5],
                    args: item[6],
                    scores: item[7],
                };
            });
        }

        const saveOriginal = original.map((item) => {
            returnOriginal.push({
                batchId: data.batch_id,
                algorithm_type: data.type,
                score: promitive === true ? JSON.parse(item[7]).score : item[7].score,
                originalImage: {
                    id: item[3],
                    url: item[1],
                },
            });
            return {
                batch_id: item[0],
                url: item[1],
                sys_url: item[2],
                hash: item[3],
                type_measurement_id: item[4],
                type_image_id: item[5],
                args: item[6],
                scores: item[7],
            };
        });

        const saveAnalyzed = analyzed.map((item) => {
            retunAnalyzed.push({
                analyzedImage: {
                    id: item[3],
                    url: item[1],
                },
            });
            return {
                batch_id: item[0],
                url: item[1],
                sys_url: item[2],
                hash: item[3],
                type_measurement_id: item[4],
                type_image_id: item[5],
                args: item[6],
                scores: item[7],
            };
        });

        const newArray = returnOriginal.map((item, index) => {
            if (Number(data.type) === 7 && files.fineImage?.length > 0) {
                // if (addFineScore && addUltraFineScore && addDeepScore && addUltraDeepScore) {
                return {
                    ...item,
                    analyzedImage: retunAnalyzed[index].analyzedImage,
                    fineImage: returnFine[index].fineImage,
                    ultraFineImage: returnUltraFine[index].ultraFineImage,
                    deepImage: returnDeep[index].deepImage,
                    ultraDeepImage: returnUltraDeep[index].ultraDeepImage,
                };
                // }
            }
            return {
                ...item,
                analyzedImage: retunAnalyzed[index].analyzedImage,
            };
        });

        const savedResult = [
            ...saveAnalyzed,
            ...saveOriginal,
            ...saveFine,
            ...saveUltraFine,
            ...saveDeep,
            ...saveUltraDeep,
        ];

        this.offlineCBBSaveData(savedResult);

        const retObject = {
            computation_score: computation['computation_score']?.toFixed(2),
            questionnaire_score: computation['questionnaire_score']?.toFixed(2),
            score_average: avg.toFixed(2),
            keyWord: computation['keyWord'],
            keyword_id: computation['keyword_id'],
            result: [...newArray],
        };

        Promise.all(savingPromise)
            .then(() => {
                console.log(`${data.type} : Success`);
            })
            .catch((error) => {
                console.log(error);
                // Handle errors that occurred during promise execution
                fs.appendFile('error.log', this.getErrorLog(data.batch_id), 'utf8', (err) => {
                    if (err) throw err;
                });
            });

        return retObject;
    }

    /*
        ------------ K-HeadSpa Manipulation START --------------------
    */

    getNewScore(oldScore: number, direction: number) {
        let newScore = -1;

        if (direction == -1) {
            newScore = oldScore * 0.8;
        }

        if (direction == 1) {
            newScore = Math.floor(Math.random() * 33) + 16;
        }

        return Math.round(newScore);
    }

    adjustSkinScore(oldComputedScore: number, currentComputedScore: number) {
        let adjustedScore = -1;
        // Adjust scores according to our keyword scale.
        // 0 - 5, clear
        // 6 - 15, almost clear
        // 16 - 48, mild
        // 49 - 80, moderate
        // 81 - 99, severe

        let currentLevel = 0;
        let oldLevel = 0;

        // ----- (1) ----- obtain current keyword level.
        if (currentComputedScore >= 0 && currentComputedScore < 6) currentLevel = 1;
        if (currentComputedScore >= 6 && currentComputedScore < 16) currentLevel = 2;
        if (currentComputedScore >= 16 && currentComputedScore < 49) currentLevel = 3;
        if (currentComputedScore >= 49 && currentComputedScore < 81) currentLevel = 4;
        if (currentComputedScore >= 81 && currentComputedScore <= 99) currentLevel = 5;
        // exception handling
        if (currentComputedScore < 0) currentLevel = 1;
        if (currentComputedScore > 99) currentLevel = 5;

        // ----- (2) ----- obtain previous keyword level.
        if (oldComputedScore >= 0 && oldComputedScore < 6) oldLevel = 1;
        if (oldComputedScore >= 6 && oldComputedScore < 16) oldLevel = 2;
        if (oldComputedScore >= 16 && oldComputedScore < 49) oldLevel = 3;
        if (oldComputedScore >= 49 && oldComputedScore < 81) oldLevel = 4;
        if (oldComputedScore >= 81 && oldComputedScore <= 99) oldLevel = 5;
        // exception handling
        if (oldComputedScore < 0) oldLevel = 1;
        if (oldComputedScore > 99) oldLevel = 5;

        // Stay within 0 - 5, clear
        if (currentLevel == 1 && oldLevel == 1) {
            if (currentComputedScore == 0) adjustedScore = 0; // nothing detected.
            if (currentComputedScore == 1) adjustedScore = 1; // something is detected, score should not be further reduced to 0.
            if (currentComputedScore > 1) adjustedScore = oldComputedScore - 1;
        } else {
            const ratioOfChange = (oldComputedScore - currentComputedScore) / oldComputedScore;

            if (ratioOfChange >= 0.2) adjustedScore = currentComputedScore;
            else adjustedScore = oldComputedScore * 0.8;
        }

        return Math.round(adjustedScore);
    }

    adjustSkinMoistureScores(oldScore: number, currentScore: number) {
        let newScore = -1;

        // Sebum & Moisture keyword levels:
        // 0 ~ 5, very dehydrated
        // 6 ~ 15, dehydrated
        // 16 ~ 48, normal
        // 49 ~ 80, hydrated
        // 81 ~ 99, very hydrated

        // NOTE: Target Skin Condition is Normal. Math.floor(Math.random() * 33) + 16;
        if (oldScore >= 16 && oldScore < 49)
            newScore = oldScore + Math.floor(Math.random() * (49 - Math.floor(oldScore)));
        else if (currentScore >= 16 && currentScore < 49) newScore = currentScore;
        else if (oldScore >= 49) {
            newScore = this.getNewScore(oldScore, -1);
        } // from 99 toward 16~48.
        else if (oldScore < 16) {
            newScore = this.getNewScore(oldScore, 1);
        } // from 0 toward 16~48

        return newScore;
    }

    adjustSkinSebumShineScores(oldScore: number, currentScore: number) {
        let newScore = -1;

        // Sebum & Moisture keyword levels:
        // 0 ~ 5, very dry
        // 6 ~ 15, dry
        // 16 ~ 48, normal
        // 49 ~ 80, oily
        // 81 ~ 99, very oily.

        // NOTE: Target Skin Condition is Normal.
        if (oldScore >= 16 && oldScore < 49) oldScore - Math.floor(Math.random() * (Math.floor(oldScore) - 16));
        else if (currentScore >= 16 && currentScore < 49) newScore = currentScore;
        else if (oldScore >= 49) {
            newScore = this.getNewScore(oldScore, -1);
        } // from 99 toward 16~48.
        else if (oldScore < 16) {
            newScore = this.getNewScore(oldScore, 1);
        } // from 0 toward 16~48

        return newScore;
    }

    // Adjust scores scalp sebum/oiliness/shine:
    // ---- providing 20% of improvement toward normal if old-score is >= 49.
    // ---- ensure score is in normal range if old-score is < 16.
    // ---- if old score already is in normal range, further improve results by decresing old score
    adjustScalpSebumShineScores(oldScore: number, currentScore: number) {
        let newScore = -1;
        // Sebum & Moisture keyword levels:
        // 0 ~ 5, very dry
        // 6 ~ 15, dry
        // 16 ~ 48, normal
        // 49 ~ 80, oily
        // 81 ~ 99, very oily.

        // NOTE: Target Skin Condition is Normal.
        if (oldScore >= 16 && oldScore < 49) oldScore - Math.floor(Math.random() * (Math.floor(oldScore) - 16));
        else if (currentScore >= 16 && currentScore < 49) {
            newScore = currentScore;
        } else if (oldScore >= 49) {
            newScore = this.getNewScore(oldScore, -1);
        } // from 99 toward 16~48.
        else if (oldScore < 16) {
            newScore = this.getNewScore(oldScore, 1);
        } // from 0 toward 16~48

        return newScore;
    }
    /*
        ------------ K-HeadSpa Manipulation END --------------------
    */

    // Time is within 24 hours
    isWithin24Hours(time1: Date, time2: Date): boolean {
        // Calculate the difference in milliseconds
        const diffInMilliseconds = Math.abs(time1.getTime() - time2.getTime());

        // Convert the difference to hours
        const diffInHours = diffInMilliseconds / (1000 * 60 * 60);

        // Check if the difference is less than or equal to 24 hours
        return diffInHours <= 24;
    }

    // Previous Batch_id of the customer

    async getPreviousBatchId(batchId: number) {
        const result = await this.database.executeQuery(
            `
                SELECT
                    batch_id, 
                    MIN(created_time) AS oldest_created_time
                FROM
                    analysis 
                WHERE
                    customer_id = ( SELECT customer_id FROM analysis WHERE batch_id = $1 )
                GROUP BY
                    batch_id	
                ORDER BY batch_id DESC, created_time ASC 
                LIMIT 2
            `,
            [batchId],
        );

        // Check if there is a previous batch_id
        const timeWith24h = this.isWithin24Hours(result[0]['oldest_created_time'], result[0]['oldest_created_time']);

        let batchAnalysis;
        if (result.length === 1) {
            batchAnalysis = result[0]['batch_id'];
        } else {
            batchAnalysis = result[1]['batch_id'];
        }

        return {
            batchId: batchAnalysis,
            timeWith24h: timeWith24h,
        };
    }

    async AllAnaysisScore(batchId: number) {
        const result = await this.database.executeQuery(
            `
            SELECT
                ROUND(AVG_SCORE, 2) AS computation,
                NAME AS measurement
            FROM (
                SELECT 
                    tp.NAME as Name,
                    tp."id" as id,
                    ROUND(
                        COALESCE(
                            AVG(CAST(scores->>'computation_score' AS NUMERIC)),
                            AVG(CAST(scores->>'score' AS NUMERIC))
                        ),
                    2) AS AVG_SCORE
                FROM measurements AS ms
                JOIN type_measurements AS tp ON tp."id" = ms.type_measurement_id 
                WHERE batch_id = $1 AND type_image_id = 21
                GROUP BY tp.NAME, tp."id"
            ) AS subquery;
            `,
            [batchId],
        );

        return result;
    }

    async kheadSpaCheck(batchId: number, algoName: any, computation: number) {
        // Retrieve analysis scores for the specified batchId
        const previousBatch = await this.getPreviousBatchId(batchId);
        const result = await this.AllAnaysisScore(previousBatch.batchId);

        let computationScore: any;

        // Filter the relevant measurement based on algoName
        const relevantMeasurement = result.find((val: any) => val.measurement === algoName);

        let keywordScaling;
        // If relevant measurement found, adjust the skin score accordingly
        if (relevantMeasurement) {
            if (
                algoName === 'shine' ||
                algoName === 'spots' ||
                algoName === 'pores' ||
                algoName === 'porphyrin' ||
                algoName === 'wrinkles' ||
                algoName === 'sensitivityredness' ||
                algoName === 'keratin'
            ) {
                computationScore = this.adjustSkinScore(relevantMeasurement.computation, computation);
                keywordScaling = this.computation.keywordScaling(computationScore);
            } else if (toLower(algoName.includes) === 'sebum') {
                computationScore = this.adjustSkinSebumShineScores(relevantMeasurement.computation, computation);
            } else if (toLower(algoName.includes) === 'moisture') {
                computationScore = this.adjustSkinMoistureScores(relevantMeasurement.computation, computation);
            }
        }

        return {
            computationScore: computationScore ?? computation,
            keywordScaling: keywordScaling,
            timeWith24h: previousBatch.timeWith24h,
        };
    }

    convertToNumbers(input: any): any {
        // Check if the input is an array
        if (Array.isArray(input)) {
            // If it's an array, map each element to a number
            return input.map(Number);
        } else {
            // If it's not an array, convert the input to a number directly
            return [Number(input)];
        }
    }

    checkIfKiosk(token: any, data: any) {
        try {
            const decoded: any = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

            const kioskAppId: number[] = [110, 51, 42];
            const app_id = decoded['app_id'];

            console.log(Number(app_id), kioskAppId.includes(Number(app_id)));
            const deviceMode = data?.deviceModel?.toLowerCase();
            const check = 'duple';

            if (app_id) {
                if (kioskAppId.includes(Number(app_id)) || deviceMode.includes(check)) {
                    return true;
                } else {
                    return false;
                }
            } else {
                return true;
            }
        } catch (e) {
            throw new Error();
        }
    }

    average(array: number[]) {
        if (array.length === 0) return 0; // Handle empty array

        let sum = 0;
        for (let i = 0; i < array.length; i++) {
            sum += array[i];
        }

        return sum / array.length;
    }
    analysisCbb(data: analysisCBBDTO) {
        const keratin = this.computation.computationResult(1, data.answers, this.average(data.keratin ?? []), false);
        const pores = this.computation.computationResult(2, data.answers, this.average(data.pores ?? []), false);
        const impurities = this.computation.computationResult(
            3,
            data.answers,
            this.average(data.impurities ?? []),
            false,
        );
        const sebum = this.computation.computationResult(4, data.answers, this.average(data.keratin ?? []), false);
        const oiliness = this.computation.computationResult(5, data.answers, this.average(data.keratin ?? []), false);
        const spots = this.computation.computationResult(6, data.answers, this.average(data.keratin ?? []), false);
        const wrinkles = this.computation.computationResult(7, data.answers, this.average(data.keratin ?? []), false);

        const redness = this.computation.computationResult(10, data.answers, this.average(data.keratin ?? []), false);

        return {
            keratin: keratin,
            pores: pores,
            impurities: impurities,
            sebum: sebum,
            oiliness: oiliness,
            spots: spots,
            wrinkles: wrinkles,
            redness: redness,
        };
    }
}
