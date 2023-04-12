import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { FileUploadService } from "./fileUpload.service";

@Module({
//   imports: [ConfigService],
  providers: [FileUploadService, ConfigService],
})
export class FileUploaddModule {}