import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { ImagesModule } from './modules/images/images.module';
import { HistoryModule } from './modules/history/history.module';
import { FileUploaddModule } from './common/FileUpload/fileUpload.module';
import { APP_FILTER } from '@nestjs/core';
import { AllExceptionsFilter } from './common/exceptions/exceptionHandling/allException.filter';
import { AnalysisModule } from './modules/analysis/analysis.module';
import { CustomerModule } from './modules/customer/customer.module';
import { AuthMiddleware } from './common/middleWare/authMiddlware/auth.middleware';
import { TimingMiddleware } from './common/middleWare/timingMiddleware/timing.middleware';
import { ErrorNotificationFilter } from './common/exceptions/errorNotification/errorNotification.filter';
import { ApiKeyModule } from './modules/apiKey-auth/apikey.module';
import { ApiKeyMiddleware } from './common/middleWare/authMiddlware/apikey.middleware';
import { BullModule } from '@nestjs/bull';
import { HttpModule } from '@nestjs/axios';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: ['env/.env'],
        }),
        BullModule.forRoot({
            redis: {
                host: 'localhost',
                port: 6379,
            },
        }),
        HttpModule,
        DatabaseModule,
        ImagesModule,
        HistoryModule,
        AnalysisModule,
        CustomerModule,
    ],
    controllers: [],
    providers: [
        {
            provide: APP_FILTER,
            useClass: AllExceptionsFilter,
        },
        {
            provide: APP_FILTER,
            useClass: ErrorNotificationFilter,
        },
        AuthMiddleware,
        FileUploaddModule,
        ApiKeyModule,
        ApiKeyMiddleware,
    ],
})
export class AppModule {
    // Timing MiddleWare
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(TimingMiddleware).forRoutes('*');
        // consumer.apply(AuthMiddleware).forRoutes('web-result/*');
    }
}
