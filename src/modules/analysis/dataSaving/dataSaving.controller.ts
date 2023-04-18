import {
  Controller,
  Body,
  Get,
  Post,
  UseInterceptors,
  UploadedFiles,
  Res,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { DataSavingService } from './dataSaving.service';
import { ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request, response, Response } from 'express';
import { FileUploadService } from 'src/common/FileUpload/fileUpload.service';

@Controller('analysis')
export class DataSavingController {
  constructor(
    private readonly dataSaving: DataSavingService,
    private readonly fileUpload: FileUploadService,
  ) {}

  @Post('/getBatchId')
  async getBatchId(@Body() data: any, @Res() res: Response) {
    try {
      let { customer_id, deviceOS, latitude, longitude, deviceModel, hpFlag } =
        data;
      let metadata = {
        deviceOS: deviceOS,
        latitude: latitude,
        longitude: longitude,
        deviceModel: deviceModel,
        hpFlag: hpFlag,
      };
      let insertObjet = JSON.stringify(metadata);
      const insert = await this.dataSaving.insertInAnalysis(
        customer_id,
        insertObjet,
      );

      return res.status(200).json({
        status: 200,
        service: 'getBatchId',
        batch_id: insert,
      });
    } catch (e) {
      throw new Error(e);
    }
  }

  @Post('/dataSync')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'masks', maxCount: 5 },
      { name: 'ppl', maxCount: 3 },
      { name: 'xpl', maxCount: 3 },
      { name: 'uvl', maxCount: 4 },
      { name: 'uvl_impurities', maxCount: 1 },
    ]),
  )
  @ApiConsumes('multipart/form-data')
  async saveData(
    @UploadedFiles()
    files: {
      masks: Express.Multer.File[];
      ppl: Express.Multer.File[];
      uvl: Express.Multer.File[];
      xpl: Express.Multer.File[];
      uvl_impurities: Express.Multer.File[];
    },
    @Body() data: any,
    @Res() res: Response,
  ) {
    let { batch_id, scores, raws, type, PRE_light, POST_light } = data;

    await this.dataSaving.updateLight(batch_id, PRE_light, POST_light);
    let typeOfImage;

    if (files?.ppl) {
      if (files?.ppl[0]) {
        typeOfImage = 'front_ppl';
        const imageArg = this.fileUpload.getImageArgs(
          'front_ppl',
          '/images/original/',
        );
        let imageType = await this.dataSaving.getImage(typeOfImage);
        let args = typeOfImage;
        await this.fileUpload.uploadImage(
          files?.ppl[0].buffer,
          imageArg.sys_url,
        );
        this.dataSaving.insertImage(
          batch_id,
          imageArg.url,
          imageArg.sys_url,
          imageArg.hash,
          imageType,
          JSON.stringify({ args }),
        );
      }

      if (files?.ppl[1]) {
        typeOfImage = 'left_ppl';
        const imageArg = this.fileUpload.getImageArgs(
          'left_ppl',
          '/images/original/',
        );
        let imageType = await this.dataSaving.getImage(typeOfImage);
        let args = typeOfImage;
        await this.fileUpload.uploadImage(
          files?.ppl[1].buffer,
          imageArg.sys_url,
        );
        this.dataSaving.insertImage(
          batch_id,
          imageArg.url,
          imageArg.sys_url,
          imageArg.hash,
          imageType,
          JSON.stringify({ args }),
        );
      }

      if (files?.ppl[2]) {
        typeOfImage = 'right_ppl';
        const imageArg = this.fileUpload.getImageArgs(
          typeOfImage,
          '/images/original/',
        );
        let imageType = await this.dataSaving.getImage(typeOfImage);
        let args = typeOfImage;
        await this.fileUpload.uploadImage(
          files?.ppl[2].buffer,
          imageArg.sys_url,
        );
        this.dataSaving.insertImage(
          batch_id,
          imageArg.url,
          imageArg.sys_url,
          imageArg.hash,
          imageType,
          JSON.stringify({ args }),
        );
      }
    }

    if (files.xpl) {
      if (files.xpl[0]) {
        typeOfImage = 'front_xpl';
        const imageArg = this.fileUpload.getImageArgs(
          typeOfImage,
          '/images/original/',
        );
        let imageType = await this.dataSaving.getImage(typeOfImage);
        let args = typeOfImage;
        await this.fileUpload.uploadImage(
          files.xpl[0].buffer,
          imageArg.sys_url,
        );
        this.dataSaving.insertImage(
          batch_id,
          imageArg.url,
          imageArg.sys_url,
          imageArg.hash,
          imageType,
          JSON.stringify({ args }),
        );
      }

      if (files.xpl[1]) {
        typeOfImage = 'left_xpl';
        let imageType = await this.dataSaving.getImage(typeOfImage);
        let args = typeOfImage;
        const imageArg = this.fileUpload.getImageArgs(
          typeOfImage,
          '/images/original/',
        );
        await this.fileUpload.uploadImage(
          files.xpl[1].buffer,
          imageArg.sys_url,
        );
        this.dataSaving.insertImage(
          batch_id,
          imageArg.url,
          imageArg.sys_url,
          imageArg.hash,
          imageType,
          JSON.stringify({ args }),
        );
      }

      if (files.xpl[2]) {
        typeOfImage = 'right_xpl';
        let imageType = await this.dataSaving.getImage(typeOfImage);
        const imageArg = this.fileUpload.getImageArgs(
          typeOfImage,
          '/images/original/',
        );
        let args = typeOfImage;
        await this.fileUpload.uploadImage(
          files.xpl[2].buffer,
          imageArg.sys_url,
        );
        this.dataSaving.insertImage(
          batch_id,
          imageArg.url,
          imageArg.sys_url,
          imageArg.hash,
          imageType,
          JSON.stringify({ args }),
        );
      }
    }

    // console.log(scores)
    if (type.toLowerCase() === 'redness') {
      let redness_front_score = scores[0];
      let redness_left_score = scores[1];
      let redness_right_score = scores[2];
      let redness_final_score = scores[3];
      let redness_front_raw = raws[0];
      let redness_left_raw = raws[1];
      let redness_right_raw = raws[2];

      const score = {
        redness_front_score: redness_front_score,
        redness_left_score: redness_left_score,
        redness_right_score: redness_right_score,
        redness_final_score: redness_final_score,
      };

      const rawValues = {
        redness_front_raw: redness_front_raw,
        redness_left_raw: redness_left_raw,
        redness_right_raw: redness_right_raw,
      };

      let frontfileArg = this.fileUpload.getMaskArgs(
        'redness',
        '/images/mask/',
      );
      await this.fileUpload.uploadImage(
        files.masks[0].buffer,
        frontfileArg.sys_url,
      );
      let leftfileArg = this.fileUpload.getMaskArgs('redness', '/images/mask/');
      await this.fileUpload.uploadImage(
        files.masks[1].buffer,
        leftfileArg.sys_url,
      );
      let rightfileArg = this.fileUpload.getMaskArgs(
        'redness',
        '/images/mask/',
      );
      await this.fileUpload.uploadImage(
        files.masks[2].buffer,
        rightfileArg.sys_url,
      );

      const images = {
        front: {
          url: frontfileArg.url,
          sys_url: frontfileArg.sys_url,
          hash: frontfileArg.hash,
        },
        left: {
          url: leftfileArg.url,
          sys_url: leftfileArg.sys_url,
          hash: leftfileArg.hash,
        },
        right: {
          url: rightfileArg.url,
          sys_url: rightfileArg.sys_url,
          hash: rightfileArg.hash,
        },
      };

      const args = { images: images, score: score, rawValues: rawValues };
      const measureId = await this.dataSaving.getMeasurmant(type.toLowerCase());

      this.dataSaving.insertInMesurement(
        batch_id,
        JSON.stringify(args),
        measureId,
      );
    } else if (type.toLowerCase() === 'oiliness') {
      let oiliness_final_score = scores[0];
      let oiliness_raw = raws[0];
      const score = {
        oiliness_final_score: oiliness_final_score,
      };

      const rawValues = {
        oiliness_raw: oiliness_raw,
      };

      let frontWArg = this.fileUpload.getMaskArgs('oiliness', '/images/mask/');
      await this.fileUpload.uploadImage(
        files.masks[0].buffer,
        frontWArg.sys_url,
      );
      let frontGArg = this.fileUpload.getMaskArgs('oiliness', '/images/mask/');
      await this.fileUpload.uploadImage(
        files.masks[1].buffer,
        frontGArg.sys_url,
      );

      const images = {
        frontW: {
          url: frontWArg.url,
          sys_url: frontWArg.sys_url,
          hash: frontWArg.hash,
        },
        frontG: {
          url: frontGArg.url,
          sys_url: frontGArg.sys_url,
          hash: frontGArg.hash,
        },
      };

      const args = { images: images, score: score, rawValues: rawValues };
      const measureId = await this.dataSaving.getMeasurmant(type.toLowerCase());

      this.dataSaving.insertInMesurement(
        batch_id,
        JSON.stringify(args),
        measureId,
      );
    } else if (type.toLowerCase() === 'radiance') {
      let radiance_final_score = scores[0];
      let radiance_final_raw = raws[0];

      const score = {
        radiance_final_score: radiance_final_score,
      };

      const rawValues = {
        radiance_final_raw: radiance_final_raw,
      };

      let frontWArg = this.fileUpload.getMaskArgs('radiance', '/images/mask/');
      await this.fileUpload.uploadImage(
        files.masks[0].buffer,
        frontWArg.sys_url,
      );
      let frontGArg = this.fileUpload.getMaskArgs('radiance', '/images/mask/');
      await this.fileUpload.uploadImage(
        files.masks[1].buffer,
        frontGArg.sys_url,
      );

      const images = {
        frontW: {
          url: frontWArg.url,
          sys_url: frontWArg.sys_url,
          hash: frontWArg.hash,
        },
        frontG: {
          url: frontGArg.url,
          sys_url: frontGArg.sys_url,
          hash: frontGArg.hash,
        },
      };

      const args = { images: images, score: score, rawValues: rawValues };
      const measureId = await this.dataSaving.getMeasurmant(type.toLowerCase());

      this.dataSaving.insertInMesurement(
        batch_id,
        JSON.stringify(args),
        measureId,
      );
    } else if (type.toLowerCase() === 'dullness') {
      let dullness_final_score = scores[0];

      const score = {
        dullness_final_score: dullness_final_score,
      };

      let frontWArg = this.fileUpload.getMaskArgs('dullness', '/images/mask/');
      await this.fileUpload.uploadImage(
        files.masks[0].buffer,
        frontWArg.sys_url,
      );
      let frontGArg = this.fileUpload.getMaskArgs('dullness', '/images/mask/');

      const images = {
        frontW: {
          url: frontWArg.url,
          sys_url: frontWArg.sys_url,
          hash: frontWArg.hash,
        },
        frontG: {
          url: frontGArg.url,
          sys_url: frontGArg.sys_url,
          hash: frontGArg.hash,
        },
      };

      const args = { images: images, score: score };
      const measureId = await this.dataSaving.getMeasurmant(type.toLowerCase());

      this.dataSaving.insertInMesurement(
        batch_id,
        JSON.stringify(args),
        measureId,
      );
    } else if (type.toLowerCase() === 'pores') {
      let pores_final_score = scores[0];
      let pores_final_raw = raws[0];

      const score = {
        pores_final_score: pores_final_score,
      };

      const rawValues = {
        pores_final_raw: pores_final_raw,
      };

      let frontArg = this.fileUpload.getMaskArgs('pores', '/images/mask/');
      await this.fileUpload.uploadImage(
        files.masks[0].buffer,
        frontArg.sys_url,
      );

      const images = {
        front: {
          url: frontArg.url,
          sys_url: frontArg.sys_url,
          hash: frontArg.hash,
        },
      };

      const args = { images: images, score: score, rawValues: rawValues };
      const measureId = await this.dataSaving.getMeasurmant(type.toLowerCase());

      this.dataSaving.insertInMesurement(
        batch_id,
        JSON.stringify(args),
        measureId,
      );
    } else if (type.toLowerCase() === 'impurities') {
      let impurities_final_score = scores[0];
      let impurities_final_raw = raws[0];
      const score = {
        impurities_final_score: impurities_final_score,
      };
      const rawValues = {
        impurities_final_raw: impurities_final_raw,
      };

      let frontArg = this.fileUpload.getMaskArgs('impurities', '/images/mask/');

      await this.fileUpload.uploadImage(
        files.masks[0]?.buffer,
        frontArg.sys_url,
      );

      if (files.uvl_impurities) {
        if (files.uvl_impurities[0]) {
          typeOfImage = 'uvl_impurities';
          const imageArg = this.fileUpload.getImageArgs(
            typeOfImage,
            '/images/original/',
          );
          let imageType = await this.dataSaving.getImage(typeOfImage);
          let args = typeOfImage;
          await this.fileUpload.uploadImage(
            files.uvl_impurities[0].buffer,
            imageType.sys_url,
          );

          this.dataSaving.insertImage(
            batch_id,
            imageArg.url,
            imageArg.sys_url,
            imageArg.hash,
            imageType,
            JSON.stringify({ args }),
          );
        }
        const images = {
          front: {
            url: frontArg.url,
            sys_url: frontArg.sys_url,
          },
        };
        const args = { images: images, score: score, rawValues: rawValues };
        const measureId = await this.dataSaving.getMeasurmant(
          type.toLowerCase(),
        );

        this.dataSaving.insertInMesurement(
          batch_id,
          JSON.stringify(args),
          measureId,
        );
      }
      const images = {
        front: {
          url: frontArg.url,
          sys_url: frontArg.sys_url,
          hash: frontArg.hash,
        },
      };
      const args = { images: images, score: score, rawValues: rawValues };
      const measureId = await this.dataSaving.getMeasurmant(type.toLowerCase());
      this.dataSaving.insertInMesurement(
        batch_id,
        JSON.stringify(args),
        measureId,
      );
    } else if (type.toLowerCase() === 'wrinkles') {
      let wrinkles_final_score = scores[0];
      let wrinkles_front_score = scores[1];
      let wrinkles_front_eye_score = scores[2];
      let wrinkles_front_forehead_score = scores[3];
      let wrinkles_front_sline_score = scores[4];
      let wrinkles_front_lion_score = scores[5];
      let wrinkles_left_score = scores[6];
      let wrinkles_left_eye_score = scores[7];
      let wrinkles_left_forehead_score = scores[8];
      let wrinkles_left_sline_score = scores[9];
      let wrinkles_left_lion_score = scores[10];
      let wrinkles_right_score = scores[11];
      let wrinkles_right_eye_score = scores[12];
      let wrinkles_right_forehead_score = scores[13];
      let wrinkles_right_sline_score = scores[14];
      let wrinkles_right_lion_score = scores[16];
      let wrinkles_front_raw = raws[0];
      let wrinkles_front_eye_raw = raws[1];
      let wrinkles_front_forehead_raw = raws[2];
      let wrinkles_front_sline_raw = raws[3];
      let wrinkles_front_ion_raw = raws[4];
      let wrinkles_left_raw = raws[5];
      let wrinkles_left_eye_raw = raws[6];
      let wrinkles_left_forehead_raw = raws[7];
      let wrinkles_left_sline_raw = raws[8];
      let wrinkles_left_lion_raw = raws[9];
      let winkles_right_raw = raws[10];
      let wrinkles_right_eye_raw = raws[11];
      let wrinkles_right_forehead_raw = raws[12];
      let wrinkles_right_sline_raw = raws[13];
      let wrinkles_right_lion_raw = raws[14];

      const score = {
        wrinkles_final_score: wrinkles_final_score,
        wrinkles_front_score: wrinkles_front_score,
        wrinkles_front_eye_score: wrinkles_front_eye_score,
        wrinkles_front_forehead_score: wrinkles_front_forehead_score,
        wrinkles_front_sline_score: wrinkles_front_sline_score,
        wrinkles_front_lion_score: wrinkles_front_lion_score,
        wrinkles_left_score: wrinkles_left_score,
        wrinkles_left_eye_score: wrinkles_left_eye_score,
        wrinkles_left_forehead_score: wrinkles_left_forehead_score,
        wrinkles_left_sline_score: wrinkles_left_sline_score,
        wrinkles_left_lion_score: wrinkles_left_lion_score,
        wrinkles_right_score: wrinkles_right_score,
        wrinkles_right_eye_score: wrinkles_right_eye_score,
        wrinkles_right_forehead_score: wrinkles_right_forehead_score,
        wrinkles_right_sline_score: wrinkles_right_sline_score,
        wrinkles_right_lion_score: wrinkles_right_lion_score,
      };

      const rawValues = {
        wrinkles_front_raw: wrinkles_front_raw,
        wrinkles_front_eye_raw: wrinkles_front_eye_raw,
        wrinkles_front_forehead_raw: wrinkles_front_forehead_raw,
        wrinkles_front_sline_raw: wrinkles_front_sline_raw,
        wrinkles_front_ion_raw: wrinkles_front_ion_raw,
        wrinkles_left_raw: wrinkles_left_raw,
        wrinkles_left_eye_raw: wrinkles_left_eye_raw,
        wrinkles_left_forehead_raw: wrinkles_left_forehead_raw,
        wrinkles_left_sline_raw: wrinkles_left_sline_raw,
        wrinkles_left_lion_raw: wrinkles_left_lion_raw,
        winkles_right_raw: winkles_right_raw,
        wrinkles_right_eye_raw: wrinkles_right_eye_raw,
        wrinkles_right_forehead_raw: wrinkles_right_forehead_raw,
        wrinkles_right_sline_raw: wrinkles_right_sline_raw,
        wrinkles_right_lion_raw: wrinkles_right_lion_raw,
      };
      let frontfileArg = this.fileUpload.getMaskArgs(
        'wrinkle',
        '/images/mask/',
      );
      await this.fileUpload.uploadImage(
        files.masks[0].buffer,
        frontfileArg.sys_url,
      );
      let leftfileArg = this.fileUpload.getMaskArgs('wrinkle', '/images/mask/');
      await this.fileUpload.uploadImage(
        files.masks[1].buffer,
        leftfileArg.sys_url,
      );
      let rightfileArg = this.fileUpload.getMaskArgs(
        'wrinkle',
        '/images/mask/',
      );
      await this.fileUpload.uploadImage(
        files.masks[2].buffer,
        rightfileArg.sys_url,
      );

      const images = {
        front: {
          url: frontfileArg.url,
          sys_url: frontfileArg.sys_url,
          hash: frontfileArg.hash,
        },
        left: {
          url: leftfileArg.url,
          sys_url: leftfileArg.sys_url,
          hash: leftfileArg.hash,
        },
        right: {
          url: rightfileArg.url,
          sys_url: rightfileArg.sys_url,
          hash: rightfileArg.hash,
        },
      };

      const args = { images: images, score: score, rawValues: rawValues };
      const measureId = await this.dataSaving.getMeasurmant(type.toLowerCase());

      this.dataSaving.insertInMesurement(
        batch_id,
        JSON.stringify(args),
        measureId,
      );
    } else if (type.toLowerCase() === 'darkcircle') {
      let darkcircle_final_score = scores[0];
      let darkcircle_front_raw = raws[0];

      const score = {
        darkcircle_final_score: darkcircle_final_score,
      };

      const rawValues = {
        darkcircle_front_raw: darkcircle_front_raw,
      };

      let frontArg = this.fileUpload.getMaskArgs('darkcircle', '/images/mask/');
      await this.fileUpload.uploadImage(
        files.masks[0].buffer,
        frontArg.sys_url,
      );

      const images = {
        front: {
          url: frontArg.url,
          sys_url: frontArg.sys_url,
          hash: frontArg.hash,
        },
      };
      const args = { images: images, score: score, rawValues: rawValues };
      const measureId = await this.dataSaving.getMeasurmant(type.toLowerCase());

      this.dataSaving.insertInMesurement(
        batch_id,
        JSON.stringify(args),
        measureId,
      );
    } else if (type.toLowerCase() === 'hyperpigmentation') {
      let hp_final_score = scores[0];
      let hp_front_score = scores[1];
      let hp_front_cheek_score = scores[2];
      let hp_front_forehead_score = scores[3];
      let hp_front_nose_score = scores[4];
      let hp_left_score = scores[5];
      let hp_left_cheek_score = scores[6];
      let hp_left_forehead_score = scores[7];
      let hp_left_nose_score = scores[8];
      let hp_right_score = scores[9];
      let hp_right_cheek_score = scores[10];
      let hp_right_forehead_score = scores[11];
      let hp_right_nose_score = scores[12];
      let hp_front_raw = raws[0];
      let hp_front_cheek_raw = raws[1];
      let hp_front_forehead_raw = raws[2];
      let hp_front_nose_raw = raws[3];
      let hp_left_raw = raws[4];
      let hp_left_cheek_raw = raws[5];
      let hp_left_forehead_raw = raws[6];
      let hp_left_nose_raw = raws[7];
      let hp_right_raw = raws[8];
      let hp_right_cheek_raw = raws[9];
      let hp_right_forehead_raw = raws[10];
      let hp_right_nose_raw = raws[11];

      let score = {
        hp_final_score: hp_final_score,
        hp_front_score: hp_front_score,
        hp_front_cheek_score: hp_front_cheek_score,
        hp_front_forehead_score: hp_front_forehead_score,
        hp_front_nose_score: hp_front_nose_score,
        hp_left_score: hp_left_score,
        hp_left_cheek_score: hp_left_cheek_score,
        hp_left_forehead_score: hp_left_forehead_score,
        hp_left_nose_score: hp_left_nose_score,
        hp_right_score: hp_right_score,
        hp_right_cheek_score: hp_right_cheek_score,
        hp_right_forehead_score: hp_right_forehead_score,
        hp_right_nose_score: hp_right_nose_score,
      };

      let rawValues = {
        hp_front_raw: hp_front_raw,
        hp_front_cheek_raw: hp_front_cheek_raw,
        hp_front_forehead_raw: hp_front_forehead_raw,
        hp_front_nose_raw: hp_front_nose_raw,
        hp_left_raw: hp_left_raw,
        hp_left_cheek_raw: hp_left_cheek_raw,
        hp_left_forehead_raw: hp_left_forehead_raw,
        hp_left_nose_raw: hp_left_nose_raw,
        hp_right_raw: hp_right_raw,
        hp_right_cheek_raw: hp_right_cheek_raw,
        hp_right_forehead_raw: hp_right_forehead_raw,
        hp_right_nose_raw: hp_right_nose_raw,
      };

      if (files.uvl) {
        if (files.uvl[0]) {
          typeOfImage = 'front_uvl';
          let imageType = await this.dataSaving.getImage(typeOfImage);
          let args = typeOfImage;
          const imageArg = this.fileUpload.getImageArgs(
            typeOfImage,
            '/images/original/',
          );

          await this.fileUpload.uploadImage(
            files.uvl[0].buffer,
            imageArg.sys_url,
          );
          this.dataSaving.insertImage(
            batch_id,
            imageArg.url,
            imageArg.sys_url,
            imageArg.hash,
            imageType,
            JSON.stringify({ args }),
          );
        }

        if (files.uvl[1]) {
          typeOfImage = 'left_uvl';
          let imageType = await this.dataSaving.getImage(typeOfImage);
          let args = typeOfImage;
          const imageArg = this.fileUpload.getImageArgs(
            typeOfImage,
            '/images/original/',
          );
          await this.fileUpload.uploadImage(
            files.uvl[1].buffer,
            imageArg.sys_url,
          );

          this.dataSaving.insertImage(
            batch_id,
            imageArg.url,
            imageArg.sys_url,
            imageArg.hash,
            imageType,
            JSON.stringify({ args }),
          );
        }

        if (files.uvl[2]) {
          typeOfImage = 'right_uvl';
          let imageType = await this.dataSaving.getImage(typeOfImage);
          let args = typeOfImage;
          const imageArg = this.fileUpload.getImageArgs(
            typeOfImage,
            '/images/original/',
          );
          await this.fileUpload.uploadImage(
            files.uvl[0].buffer,
            imageArg.sys_url,
          );
          this.dataSaving.insertImage(
            batch_id,
            imageArg.url,
            imageArg.sys_url,
            imageArg.hash,
            imageType,
            JSON.stringify({ args }),
          );
        }
      }

      let frontfileArg = this.fileUpload.getMaskArgs(
        'hyperpigmentation',
        '/images/mask/',
      );
      await this.fileUpload.uploadImage(
        files.masks[0].buffer,
        frontfileArg.sys_url,
      );
      let leftfileArg = this.fileUpload.getMaskArgs(
        'hyperpigmentation',
        '/images/mask/',
      );
      await this.fileUpload.uploadImage(
        files.masks[1].buffer,
        leftfileArg.sys_url,
      );
      let rightfileArg = this.fileUpload.getMaskArgs(
        'hyperpigmentation',
        '/images/mask/',
      );
      await this.fileUpload.uploadImage(
        files.masks[2].buffer,
        rightfileArg.sys_url,
      );

      const images = {
        front: {
          url: frontfileArg.url,
          sys_url: frontfileArg.sys_url,
          hash: frontfileArg.hash,
        },
        left: {
          url: leftfileArg.url,
          sys_url: leftfileArg.sys_url,
          hash: leftfileArg.hash,
        },
        right: {
          url: rightfileArg.url,
          sys_url: rightfileArg.sys_url,
          hash: rightfileArg.hash,
        },
      };

      const args = { images: images, score: score, rawValues: rawValues };
      const measureId = await this.dataSaving.getMeasurmant(type.toLowerCase());

      this.dataSaving.insertInMesurement(
        batch_id,
        JSON.stringify(args),
        measureId,
      );
    } else if (type.toLowerCase() === 'pigmentation') {
      let pig_final_score = scores[0];
      let pig_front_score = scores[1];
      let pig_front_cheek_score = scores[2];
      let pig_front_forehead_score = scores[3];
      let pig_front_nose_score = scores[4];
      let pig_front_chin_score = scores[5];
      let pig_left_score = scores[6];
      let pig_left_cheek_score = scores[7];
      let pig_left_forehead_score = scores[8];
      let pig_left_nose_score = scores[9];
      let pig_left_chin_score = scores[10];
      let pig_right_score = scores[11];
      let pig_right_cheek_score = scores[12];
      let pig_right_forehead_score = scores[13];
      let pig_right_nose_score = scores[14];
      let pig_right_chin_score = scores[15];
      let pig_front_raw = raws[0];
      let pig_front_cheek_raw = raws[1];
      let pig_front_forehead_raw = raws[2];
      let pig_front_nose_raw = raws[3];
      let pig_front_chin_raw = raws[4];
      let pig_left_raw = raws[5];
      let pig_left_cheek_raw = raws[6];
      let pig_left_forehead_raw = raws[7];
      let pig_left_nose_raw = raws[8];
      let pig_left_chin_raw = raws[9];
      let pig_right_raw = raws[10];
      let pig_right_cheek_raw = raws[11];
      let pig_right_forehead_raw = raws[12];
      let pig_right_nose_raw = raws[13];
      let pig_right_chin_raw = raws[14];

      let frontfileArg = this.fileUpload.getMaskArgs(
        'pigmentation',
        '/images/mask/',
      );
      await this.fileUpload.uploadImage(
        files.masks[0].buffer,
        frontfileArg.sys_url,
      );
      let leftfileArg = this.fileUpload.getMaskArgs(
        'pigmentation',
        '/images/mask/',
      );
      await this.fileUpload.uploadImage(
        files.masks[1].buffer,
        leftfileArg.sys_url,
      );
      let rightfileArg = this.fileUpload.getMaskArgs(
        'pigmentation',
        '/images/mask/',
      );
      await this.fileUpload.uploadImage(
        files.masks[2].buffer,
        rightfileArg.sys_url,
      );

      let score = {
        pig_final_score: pig_final_score,
        pig_front_score: pig_front_score,
        pig_front_cheek_score: pig_front_cheek_score,
        pig_front_forehead_score: pig_front_forehead_score,
        pig_front_nose_score: pig_front_nose_score,
        pig_front_chin_score: pig_front_chin_score,
        pig_left_score: pig_left_score,
        pig_left_cheek_score: pig_left_cheek_score,
        pig_left_forehead_score: pig_left_forehead_score,
        pig_left_nose_score: pig_left_nose_score,
        pig_left_chin_score: pig_left_chin_score,
        pig_right_score: pig_right_score,
        pig_right_cheek_score: pig_right_cheek_score,
        pig_right_forehead_score: pig_right_forehead_score,
        pig_right_nose_score: pig_right_nose_score,
        pig_right_chin_score: pig_right_chin_score,
      };
      let rawValues = {
        pig_front_raw: pig_front_raw,
        pig_front_cheek_raw: pig_front_cheek_raw,
        pig_front_forehead_raw: pig_front_forehead_raw,
        pig_front_nose_raw: pig_front_nose_raw,
        pig_front_chin_raw: pig_front_chin_raw,
        pig_left_raw: pig_left_raw,
        pig_left_cheek_raw: pig_left_cheek_raw,
        pig_left_forehead_raw: pig_left_forehead_raw,
        pig_left_nose_raw: pig_left_nose_raw,
        pig_left_chin_raw: pig_left_chin_raw,
        pig_right_raw: pig_right_raw,
        pig_right_cheek_raw: pig_right_cheek_raw,
        pig_right_forehead_raw: pig_right_forehead_raw,
        pig_right_nose_raw: pig_right_nose_raw,
        pig_right_chin_raw: pig_right_chin_raw,
      };
      const images = {
        front: {
          url: frontfileArg.url,
          sys_url: frontfileArg.sys_url,
          hash: frontfileArg.hash,
        },
        left: {
          url: leftfileArg.url,
          sys_url: leftfileArg.sys_url,
          hash: leftfileArg.hash,
        },
        right: {
          url: rightfileArg.url,
          sys_url: rightfileArg.sys_url,
          hash: rightfileArg.hash,
        },
      };

      const args = { images: images, score: score, rawValues: rawValues };
      const measureId = await this.dataSaving.getMeasurmant(type.toLowerCase());

      this.dataSaving.insertInMesurement(
        batch_id,
        JSON.stringify(args),
        measureId,
      );
    }

    return res.status(201).send({
      status: 200,
      service: 'CFA Offline Analysis Data saving',
      message: 'Data saved to the cloud',
    });
  }

  @Post('/additonalResult')
  async saveMetaResult(@Body() body: any, @Res() res: Response) {
    let { batch_id, elesticity_score, skin_age, skin_condition } = body;

    const args = {
      elesticity_score: elesticity_score,
      skin_age: skin_age,
      skin_condition: skin_condition,
    };

    const getMeasurmant = await this.dataSaving.getMeasurmant('elasticity');
    const response = await this.dataSaving.insertInMesurement(
      batch_id,
      JSON.stringify({ args }),
      getMeasurmant,
    );

    return res.status(201).send({
      status: 200,
      service: 'CFA Offline Analysis Data saving',
      message: 'Data saved to the cloud',
    });
  }

  @Post('/computationSave')
  async computationSave(@Body() body: any, @Res() res: Response) {
    let {
      batch_id,
      sensitivityQ,
      sensititivityA,
      wrinkleQ,
      wrinkleA,
      spotsQ,
      spotsA,
      oilinessQ,
      oilinessA,
      wrinkles_score,
      pig_score,
      redness_score,
      oiliness_score,
    } = body;

    const args = {
      sensitivityQ: sensitivityQ,
      sensititivityA: sensititivityA,
      wrinkleQ: wrinkleQ,
      wrinkleA: wrinkleA,
      spotsQ: spotsQ,
      spotsA: spotsA,
      oilinessQ: oilinessQ,
      oilinessA: oilinessA,
      wrinkles_score: wrinkles_score,
      pig_score: pig_score,
      redness_score: redness_score,
      oiliness_score: oiliness_score,
    };

    const getMeasurmant = await this.dataSaving.getMeasurmant('computation');
    await this.dataSaving.insertInMesurement(
      batch_id,
      JSON.stringify({ args }),
      getMeasurmant,
    );
    return res.status(201).send({
      status: 200,
      service: 'CFA Offline Analysis Data saving',
      message: 'Data saved to the cloud',
    });
  }
}
