import { Module } from '@nestjs/common';
import { ImagesController } from './images.controller';
import { ImagesService } from './images.service';
import { DatabaseService } from 'src/database/database.service';
import { DatabaseModule } from 'src/database/database.module';
import { FileUploadService } from 'src/common/FileUpload/fileUpload.service';
import { ConfigService } from 'aws-sdk';
import { BullModule } from '@nestjs/bull';

@Module({
    imports: [DatabaseModule],
    controllers: [ImagesController],
    providers: [ImagesService, FileUploadService, ConfigService],
})
export class ImagesModule {}

