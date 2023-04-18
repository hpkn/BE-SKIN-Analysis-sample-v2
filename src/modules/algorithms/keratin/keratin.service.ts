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
export class KeratinService {
  constructor(
    private database: DatabaseService,
    private S3Image: FileUploadService,
    private batchAnalysis: BatchAnalysisService,
  ) {}

  async analysis(
    data: AlgoAnalysisDTO,
    taskResponse: any,
    imageRecords: any,
    originalImage: any,
  ) {
    const analyzedImage = Buffer.from(taskResponse.img, 'base64');
    const maskImage = Buffer.from(taskResponse.mask, 'base64');
    const originalImageSave = Buffer.from(originalImage, 'base64');

    const analyzedImageArgs = this.S3Image.getImageArgs(
      'analyzedImage',
      data.task.algoName,
    );
    const maskImageArgs = this.S3Image.getImageArgs(
      'maskImage',
      data.task.algoName,
    );

    const originalImageArgs = this.S3Image.getImageArgs(
      'originalImage',
      data.task.algoName,
    );

    await this.S3Image.uploadImage(analyzedImage, analyzedImageArgs.sys_url);
    await this.S3Image.uploadImage(maskImage, maskImageArgs.sys_url);
    await this.S3Image.uploadImage(
      originalImageSave,
      originalImageArgs.sys_url,
    );

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
      'INSERT INTO measurement (batch_id, url, sys_url, hash, type_measurement_id, type_image_id, args, scores) data ($1, $2, $3, $4, $5, $6, $7, $8)';
    // const saveArgsSql = 'INSERT INTO keratin (batch_id, args) data ($1, $2)';
    const queries = [
      //   {
      //     statement: saveArgsSql,
      //     variables: [data.batch_id, JSON.stringify(taskResponse)],
      //   },
      {
        //analyzed_image
        variables: [
          data.batch_id,
          analyzedImageArgs.url,
          analyzedImageArgs.sys_url,
          analyzedImageArgs.hash,
          11,
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
          11,
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
          maskImageArgs.url,
          maskImageArgs.sys_url,
          maskImageArgs.hash,
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

    // this.database.executeQuery(queries);

    //  saveEnvironmentData

    // JSON.stringify({
    //     nth_analysis: imageRecords,
    //     lat: data.lat,
    //     long: data.long,
    //     deviceModel: data.deviceModel,
    //     deviceOS: data.deviceOS,
    //     temperature: data.temperature,
    //     humidity: data.humidity,
    //     uv_index: data.uv_index,
    //     positionNumber: data.positionNumber,
    //   })
  }
}
