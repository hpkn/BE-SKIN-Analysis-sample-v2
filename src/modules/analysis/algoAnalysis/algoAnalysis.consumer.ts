import { OnQueueCompleted, OnQueueFailed, Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { AlgoAnalysisService } from './algoAnalysis.service';
import { v4 as uuidv4 } from 'uuid';
import { Logger } from '@nestjs/common';

@Processor('data-queue')
export class OfflineAnalysisProcessor {
    constructor(private readonly AlgoAnalysis: AlgoAnalysisService) {}

    private readonly logger = new Logger(OfflineAnalysisProcessor.name);
    @Process('save-data')
    async handleOfflineAnalysis(job: Job) {
        try {
            this.logger.log(`Job ID ${job.id} processed successfully.`);

            const { data, files, token } = job.data;
            const license = data?.licenseId ? Number(data.licenseId) : data.licenseId;
            data.showing_image_flag = license === 5 ? 'true' : false;

            this.logger.log(`Analysis Type: ${data.type}, License ID: ${data.licenseId}`);

            // Other logic
            data.kiosk = this.AlgoAnalysis.checkIfKiosk(token, data);
            data.batchId = Number(data.batchId);
            const imageRecords = uuidv4();

            // Process images and save data
            let imageArg;
            if (/[0-9]/.test(data.type)) {
                imageArg = this.AlgoAnalysis.handleCBBImageArg(data);
            } else {
                imageArg = this.AlgoAnalysis.handleofflineImageArg(data);
            }

            await this.AlgoAnalysis.saveDataFinal(data, imageRecords, imageArg);
            await this.AlgoAnalysis.saveOfflineImage(
                data,
                files.originalImage,
                files.analyzedImage,
                imageArg,
                files.fineImage,
                files.ultraFineImage,
                files.deepImage,
                files.ultraDeepImage,
            );

            data.batch_id = data.batchId;
            await this.AlgoAnalysis.updateData(data, '');
            this.logger.log(`Job ID ${job.id} processed successfully.`);
            // this.logger.log(`Images processed and saved for batch ${data.batchId}`);
        } catch (error) {
            this.logger.error(`Job ${job.id} failed with error: ${error.message}`, error.stack);
            throw error;
        }
    }

    @OnQueueFailed()
    onFailed(job: Job, error: Error) {
        this.logger.error(`Job ${job.id} failed with error: ${error.message}`);
    }

    @OnQueueCompleted()
    onCompleted(job: Job, result: any) {
        this.logger.log(`Job ${job.id} completed successfully.`);
    }
}
