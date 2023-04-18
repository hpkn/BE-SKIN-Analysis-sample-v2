import { Injectable, Inject, HttpException } from '@nestjs/common';
import { GetcustomerHistoryDTO } from 'src/common/Dto/customer/analysisHistory/analysisHistory.dto';
import { DatabaseService } from 'src/database/database.service';
import * as celery from 'celery-node';
import { v4 as uuidv4 } from 'uuid';
import { AlgoAnalysisDTO } from 'src/common/Dto/analysis/algoAnalysis.dto';
import fs from 'fs';
import { FileUploadService } from '../../../common/FileUpload/fileUpload.service';
import { KeratinService } from 'src/modules/algorithms/keratin/keratin.service';
import { PoresService } from 'src/modules/algorithms/pores/pores.service';

@Injectable()
export class AlgoAnalysisService {
  constructor(
    private database: DatabaseService,
    private keratin: KeratinService,
    private pores: PoresService,
  ) {}

  async getTaskByAlgoType(type: string) {
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

  async handleAnalysisSave(
    data: AlgoAnalysisDTO,
    taskResponse: any,
    imageRecords: any,
    originalImage: any,
  ) {
    switch (data.type) {
      case 'keratin':
        return this.keratin.analysis(
          data,
          taskResponse,
          imageRecords,
          originalImage,
        );
      case 'pores':
        return this.pores.analysis(
          data,
          taskResponse,
          imageRecords,
          originalImage,
        );
      // case 'porphyrin':
      //   return algorithms.porphyrin(req, data, taskResponse, imageRecords);
      // case 'sebum':
      //   return algorithms.sebum(req, data, taskResponse, imageRecords);
      // case 'shine':
      //   return algorithms.shine(req, data, taskResponse, imageRecords);
      // case 'spots':
      //   return algorithms.spots(req, data, taskResponse, imageRecords);
      // case 'skintone':
      //   return algorithms.skintone(req, data, taskResponse, imageRecords);
      // case 'skintone_dior':
      //   return algorithms.skintone_dior(req, data, taskResponse, imageRecords);
      // case 'wrinkles':
      //   return algorithms.wrinkles(req, data, taskResponse, imageRecords);
      // case 'sensitivityscabs':
      //   return algorithms.sensitivityScabs(
      //     req,
      //     data,
      //     taskResponse,
      //     imageRecords,
      //   );
      // case 'sensitivityscaling':
      //   return algorithms.sensitivityScaling(
      //     req,
      //     data,
      //     taskResponse,
      //     imageRecords,
      //   );
      // case 'sensitivityredness':
      //   return algorithms.sensitivityRedness(
      //     req,
      //     data,
      //     taskResponse,
      //     imageRecords,
      //   );
      // case 'fitzSG':
      //   return algorithms.fitzSG(req, data, taskResponse, imageRecords);
      default:
        throw new Error('No such analysis type');
    }
  }

  async finalAnalysis(data: AlgoAnalysisDTO, image: Express.Multer.File) {
    const client = celery.createClient('redis://localhost', 'redis://');
    let algoList = [
      'keratin',
      'pores',
      'porphyrin',
      'sebum',
      'shine',
      'spots',
      'skintone',
      'wrinkles',
      'sensitivityscabs',
      'sensitivityscaling',
      'sensitivityredness',
    ];
    if (!algoList.includes(data.type)) {
      throw new HttpException(
        `We don't have such type of algorithm -> ${data.type}`,
        40001,
      );
    }

    const originalImage = image.buffer.toString('base64');
    // console.log(originalImage);

    data.task = this.getTaskByAlgoType(data.type);
    const task = client.createTask(data.task.taskName);

    let result: any;

    if (data.task.taskName === 'CNDP_SkinTone') {
      result = task.applyAsync([
        originalImage,
        '/home/ubuntu/repositories/cfa-python/CNDP/files/chart.png',
      ]);
    } else if (data.task.taskName === 'CNDP_FitzSG') {
      result = task.applyAsync([
        originalImage,
        '/home/ubuntu/repositories/cfa-python/CNDP/files/chart.png',
      ]);
    } else {
      result = task.applyAsync([originalImage]);
    }

    const taskResponse = await result.get();

    if (taskResponse.err) {
      throw new HttpException(
        `analysis - ${data.task.taskName} -> ${data.type}`,
        40004,
      );
    }

    const imageRecords = uuidv4();

    let args = await this.handleAnalysisSave(
      data,
      taskResponse,
      imageRecords,
      originalImage,
    );
    let responseBody = {
      batchId: data.batch_id,
      algorithm_type: data.type,
      ...args,
    };

    return responseBody;
  }

  async insertImage(
    batch_id: any,
    url: string,
    sys_url: string,
    hash: string,
    type_image_id: any,
    args: any,
  ) {
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
      const mesureId = await this.database.executeQuery(
        `SELECT id FROM type_images WHERE name = '${name}'`,
      );
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
