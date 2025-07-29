// src/swagger.ts
import { custom } from '@hapi/joi';
import { INestApplication } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

export function setupSwagger(app: INestApplication): void {
    // Define your API description with server info, algorithm list, and an API endpoints table.
    const description = `
<u><b>서버 정보</b></u><br><br>
<b>스테이징 서버</b>: <a href="https://staging.chowis.cloud:3444" target="_blank">https://staging.chowis.cloud:3444</a><br>
<b>프로덕션 서버</b>: <a href="https://v2-api.chowis.cloud:3441" target="_blank">https://v2-api.chowis.cloud:3441</a><br>
<b>중국 서버</b>: <a href="https://v2-api.chowis:3441" target="_blank">https://v2-api.chowis.cn:3441</a><br><br>
<u><b>알고리즘 목록</b></u><br><br>
<b>1.</b> 케라틴 (keratin)<br>
<b>2.</b> 모공 (pores)<br>
<b>3.</b> 포피린 (porphyrin)<br>
<b>4.</b> 피지 (sebum)<br>
<b>5.</b> 광택 (shine)<br>
<b>6.</b> 잡티 (spots)<br>
<b>7.</b> 주름 (wrinkles)<br>
<b>8.</b> 민감도 - 딱지 (sensitivity scabs)<br>
<b>9.</b> 민감도 - 각질 (sensitivity scaling)<br>
<b>10.</b> 민감도 - 홍반 (sensitivity redness)<br><br>

<h2>API Endpoints Overview</h2>
<table border="1" cellspacing="0" cellpadding="4">
  <thead>
    <tr>
      <th>API Endpoint</th>
      <th>설명</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><a href="#/Analysis/AlgoAnalysisController_getBatchId" target="_blank">GET /analysis/requestBatchId</a></td>
      <td>분석 결과를 수행 및 저장하기 위해 사용될 batch_id를 요청하는 기본 API입니다.</td>
    </tr>
    <tr>
      <td><a href="#/Analysis/AlgoAnalysisController_offlineBBC" target="_blank">POST /analysis/offlineCBB</a></td>
      <td>이미지가 포함된 CBB 분석을 위한 주요 API 엔드포인트입니다. <code>type</code> 매개변수는 각 분석 유형(예: keratin: type=1, pores: type=2 등)에 해당하는 ID를 지정하며, 응답은 분석 결과를 포함하는 JSON 객체로 반환됩니다.</td>
    </tr>
    <tr>
      <td><a href="#/Analysis/AlgoAnalysisController_kioskCbb" target="_blank">POST /analysis/kiosk-cbb</a></td>
      <td>Kiosk을 위한 분석 API입니다. (현재는 사용되지 않습니다.)</td>
    </tr>
    <tr>
      <td><a href="#/Analysis/AlgoAnalysisController_offline" target="_blank">POST /analysis/offline</a></td>
      <td>오프라인 분석 결과를 데이터베이스에 저장하기 위한 주요 API 엔드포인트입니다.</td>
    </tr>
    <tr>
      <td><a href="#/Analysis/AlgoAnalysisController_cbbWithoutImage" target="_blank">POST /analysis/analysisCBB</a></td>
      <td>이미지 없이 수행되는 CBB 분석 및 이미지 없는 오프라인 분석 결과 저장을 위한 주요 API 엔드포인트입니다.</td>
    </tr>
    <tr>
      <td><a href="#/Analysis/AlgoAnalysisController_kheadspaCBB" target="_blank">POST /analysis/kheadspa-cbb</a></td>
      <td>kheadspa 회사를 위한 CBB 오프라인 분석 API입니다. 여러 개의 원본 이미지와 분석된 이미지를 기대하며, 응답에는 점수 평균, 계산 결과 및 설문지가 포함됩니다.</td>
    </tr>
    <tr>
      <td><a href="#/Analysis/AlgoAnalysisController_encryptedCBB" target="_blank">POST /analysis/encryptedCBB</a></td>
      <td>암호화된 점수를 받아 복호화하는 CBB 분석의 암호화 버전 API입니다.</td>
    </tr>
    <tr>
      <td><a href="#/Analysis/AlgoAnalysisController_moistureU" target="_blank">POST /analysis/moistureU</a></td>
      <td>Moisture U 분석 및 데이터 저장을 위한 API입니다.</td>
    </tr>
    <tr>
      <td><a href="#/Analysis/AlgoAnalysisController_moistureT" target="_blank">POST /analysis/moistureT</a></td>
      <td>Moisture T 분석 및 데이터 저장을 위한 API입니다.</td>
    </tr>
    <tr>
      <td><a href="#/Analysis/AlgoAnalysisController_sebumU" target="_blank">POST /analysis/sebumU</a></td>
      <td>Sebum U 분석 및 데이터 저장을 위한 API입니다.</td>
    </tr>
    <tr>
      <td><a href="#/Analysis/AlgoAnalysisController_sebumT" target="_blank">POST /analysis/sebumT</a></td>
      <td>Sebum T 분석 및 데이터 저장을 위한 API입니다.</td>
    </tr>
    <tr>
      <td><a href="#/Analysis/AlgoAnalysisController_skinAgeCondition" target="_blank">POST /analysis/skinAgeCondition</a></td>
      <td>피부 나이 및 상태 분석 API입니다. 다른 분석 API 호출 후, 저장된 데이터를 기반으로 추가 분석을 진행하기 위해 호출해야 합니다.</td>
    </tr>
    <tr>
      <td><a href="#/Analysis/AlgoAnalysisController_saveSkinTone" target="_blank">POST /analysis/skin_tone</a></td>
      <td>Skin tone 저장 API.</td>
    </tr>
    <tr>
      <td><a href="#/History/AlgoAnalysisController_userAnalysisHistory" target="_blank">POST /analysis/history</a></td>
      <td>이미지 URL 없이 고객의 분석 점수를 batch_id별로 그룹화하여 조회하는 API입니다.</td>
    </tr>
    <tr>
      <td><a href="#/History/AlgoAnalysisController_userAnalysisImageHistory" target="_blank">POST /analysis/history/image</a></td>
      <td>이미지와 함께 고객의 분석 점수를 batch_id별로 그룹화하여 조회하는 API입니다.</td>
    </tr>
    <tr>
      <td><a href="#/History/AnalysisHistoryController_getCustomerAnalysisInfo" target="_blank">GET /cndpskin/:customerId/analysis-history/analysis-info?batch_id=:batchId</a></td>
      <td>특정 batch_id에 대해, 분석 유형별로 상세 분석 결과(이미지 URL 포함)를 조회하는 API입니다.</td>
    </tr>
    <tr>
      <td><a href="#/History/AlgoAnalysisController_userAnalysisImageHistoryWithBatchId" target="_blank">GET /analysis/history/result?batch_id=:batchId</a></td>
      <td>특정 batch_id에 대해, 분석 유형별로 각 이미지 또는 점수를 개별적으로 조회하는 API입니다.</td>
    </tr>
    <tr>
      <td><a href="#/History/AnalysisHistoryController_getCustomerHistory" target="_blank">GET /cndpskin/:customerId/analysis-history</a></td>
      <td>특정 고객의 분석 히스토리를 조회하는 API입니다.</td>
    </tr>
    <tr>
      <td><a href="#/History/AnalysisHistoryController_getCustomerHistoryDetail" target="_blank">GET /cndpskin/:customerId/analysis-history/details</a></td>
      <td>특정 고객의 분석 히스토리 상세 정보를 조회하는 API입니다.</td>
    </tr>
    <tr>
      <td><a href="#/Others/AlgoAnalysisController_analysisComment" target="_blank">POST /analysis/comment</a></td>
      <td>분석에 대한 코멘트를 저장하는 API입니다.</td>
    </tr>
    <tr>
      <td><a href="#/Others/AlgoAnalysisController_deleteBatch" target="_blank">POST /analysis/deleteAnalysisData/:batch_id</a></td>
      <td>분석 데이터를 삭제하는 API입니다.</td>
    </tr>
  </tbody>
</table>
`;

    const options = new DocumentBuilder()
        .setTitle('CNDP 피부 분석 API')
        .setDescription(description)
        .setVersion('1.0.1')
        .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'Token' }, 'access-token')
        .build();

    const document = SwaggerModule.createDocument(app, options);
    SwaggerModule.setup('docs', app, document, {
        // Specify the path to the custom JavaScript file.
        customJs: '/swagger-custom.js',
        customCss: '.swagger-ui .models { display: none !important; }',
    });
}

