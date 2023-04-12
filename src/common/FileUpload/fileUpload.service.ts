
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { S3 } from "aws-sdk";
import { Request } from "express";
import { v4 as uuid } from 'uuid';
import { GetObjectOutput, ManagedUpload } from "aws-sdk/clients/s3";
// import { S3Client, CopyObjectCommand, ListObjectsV2Command,  GetObjectOutput, ManagedUpload } from "@aws-sdk/client-s3";

import * as path from 'path';
import { NotFoundException } from '@nestjs/common/exceptions';

@Injectable()
export class FileUploadService {
    constructor(
        private readonly configService: ConfigService,){}
    
    async uploadImage(fileContent: Buffer, fileName: string) {
        const s3 = new S3();
        const params = {
            Bucket: this.configService.get('AWS_BUCKET_NAME'),
            Key: `${fileName}.jpg`,
            Body: fileContent,
        }

        return new Promise((resolve, reject) => {
            s3.upload(params, (err: unknown, data: ManagedUpload.SendData) => {
              if (err) {
                reject(err);
              }
              resolve(data);
            });
        });
    }

    async getImageCloudS3 (key: string): Promise<GetObjectOutput> {
        console.log(key)
        const params = { Bucket: this.configService.get('AWS_BUCKET_NAME'), Key: key };
        const s3 = new S3();
        return new Promise((resolve, reject) => {
            s3.getObject(params, function (err, data) {
            if (err) {
                reject(err);
            }
            resolve(data);
            });
        });
    };

    getImageArgs(fileUsage: string | null = null, route: string){
        const hash = uuid();
        let host: any = ''
        if(this.configService.get('SSL') === true){
            host = "https://"+this.configService.get('HOSTNAME')+":"+this.configService.get('PORT')
        }else{
            host = this.configService.get('HOSTNAME')+":"+this.configService.get('PORT')
        }
        const url = host + route + hash;
        const filename = `${hash}_${fileUsage}.jpg`;
        const sys_url = `${fileUsage}_${hash}`;
        
        return { hash, url, filename, sys_url, };
    }

    getMaskArgs(fileUsage: string | null = null, route: string){
        const hash = uuid();
        let host: any = ''
        if(this.configService.get('SSL') === true){
            host = this.configService.get('HOSTNAME')+":"+this.configService.get('PORT')
        }else{
            host = this.configService.get('HOSTNAME')+":"+this.configService.get('PORT')
        }
        const url = "https://"+host + route + hash;
        const filename = `${hash}_${fileUsage}.jpg`;
        const sys_url = `${fileUsage}_${hash}`;
        
        return { hash, url, filename, sys_url, };
    }


    async  getImagesFromCloud(sysUrl: string){
        // const sysUrl = await this.getImage(hash);
        if (!sysUrl) throw new NotFoundException("product image was not found");
        const image = await this.getImageCloudS3(`${sysUrl}.jpg`);
        return image
    };

    // brochure


    async uploadOriginalImage(fileContent: Buffer, fileName: string) {
        const s3 = new S3();
        const params = {
            Bucket: this.configService.get('AWS_BUCKET_NAME'),
            Key: `${fileName}.pdf`,
            Body: fileContent,
        }

        return new Promise((resolve, reject) => {
            s3.upload(params, (err: unknown, data: ManagedUpload.SendData) => {
              if (err) {
                reject(err);
              }
              resolve(data);
            });
        });
    }

}      