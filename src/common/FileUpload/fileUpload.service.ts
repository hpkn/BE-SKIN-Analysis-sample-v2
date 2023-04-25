import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
// import { S3 } from "@aws-sdk/client-s3";
import { v4 as uuid } from 'uuid';
import { GetObjectOutput, ManagedUpload } from 'aws-sdk/clients/s3';
import { S3Client, GetObjectCommand, CopyObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { S3 } from 'aws-sdk';

import { Upload } from '@aws-sdk/lib-storage';
import * as path from 'path';
import { NotFoundException } from '@nestjs/common/exceptions';

@Injectable()
export class FileUploadService {
    constructor(
        private readonly configService: ConfigService, // private readonly logger = new Logger(FileUploadService.name),
    ) {}

    async uploadImage(fileContent: Buffer, fileName: string) {
        const params = {
            Bucket: this.configService.get('AWS_BUCKET_NAME'),
            Key: this.configService.get('AWS_PATH') + `${fileName}.jpg`,
            Body: fileContent,
        };

        try {
            const parallelUploads3 = new Upload({
                client: new S3Client({ region: this.configService.get('AWS_REGION') }),
                //   tags: [...], // optional tags
                queueSize: 4, // optional concurrency configuration
                leavePartsOnError: false, // optional manually handle dropped parts
                params: params,
            });

            parallelUploads3.on('httpUploadProgress', (progress) => {
                console.log(progress);
            });
            await parallelUploads3.done();
            return true;
        } catch (e) {
            console.log(e);
        }
    }

    // async getImageCloudS3(key: any): Promise<GetObjectOutput> {
    //     // this.logger.log(`retrieving: ${key} object`);
    //     const params = {
    //         Bucket: this.configService.get('AWS_BUCKET_NAME'),
    //         Key: this.configService.get('AWS_PATH') + key,
    //     };

    //     const s3Client = new S3({ region: this.configService.get('AWS_REGION') });
    //     const command = new GetObjectCommand(params);

    //     // try {
    //     let response: any = await s3Client.send(command);
    //     // console.log(response);
    //     const { Body } = response;
    //     // console.log('bosydydydy', Body);
    //     return Body;
    //     // } catch (error) {
    //     //     // console.log(error);
    //     //     throw error;
    //     // }

    //     // const params = { Bucket: this.configService.get('AWS_BUCKET_NAME'), Key: key };
    //     // const s3 = new S3();
    //     // return new Promise((resolve, reject) => {
    //     //     s3.getObject(params, function (err, data) {
    //     //     if (err) {
    //     //         reject(err);
    //     //     }
    //     //     resolve(data);
    //     //     });
    //     // });
    // }

    async getImageCloudS3(key: string): Promise<GetObjectOutput> {
        const params = {
            Bucket: this.configService.get('AWS_BUCKET_NAME'),
            Key: this.configService.get('AWS_PATH') + key,
        };
        const s3 = new S3();
        return new Promise((resolve, reject) => {
            s3.getObject(params, function (err, data) {
                if (err) {
                    reject(err);
                }
                resolve(data);
            });
        });
    }

    getImageArgs(fileUsage: string | null = null, route: string, analysisType: string | null = null) {
        const hash = uuid();
        route = 'image' + '/';
        let host: any = '';
        if (this.configService.get('SSL') === true) {
            host = 'https://' + this.configService.get('HOSTNAME') + ':' + this.configService.get('PORT') + '/';
        } else {
            host = this.configService.get('HOSTNAME') + ':' + this.configService.get('PORT') + '/';
        }
        const url = host + route + hash;
        const filename = `${hash}_${fileUsage}.jpg`;
        const sys_url = `${analysisType}_${fileUsage}_${hash}`;

        return { hash, url, filename, sys_url };
    }

    getMaskArgs(fileUsage: string | null = null, route: string) {
        const hash = uuid();
        let host: any = '';
        if (this.configService.get('SSL') === true) {
            host = this.configService.get('HOSTNAME') + ':' + this.configService.get('PORT');
        } else {
            host = this.configService.get('HOSTNAME') + ':' + this.configService.get('PORT');
        }
        const url = 'https://' + host + route + hash;
        const filename = `${hash}_${fileUsage}.jpg`;
        const sys_url = `${fileUsage}_${hash}`;

        return { hash, url, filename, sys_url };
    }

    async getImagesFromCloud(sysUrl: string) {
        try {
            // const sysUrl = await this.getImage(hash);
            if (!sysUrl) throw new NotFoundException('product image was not found');
            const image = await this.getImageCloudS3(`${sysUrl}.jpg`);

            return image.Body;
        } catch (e) {
            console.log(e);
        }
    }
}

