import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
// import { nestCsrf } from 'ncsrf';
import * as cookieParser from 'cookie-parser';
import * as fs from 'fs';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { HttpException, UnauthorizedException } from '@nestjs/common/exceptions';
import { HttpStatus } from '@nestjs/common/enums';
import * as morgan from 'morgan';

// const logStream = fs.createWriteStream('api.log', {
//   flags: 'a',
// });

async function bootstrap() {
    const enableSwagger = process.env.OPEN_SWAGGER === 'true';
    const httpApp = await NestFactory.create(AppModule);
    await httpApp.listen(process.env.HTTP);

    const ssl = process.env.SSL === 'true' ? true : false;
    let httpsOptions = null;
    if (ssl) {
        const keyPath = process.env.SSL_KEY_PATH || '';
        const certPath = process.env.SSL_CERT_PATH || '';
        httpsOptions = {
            key: fs.readFileSync(keyPath),
            cert: fs.readFileSync(certPath),
        };
    }
    const app = await NestFactory.create(AppModule, {
        httpsOptions,
        rawBody: true,
        logger: ['log', 'error', 'warn', 'debug', 'verbose'],
    });
    const port = Number(process.env.PORT) || 3000;
    const hostname = process.env.HOSTNAME || 'localhost';

    if (enableSwagger) {
        const config = new DocumentBuilder()
            .setTitle('CNDP SKIN')
            .setDescription(
                '<b>HOST</b><br><br> <b>STAGING SERVER</b>: https://staging.chowis.cloud:3444 <b> <br><br> PRODUCTION SERVER</b>: https://v2-api.chowis.cloud:3441 ',
            )
            .setVersion('2.0.0')
            .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'Token' }, 'access-token')
            .build();
        const document = SwaggerModule.createDocument(app, config);
        SwaggerModule.setup('docs', app, document);
    }
    app.use(cookieParser());

    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            exceptionFactory: (e) => {
                console.log(e);
                throw new HttpException(e[0].constraints, HttpStatus.BAD_REQUEST);
            },
        }),
    );
    // app.use(morgan('tiny', { stream: logStream }));
    app.enableCors();
    app.enableShutdownHooks();
    await app.listen(port, hostname, () => {
        const address = 'http' + (ssl ? 's' : '') + '://' + hostname + ':' + port + '/';
        Logger.log('Listening at ' + address);
    });
}
bootstrap();

