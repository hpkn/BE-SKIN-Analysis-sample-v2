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
export class PoresService {
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
    const analyzedImageS = Buffer.from(taskResponse.img_S, 'base64');
    const analyzedImageM = Buffer.from(taskResponse.img_M, 'base64');
    const analyzedImageB = Buffer.from(taskResponse.img_B, 'base64');
    const maskImageS = Buffer.from(taskResponse.mask_S, 'base64');
    const maskImageM = Buffer.from(taskResponse.mask_M, 'base64');
    const maskImageB = Buffer.from(taskResponse.mask_B, 'base64');

    const analyzedImageArgs = this.S3Image.getImageArgs(
      'analyzedImage',
      data.task.algoName,
    );
    const analyzedImageArgsS = this.S3Image.getImageArgs(
      'analyzedImageSmall',
      data.task.algoName,
    );
    const analyzedImageArgsM = this.S3Image.getImageArgs(
      'analyzedImageMedium',
      data.task.algoName,
    );
    const analyzedImageArgsB = this.S3Image.getImageArgs(
      'analyzedImageBig',
      data.task.algoName,
    );
    const maskImageArgsS = this.S3Image.getImageArgs(
      'maskImageSmall',
      data.task.algoName,
    );
    const maskImageArgsM = this.S3Image.getImageArgs(
      'maskImageMedium',
      data.task.algoName,
    );
    const maskImageArgsB = this.S3Image.getImageArgs(
      'maskImageBig',
      data.task.algoName,
    );

    const originalImageSave = Buffer.from(originalImage, 'base64');

    const maskImageArgs = this.S3Image.getImageArgs(
      'maskImage',
      data.task.algoName,
    );

    const originalImageArgs = this.S3Image.getImageArgs(
      'originalImage',
      data.task.algoName,
    );

    await this.S3Image.uploadImage(analyzedImage, analyzedImageArgs.sys_url);

    await this.S3Image.uploadImage(analyzedImageS, analyzedImageArgsS.sys_url);

    await this.S3Image.uploadImage(analyzedImageM, analyzedImageArgsM.sys_url);

    await this.S3Image.uploadImage(analyzedImageB, analyzedImageArgsB.sys_url);

    await this.S3Image.uploadImage(maskImageS, maskImageArgsS.sys_url);

    await this.S3Image.uploadImage(maskImageM, maskImageArgsM.sys_url);

    await this.S3Image.uploadImage(maskImageB, maskImageArgsB.sys_url);

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
          1,
          18,
          JSON.stringify({
            nth_analysis: imageRecords,
          }),
          null,
        ],
      },
      {
        //analyzedImageSmall
        variables: [
          data.batch_id,
          analyzedImageArgsS.url,
          analyzedImageArgsS.sys_url,
          analyzedImageArgsS.hash,
          1,
          25,
          JSON.stringify({
            nth_analysis: imageRecords,
          }),
          null,
        ],
      },
      {
        //analyzed_image_Medium
        variables: [
          data.batch_id,
          analyzedImageArgsM.url,
          analyzedImageArgsM.sys_url,
          analyzedImageArgsM.hash,
          1,
          16,
          JSON.stringify({
            nth_analysis: imageRecords,
          }),
          null,
        ],
      },
      {
        //analyzed_image_big
        variables: [
          data.batch_id,
          analyzedImageArgsB.url,
          analyzedImageArgsB.sys_url,
          analyzedImageArgsB.hash,
          1,
          24,
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
          1,
          15,
          JSON.stringify({
            nth_analysis: imageRecords,
          }),
          null,
        ],
      },
      {
        // maskImageSmall
        variables: [
          data.batch_id,
          maskImageArgsS.url,
          maskImageArgsS.sys_url,
          maskImageArgsS.hash,
          1,
          4,
          JSON.stringify({
            nth_analysis: imageRecords,
          }),
          null,
        ],
      },
      {
        // maskImgaMedium
        variables: [
          data.batch_id,
          maskImageArgsM.url,
          maskImageArgsM.sys_url,
          maskImageArgsM.hash,
          1,
          16,
          JSON.stringify({
            nth_analysis: imageRecords,
          }),
          null,
        ],
      },
      {
        // maskImageBig
        variables: [
          data.batch_id,
          maskImageArgsB.url,
          maskImageArgsB.sys_url,
          maskImageArgsB.hash,
          1,
          26,
          JSON.stringify({
            nth_analysis: imageRecords,
          }),
          null,
        ],
      },
      {
        //Original
        variables: [
          data.batch_id,
          maskImageArgs.url,
          maskImageArgs.sys_url,
          maskImageArgs.hash,
          1,
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
      analyzedImageSmall: {
        id: analyzedImageArgsS.hash,
        url: analyzedImageArgsS.url,
      },
      analyzedImageMedium: {
        id: analyzedImageArgsM.hash,
        url: analyzedImageArgsM.url,
      },
      analyzedImageBig: {
        id: analyzedImageArgsB.hash,
        url: analyzedImageArgsB.url,
      },
      maskImageSmall: {
        id: maskImageArgsS.hash,
        url: maskImageArgsS.url,
      },
      maskImageMedium: {
        id: maskImageArgsM.hash,
        url: maskImageArgsM.url,
      },
      maskImageBig: {
        id: maskImageArgsB.hash,
        url: maskImageArgsB.url,
      },
      originalImage: {
        id: originalImageArgs.hash,
        url: originalImageArgs.url,
      },
    };

    taskResponse = { ...taskResponse, ...retObj };

    return taskResponse;
  }
}
