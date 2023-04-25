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

    async handleAnalysis(data: AlgoAnalysisDTO, taskResponse: any, imageRecords: any) {
        try {
            switch (data.type) {
                case 'keratin':
                    return this.keratin.analysis(data, taskResponse);

                case 'pores':
                    return this.pores.analysis(data, taskResponse);
                case 'porphyrin':
                    return this.porphyrin.analysis(data, taskResponse);
                case 'sebum':
                    return this.sebum.analysis(data, taskResponse);
                // case 'sebumT':
                //     return this.sebumT.analysis(data, taskResponse);
                case 'shine':
                    return this.shine.analysis(data, taskResponse);
                case 'spots':
                    return this.spots.analysis(data, taskResponse);
                case 'skintone':
                    return this.skintone.analysis(data, taskResponse);
                case 'skintone_dior':
                    return this.skintone_dior.analysis(data, taskResponse);
                case 'wrinkles':
                    return this.wrinkles.analysis(data, taskResponse);
                case 'sensitivityscabs':
                    return this.sensitivityScabs.analysis(data, taskResponse);
                case 'sensitivityscaling':
                    return this.sensitivityScaling.analysis(data, taskResponse);
                case 'sensitivityredness':
                    return this.sensitivityredness.analysis(data, taskResponse);
                case 'fitzSG':
                    return this.fitzSG.analysis(data, taskResponse);
                default:
                    throw new Error('No such analysis type');
            }
        } catch (e) {
            console.log(e);
        }
    }

    async handleSaving(data: AlgoAnalysisDTO, taskResponse: any, imageRecords: any, originalImage: any) {
        switch (data.type) {
            case 'keratin':
                this.keratin.saveData(data, taskResponse, imageRecords, originalImage);

                return;
            case 'pores':
                return this.pores.saveData(data, taskResponse, imageRecords, originalImage);
            case 'porphyrin':
                return this.porphyrin.saveData(data, taskResponse, imageRecords, originalImage);
            case 'sebum':
                return this.sebum.saveData(data, taskResponse, imageRecords, originalImage);
            // case 'sebumT':
            //     return this.sebumT.saveData(data, taskResponse, imageRecords, originalImage);
            case 'shine':
                return this.shine.saveData(data, taskResponse, imageRecords, originalImage);
            case 'spots':
                return this.spots.saveData(data, taskResponse, imageRecords, originalImage);
            case 'skintone':
                return this.skintone.saveData(data, taskResponse, imageRecords, originalImage);
            case 'skintone_dior':
                return this.skintone_dior.saveData(data, taskResponse, imageRecords, originalImage);
            case 'wrinkles':
                return this.wrinkles.saveData(data, taskResponse, imageRecords, originalImage);
            case 'sensitivityscabs':
                return this.sensitivityScabs.saveData(data, taskResponse, imageRecords, originalImage);
            case 'sensitivityscaling':
                return this.sensitivityScaling.saveData(data, taskResponse, imageRecords, originalImage);
            case 'sensitivityredness':
                return this.sensitivityredness.saveData(data, taskResponse, imageRecords, originalImage);
            case 'fitzSG':
                return this.fitzSG.saveData(data, taskResponse, imageRecords, originalImage);
            default:
                throw new Error('No such analysis type');
        }
    }

    async finalAnalysis(data: AlgoAnalysisDTO, imageRecords: any, taskResponse: any) {
        try {
            if (taskResponse.err) {
                throw new HttpException(`analysis - ${data.task.taskName} -> ${data.type}`, 40004);
            }

            let args = await this.handleAnalysis(data, taskResponse, imageRecords);
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

    async finalSave(data: AlgoAnalysisDTO, image: Express.Multer.File, imageRecords: any, taskResponse: any) {
        if (taskResponse.err) {
            throw new HttpException(`analysis - ${data.task.taskName} -> ${data.type}`, 40004);
        }

        let args = await this.handleSaving(data, taskResponse, imageRecords, image.buffer);
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

