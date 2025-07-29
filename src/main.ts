import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import * as fs from 'fs';
import { HttpException, UnauthorizedException } from '@nestjs/common/exceptions';
import { HttpStatus } from '@nestjs/common/enums';
import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
import * as tls from 'tls';
import { setupSwagger } from './config/swagger/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
    const enableSwagger = process.env.OPEN_SWAGGER === 'true';
    const httpApp = await NestFactory.create(AppModule);
    await httpApp.listen(process.env.HTTP);

    const ssl = process.env.SSL === 'true' ? true : false;
    let httpsOptions = null;
    if (ssl) {
        const defaultKeyPath = process.env.SSL_KEY_PATH || '';
        const defaultCertPath = process.env.SSL_CERT_PATH || '';

        const cnKeyPath = process.env.REGION === 'CHINA' ? process.env.SSL_KEY_PATH_CN : '';

        const cnCertPath = process.env.REGION === 'CHINA' ? process.env.SSL_CERT_PATH_CN : '';

        // Load default SSL certificate (1.116.243.170)
        const defaultCert = {
            key: fs.readFileSync(defaultKeyPath),
            cert: fs.readFileSync(defaultCertPath),
        };

        // Load China-specific SSL certificate (v2-api.chowis.cn)
        const cnCert =
            process.env.REGION === 'CHINA'
                ? {
                      key: fs.readFileSync(cnKeyPath),
                      cert: fs.readFileSync(cnCertPath),
                  }
                : {};

        // let cnCert = process.env.REGION === 'CHINA' ? cnCert_ : {};

        httpsOptions = {
            key: defaultCert.key,
            cert: defaultCert.cert,
            SNICallback: (servername: string, cb: Function) => {
                console.log(`SNICallback invoked for servername: ${servername}`);
                try {
                    if (servername === 'v2-api.chowis.cn') {
                        console.log('Serving SSL for v2-api.chowis.cn', cnCert);
                        return cb(null, tls.createSecureContext(cnCert));
                    }

                    // Default SSL certificate for 1.116.243.170 and any other domains
                    console.log('Serving SSL for 1.116.243.170 or default');
                    return cb(null, tls.createSecureContext(defaultCert));
                } catch (error) {
                    console.error(`Error in SNICallback for ${servername}:`, error.message);
                    return cb(error);
                }
            },
        };
    }
    const app = await NestFactory.create<NestExpressApplication>(AppModule, {
        httpsOptions,
        rawBody: true,
        logger: ['log', 'error', 'warn', 'debug', 'verbose'],
    });

    const port = Number(process.env.PORT) || 3000;
    const hostname = process.env.HOSTNAME || 'localhost';

    if (enableSwagger) {
        app.useStaticAssets(join(__dirname, '..', 'public'));
        setupSwagger(app);
    }

    app.use(cookieParser());

    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            exceptionFactory: (e) => {
                // console.log('error', e);
                throw new HttpException(e[0].constraints, HttpStatus.BAD_REQUEST);
            },
        }),
    );

    const allowedOrigins = [
        'https://staging.chowis.cloud:3444',
        'http://localhost:3100',
        'https://v2-api.chowis.cloud:3441',
        'https://v2-api.chowis.cn:3441',
        'https://1.116.243.170:3441',
    ];

    const corsOptions: CorsOptions = {
        origin: (origin, callback) => {
            // Allow requests with no origin (like mobile apps or curl requests)
            if (!origin) {
                return callback(null, true);
            }
            if (allowedOrigins.indexOf(origin) !== -1) {
                callback(null, true);
            } else {
                callback(new Error('Not allowed by CORS'));
            }
        },
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
        preflightContinue: false,
        optionsSuccessStatus: 204,
        credentials: true,
    };
    //
    app.enableCors(corsOptions);
    app.enableShutdownHooks();
    await app.listen(port, hostname, () => {
        const address = 'http' + (ssl ? 's' : '') + '://' + hostname + ':' + port + '/';
        Logger.log('Listening at ' + address);
    });
}
bootstrap();

// Add this lignes as well as Notice and explanation. If possible make a table to have them:

// - GET /analysis/requestBatchId: The is the primary API to request a batch_id that will be used to do and save the analysis results.

// Analysis Operation API:
// - POST /analysis/offlineCBB: Is the main API endpoint for the CBB analysis that includes images. The type parameter should be an ID matching the number related to each analysis type. For example, type=1 for keratin, type=2 for pores, and so on. The response will be a JSON object containing the analysis results.
// - POST /analysis: is the online cloud analysis API - It is no more used.
// - POST /analysis/offline: Is the main API endpoint for saving analysis offline analysis result to Database
// - POST /analysis/analysisCBB: Is the main API endpoint for the CBB analysis that without images. This is also used to save the offline analysis without images.
// - POST /analysis/kheadspa-cbb: CBB offline analysis made for the company kheadspa, Expecting multiple originalImage and analyzedImage. The response will include score average, computation and questionnaire
// - POST /analysis/encryptedCBB: encryptedCBB, is the version of the CBB accepting encrypted score and decripts them
// - POST /analysis/moistureU: Moisture U analysis API and data saving
// - POST /analysis/moistureT: Moisture T analysis API and data saving
// - POST /analysis/sebumU: sebum U analysis API and data saving
// - POST /analysis/sebumT: sebum T analysis API and data saving
// - POST /analyis/SkinAgeCondition: Skin Age Condition analysis API and data saving. This API should be called after all the analysis APIs because it uses the saved data from other analysis types to proceed.

// Analysis History API:
// - POST /analysis/history: Get all the analysis scores for a customer grouped by batch_id without images url.
// - POST /analysis/history/image: Get all the analysis scores for a customer grouped by batch_id with images. The analysis images and original images can be grped by hash values.
// - GET /cndpskin/:customerId/analysis-history/analysis-infor?batch_id=:batchId: Get all the detailes analysis result including image urls for a single batch_id by analysis type.
// - GET /analysis/history/result?batch_id=:batchId. Get all the analysis results for each images or score separatly  for a single batch_id grouped by analysis type.

// Other API:

// - POST /analysis/comment: Save the comment for an analysis

