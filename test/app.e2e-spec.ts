import * as request from 'supertest';
import { Test } from '@nestjs/testing';
import { AppModule } from './../src/app.module';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { HttpException } from '@nestjs/common/exceptions';
import { HttpStatus } from '@nestjs/common/enums';
import axios from 'axios';

let app: INestApplication;
let token: string;
let batchId: number;
const body = {
    email: process.env.E_MAIL,
    password: process.env.EPASSWORD,
    app_id: 44,
};

if (!body.email || !body.password) {
    throw new Error('Cannot found login information to test. Check your .env file');
}

beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
        imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            exceptionFactory: (e) => {
                console.log('error', e);
                throw new HttpException(e[0].constraints, HttpStatus.BAD_REQUEST);
            },
        }),
    );
    await app.init();

    const response = await axios.post('https://v3-staging.chowis.cloud/api/consultants/login', body);

    const resData = response.data;

    token = resData.token;
});

describe('analysis', () => {
    describe('requestBatchId', () => {
        test('success 200 status code', async () => {
            const res = await request(app.getHttpServer())
                .get('/analysis/requestBatchId?customer_id=6')
                .set('Authorization', `Bearer ${token}`)
                .set('Accept', 'application/json');

            const responseBody = res.body;
            const body = responseBody.body;
            batchId = body.batch_id;

            expect(res.status).toBe(200);
            expect(res.headers['content-type']).toMatch('/json');
            expect(body.batch_id).not.toBeNull();
            expect(typeof body?.batch_id).toBe('number');
        });
    });

    describe('offlineCBB', () => {
        test('success 200 status code', async () => {
            const res = await request(app.getHttpServer())
                .post('/analysis/offlineCBB')
                .set('Authorization', `Bearer ${token}`)
                .set('Content-Type', 'multipart/form-data')
                .attach('originalImage', `test/dummy_image/origin.png`)
                .attach('analyzedImage', `test/dummy_image/analyzed.png`)
                .field('batchId', batchId)
                .field('type', 1)
                .field('deviceModel', 'iPad')
                .field('deviceOS', 'iOS')
                .field('appVersion', '2.0.0')
                .field('lat', 48.87355649690861)
                .field('long', 2.332065444698152)
                .field('temperature', 27.47)
                .field('humidity', 92)
                .field('uv_index', 1.0)
                .field(
                    'args',
                    JSON.stringify({
                        score: [1, 23],
                        raw: [1, 23],
                    }),
                );

            const responseBody = res.body;
            const { body } = responseBody;

            expect(res.status).toBe(200);
            expect(typeof body.computation_score).toBe('string');
            expect(typeof body.questionnaire_score).toBe('string');
            expect(typeof body.score_average).toBe('string');
            expect(typeof body.keyWord).toBe('string');
            expect(Array.isArray(body.result)).toBe(true);
        });

        test('fail 500 status code diff image files amount', async () => {
            const res = await request(app.getHttpServer())
                .post('/analysis/offlineCBB')
                .set('Authorization', `Bearer ${token}`)
                .set('Content-Type', 'multipart/form-data')
                .attach('originalImage', `test/dummy_image/origin.png`)
                .attach('analyzedImage', `test/dummy_image/analyzed.png`)
                .attach('analyzedImage', `test/dummy_image/origin.png`)
                .field('batchId', batchId)
                .field('type', 1)
                .field('deviceModel', 'iPad')
                .field('deviceOS', 'iOS')
                .field('appVersion', '2.0.0')
                .field('lat', 48.87355649690861)
                .field('long', 2.332065444698152)
                .field('temperature', 27.47)
                .field('humidity', 92)
                .field('uv_index', 1.0)
                .field(
                    'args',
                    JSON.stringify({
                        score: [1, 23],
                        raw: [1, 23],
                    }),
                );

            const responseBody = res.body;
            const { body } = responseBody;

            expect(res.status).toBe(500);
        });

        test('fail 500 status code without Image File', async () => {
            const res = await request(app.getHttpServer())
                .post('/analysis/offlineCBB')
                .set('Authorization', `Bearer ${token}`)
                .set('Content-Type', 'multipart/form-data')
                .field('batchId', batchId)
                .field('type', 1)
                .field('deviceModel', 'iPad')
                .field('deviceOS', 'iOS')
                .field('appVersion', '2.0.0')
                .field('lat', 48.87355649690861)
                .field('long', 2.332065444698152)
                .field('temperature', 27.47)
                .field('humidity', 92)
                .field('uv_index', 1.0)
                .field(
                    'args',
                    JSON.stringify({
                        score: [1, 23],
                        raw: [1, 23],
                    }),
                );

            const responseBody = res.body;
            const { body } = responseBody;

            expect(res.status).toBe(500);
        });
    });

    describe('skinAgeCondition', () => {
        test('success 200 status code', async () => {
            const res = await request(app.getHttpServer())
                .post('/analysis/skinAgeCondition')
                .set('Authorization', `Bearer ${token}`)
                .set('Content-Type', 'application/json')
                .send({ batch_id: batchId, bithYear: 2000 });

            const responseBody = res.body;
            const { body } = responseBody;

            expect(res.status).toBe(200);
        });

        test('fail 400 status code without batch_id', async () => {
            const res = await request(app.getHttpServer())
                .post('/analysis/skinAgeCondition')
                .set('Authorization', `Bearer ${token}`)
                .set('Content-Type', 'application/json')
                .send({ bithYear: 2000 });

            const responseBody = res.body;
            const { body } = responseBody;

            expect(res.status).toBe(400);
        });

        test('fail 400 status code without bithYear', async () => {
            const res = await request(app.getHttpServer())
                .post('/analysis/skinAgeCondition')
                .set('Authorization', `Bearer ${token}`)
                .set('Content-Type', 'application/json')
                .send({ batch_id: batchId });

            const responseBody = res.body;
            const { body } = responseBody;

            expect(res.status).toBe(400);
        });
    });

    afterAll(async () => {
        // waiting for done all async func
        await new Promise((resolve) => setTimeout(resolve, 2000));
    });

    describe('history', () => {
        test('success 200 status code', async () => {
            const page = 1;
            const res = await request(app.getHttpServer())
                .post(`/analysis/history?per=10&page=${page}`)
                .set('Authorization', `Bearer ${token}`)
                .set('Content-Type', 'application/json')
                .send({ customer_id: 6 });

            const responseBody = res.body;
            const { body } = responseBody;

            expect(res.status).toBe(200);
            expect(typeof body.rest_items).toBe('number');
            expect(body.current_page).toBe(String(page));
        });

        test('fail 400 status code without customer_id', async () => {
            const page = 1;
            const res = await request(app.getHttpServer())
                .post(`/analysis/history`)
                .set('Authorization', `Bearer ${token}`)
                .set('Content-Type', 'application/json');

            const responseBody = res.body;
            const { body } = responseBody;

            expect(res.status).toBe(400);
        });
    });

    describe('history/image', () => {
        test('success 200 status code', async () => {
            const page = 1;
            const res = await request(app.getHttpServer())
                .post(`/analysis/history/image?per=10&page=${page}`)
                .set('Authorization', `Bearer ${token}`)
                .set('Content-Type', 'application/json')
                .send({ customer_id: 119 });

            const responseBody = res.body;
            const { body } = responseBody;

            expect(res.status).toBe(200);
            expect(responseBody.msg).toBe('Success' || 'Fail');
            expect(typeof responseBody.service).toBe('string');
            expect(Array.isArray(body)).toBe(true);
        });

        test('fail 400 status code without customer_id', async () => {
            const page = 1;
            const res = await request(app.getHttpServer())
                .post(`/analysis/history/image?per=10&page=${page}`)
                .set('Authorization', `Bearer ${token}`)
                .set('Content-Type', 'application/json');

            const responseBody = res.body;
            const { body } = responseBody;

            expect(res.status).toBe(400);
        });
    });
    describe('history/result', () => {
        test('success 200 status code', async () => {
            const res = await request(app.getHttpServer())
                .get(`/analysis/history/result?batch_id=${batchId}`)
                .set('Authorization', `Bearer ${token}`)
                .set('Content-Type', 'application/json');

            const responseBody = res.body;
            const { body } = responseBody;

            expect(res.status).toBe(200);
            expect(responseBody.msg).toBe('Success' || 'Fail');
            expect(typeof responseBody.service).toBe('string');
            expect(body).not.toBeUndefined();
        });
    });
});

describe('web-result', () => {
    test('success 200 status code', async () => {
        const res = await request(app.getHttpServer())
            .get(`/web-result/cndpskin/${batchId}`)
            .set('Authorization', `Bearer ${token}`)
            .set('Content-Type', 'application/json');

        const responseBody = res.body;
        const { body } = responseBody;

        expect(res.status).toBe(200);
        expect(typeof responseBody.service).toBe('string');
        expect(Array.isArray(body)).toBe(true);
    });
});

afterAll(async () => {
    await app.close();
});
