import {
  Controller,
  Body,
  Get,
  Post,
  UseInterceptors,
  UploadedFiles,
  Res,
  Param,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ImagesService } from './images.service';
import { ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request, response, Response } from 'express';
import { FileUploadService } from 'src/common/FileUpload/fileUpload.service';

@Controller('images')
export class ImagesController {
  constructor(
    private readonly ImagesService: ImagesService,
    private readonly fileUpload: FileUploadService,
  ) {}

  @Get('original/:hash')
  async getOriginalImage(@Param('hash') hash: string, @Res() res: Response) {
    try {
      const sys_url = await this.ImagesService.getOriginalImage(hash);
      const image = await this.fileUpload.getImagesFromCloud(
        sys_url[0]['sys_url'],
      );
      res.writeHead(200, { 'Content-Type': 'image/jpeg' });
      res.write(image.Body, 'binary');
      res.end(null, 'binary');
    } catch (e) {
      console.log(e);
    }
  }

  @Get('mask/:hash')
  async getMaskImage(@Param('hash') hash: string, @Res() res: Response) {
    try {
      const sys_url = await this.ImagesService.getMaskImage(hash);
      const image = await this.fileUpload.getImagesFromCloud(sys_url);
      res.writeHead(200, { 'Content-Type': 'image/jpeg' });
      res.write(image.Body, 'binary');
      res.end(null, 'binary');
    } catch (e) {
      console.log(e);
    }
  }
}
