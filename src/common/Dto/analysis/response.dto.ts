import { ApiProperty } from '@nestjs/swagger';

/* 
    START ANALAYSIS RESPONSE DTOs
*/
export class RequestBatchIdResponseBodyDto {
    @ApiProperty({ description: 'The batch ID generated for the analysis', example: 428015 })
    batch_id: number;
}

export class RequestBatchIdResponseDto {
    @ApiProperty({ description: 'HTTP status code of the response', example: 200 })
    status: number;

    @ApiProperty({ description: 'The name of the service handling the request', example: 'requestBatchId' })
    service: string;

    @ApiProperty({ description: 'The response body containing the batch id', type: RequestBatchIdResponseBodyDto })
    body: RequestBatchIdResponseBodyDto;
}

export class AnalysisMoistureUArgsDto {
    @ApiProperty({ description: 'Score for Moisture U analysis', example: 50 })
    score: number;

    @ApiProperty({ description: 'Raw value for Moisture U analysis', example: -1 })
    raw: number;
}

export class AnalysisMoistureUResponseBodyDto {
    @ApiProperty({ description: 'Batch ID used for analysis', example: 428015 })
    batch_id: number;

    @ApiProperty({ description: 'Additional arguments for the analysis', type: AnalysisMoistureUArgsDto })
    args: AnalysisMoistureUArgsDto;
}

export class AnalysisMoistureUResponseDto {
    @ApiProperty({ description: 'HTTP status code of the response', example: 200 })
    status: number;

    @ApiProperty({ description: 'Name of the service handling the analysis', example: 'Analysis CNDP SKIN Moisture U' })
    service: string;

    @ApiProperty({
        description: 'Response body containing the batch id and analysis arguments',
        type: AnalysisMoistureUResponseBodyDto,
    })
    body: AnalysisMoistureUResponseBodyDto;
}

export class AnalysisSebumUArgsDto {
    @ApiProperty({
        description: 'Score for Sebum U analysis',
        example: '45',
    })
    score: string;

    @ApiProperty({
        description: 'Raw value for Sebum U analysis',
        example: '4',
    })
    raw: string;
}

export class AnalysisSebumUResponseBodyDto {
    @ApiProperty({
        description: 'Batch ID used for analysis',
        example: 428015,
    })
    batch_id: number;

    @ApiProperty({
        description: 'Additional arguments for the analysis',
        type: AnalysisSebumUArgsDto,
    })
    args: AnalysisSebumUArgsDto;
}

export class ImageDto {
    @ApiProperty({
        description: 'Image ID',
        example: 'e5683e03-5a08-44f6-84a3-44a3e41ed03e',
    })
    id: string;

    @ApiProperty({
        description: 'Image URL',
        example: 'staging.chowis.cloud:3444/image/e5683e03-5a08-44f6-84a3-44a3e41ed03e',
    })
    url: string;
}

export class AnalysisSebumUResponseDto {
    @ApiProperty({
        description: 'HTTP status code of the response',
        example: 200,
    })
    status: number;

    @ApiProperty({
        description: 'Name of the service handling the analysis',
        example: 'Analysis CNDP SKIN Sebum U',
    })
    service: string;

    @ApiProperty({
        description: 'Response body containing the batch id and analysis arguments',
        type: AnalysisSebumUResponseBodyDto,
    })
    body: AnalysisSebumUResponseBodyDto;

    @ApiProperty({
        description: 'Original image details',
        type: ImageDto,
    })
    originalImage: ImageDto;

    @ApiProperty({
        description: 'Analyzed image details',
        type: ImageDto,
    })
    analyzedImage: ImageDto;
}

export class OfflineAnalysisDataSavingResponseDto {
    @ApiProperty({
        description: 'HTTP status code of the response',
        example: 200,
    })
    status: number;

    @ApiProperty({
        description: 'Name of the service handling the request',
        example: 'Offline Analysis Data saving',
    })
    service: string;

    @ApiProperty({
        description: 'A message indicating the outcome of the operation',
        example: 'Data saved to the cloud',
    })
    message: string;
}

export class AnalysisResultDto {
    @ApiProperty({
        description: 'The batch ID associated with the analysis',
        example: 428015,
    })
    batchId: number;

    @ApiProperty({
        description: 'The algorithm type used in the analysis',
        example: '6',
    })
    algorithm_type: string;

    @ApiProperty({
        description: 'Details of the original image',
        type: ImageDto,
    })
    originalImage: ImageDto;

    @ApiProperty({
        description: 'Details of the analyzed image',
        type: ImageDto,
    })
    analyzedImage: ImageDto;
}

export class OfflineAnalysisResponseBodyDto {
    @ApiProperty({
        description: 'Computation score from the analysis',
        example: '30.00',
    })
    computation_score: string;

    @ApiProperty({
        description: 'Questionnaire score from the analysis',
        example: '0.00',
    })
    questionnaire_score: string;

    @ApiProperty({
        description: 'The average score calculated for the analysis',
        example: '30.00',
    })
    score_average: string;

    @ApiProperty({
        description: 'Keyword describing the analysis result',
        example: 'Mild',
    })
    keyWord: string;

    @ApiProperty({
        description: 'The identifier for the keyword',
        example: 3,
    })
    keyword_id: number;

    @ApiProperty({
        description: 'An array of analysis results',
        type: [AnalysisResultDto],
    })
    result: AnalysisResultDto[];
}

export class OfflineAnalysisDataResponseDto {
    @ApiProperty({
        description: 'HTTP status code of the response',
        example: 200,
    })
    status: number;

    @ApiProperty({
        description: 'A message indicating the outcome of the operation',
        example: 'Success',
    })
    message: string;

    @ApiProperty({
        description: 'The response body containing analysis details',
        type: OfflineAnalysisResponseBodyDto,
    })
    body: OfflineAnalysisResponseBodyDto;
}

export class SkinAgeConditionResponseBodyDto {
    @ApiProperty({
        description: 'The calculated skin age',
        example: 22,
    })
    skinAge: number;

    @ApiProperty({
        description: 'The skin condition classification',
        example: 'oily',
    })
    skinCondition: string;

    @ApiProperty({
        description: 'The keyword identifier, typically representing the skin condition',
        example: 'oily',
    })
    keyword_id: string;
}

export class SkinAgeConditionResponseDto {
    @ApiProperty({
        description: 'HTTP status code of the response',
        example: 200,
    })
    status: number;

    @ApiProperty({
        description: 'A message indicating the outcome of the operation',
        example: 'Success',
    })
    message: string;

    @ApiProperty({
        description: 'The service name or type of operation',
        example: 'Skin Age & Condition',
    })
    service: string;

    @ApiProperty({
        description: 'Response body containing skin age, condition, and keyword information',
        type: SkinAgeConditionResponseBodyDto,
    })
    body: SkinAgeConditionResponseBodyDto;
}

// Generic DTO for each analysis score section
export class AnalysisScoreDto {
    @ApiProperty({ description: 'Computation score', example: 12 })
    computation_score: number;

    @ApiProperty({ description: 'Questionnaire score', example: 0 })
    questionnaire_score: number;

    @ApiProperty({ description: 'Keyword describing the analysis result', example: 'Almost Clear' })
    keyWord: string;

    @ApiProperty({ description: 'Keyword identifier', example: 2 })
    keyword_id: number;

    @ApiProperty({ description: 'Average score', example: 12 })
    average: number;
}

// DTO for the body of the response
export class AnalysisResponseBodyDto {
    @ApiProperty({ description: 'Keratin analysis', type: AnalysisScoreDto })
    keratin: AnalysisScoreDto;

    @ApiProperty({ description: 'Pores analysis', type: AnalysisScoreDto })
    pores: AnalysisScoreDto;

    @ApiProperty({ description: 'Impurities analysis', type: AnalysisScoreDto })
    impurities: AnalysisScoreDto;

    @ApiProperty({ description: 'Sebum T analysis', type: AnalysisScoreDto })
    sebumT: AnalysisScoreDto;

    @ApiProperty({ description: 'Sebum U analysis', type: AnalysisScoreDto })
    sebumU: AnalysisScoreDto;

    @ApiProperty({ description: 'Oiliness analysis', type: AnalysisScoreDto })
    oiliness: AnalysisScoreDto;

    @ApiProperty({ description: 'Spots analysis', type: AnalysisScoreDto })
    spots: AnalysisScoreDto;

    @ApiProperty({ description: 'Wrinkles analysis', type: AnalysisScoreDto })
    wrinkles: AnalysisScoreDto;

    @ApiProperty({ description: 'Redness analysis', type: AnalysisScoreDto })
    redness: AnalysisScoreDto;

    @ApiProperty({ description: 'Skin Age', example: 21 })
    skinAge: number;

    @ApiProperty({ description: 'Moisture T value', example: 12 })
    moistureT: number;

    @ApiProperty({ description: 'Moisture U value', example: 13 })
    moistureU: number;

    @ApiProperty({ description: 'Skin condition description', example: 'dry' })
    skinCondition: string;
}

// Top-level response DTO
export class AnalysisResponseDto {
    @ApiProperty({ description: 'HTTP status code', example: 200 })
    status: number;

    @ApiProperty({ description: 'Response message', example: 'Success' })
    message: string;

    @ApiProperty({
        description: 'Response body containing all analysis details',
        type: AnalysisResponseBodyDto,
    })
    body: AnalysisResponseBodyDto;
}

// DTO for each item in the result array
export class SkinToneResultItemDto {
    @ApiProperty({
        description: 'Algorithm type identifier',
        example: 11,
    })
    algorithm_type: number;

    @ApiProperty({
        description: 'Details of the original image',
        type: ImageDto,
    })
    originalImage: ImageDto;
}

// DTO for the nested "result" object in the response
export class SkinToneResultDto {
    @ApiProperty({
        description: 'Batch identifier',
        example: 5462,
    })
    batch_id: number;

    @ApiProperty({
        description: 'Determined skin tone',
        example: '2N1',
    })
    skinTone: string;

    @ApiProperty({
        description: 'List of analysis results',
        type: [SkinToneResultItemDto],
    })
    result: SkinToneResultItemDto[];
}

// Top-level response DTO
export class SkinToneResponseDto {
    @ApiProperty({
        description: 'HTTP status code of the response',
        example: 200,
    })
    status: number;

    @ApiProperty({
        description: 'Name of the service handling the request',
        example: 'Skin Tone',
    })
    service: string;

    @ApiProperty({
        description: 'Detailed analysis result',
        type: SkinToneResultDto,
    })
    result: SkinToneResultDto;
}

/* 
    END ANALAYSIS RESPONSE DTOs
*/

/* 
    START HISTORY RESPONSE DTOs
*/

export class AnalysisItemArgsDto {
    @ApiProperty({ description: 'Raw value', example: '12', required: false })
    raw?: string | number;

    @ApiProperty({ description: 'Label', example: false, required: false })
    label?: boolean | string;

    @ApiProperty({ description: 'Score', example: 1, required: false })
    score?: number | string;

    @ApiProperty({ description: 'Answers', example: 'ABCDCBCCBAAAAAAAAAAA', required: false })
    answers?: string;

    @ApiProperty({ description: 'Comment', example: false, required: false })
    comment?: boolean | string;

    @ApiProperty({ description: 'Keyword', example: 'Almost Clear', required: false })
    keyWord?: string;

    @ApiProperty({ description: 'Sebum Type', example: null, required: false })
    sebumType?: string | null;

    @ApiProperty({ description: 'Deep score', example: null, required: false })
    deep_score?: number | null;

    @ApiProperty({ description: 'Fine score', example: null, required: false })
    fine_score?: number | null;

    @ApiProperty({ description: 'Score average', example: '6.50', required: false })
    score_average?: string;

    @ApiProperty({ description: 'XY coordinates', example: 'coordinate1', required: false })
    xy_coordinates?: string | boolean;

    @ApiProperty({ description: 'Ultra deep score', example: null, required: false })
    ultra_deep_score?: number | null;

    @ApiProperty({ description: 'Ultra fine score', example: null, required: false })
    ultra_fine_score?: number | null;

    @ApiProperty({ description: 'Computation score', example: '7.00', required: false })
    computation_score?: string;

    @ApiProperty({ description: 'Questionnaire score', example: '0.00', required: false })
    questionnaire_score?: string;

    // Additional fields from some items:
    @ApiProperty({ description: 'Skin Age', example: 21, required: false })
    skinAge?: number;

    @ApiProperty({ description: 'Skin Condition', example: 'dry', required: false })
    skinCondition?: string;

    @ApiProperty({ description: 'Batch ID in args', example: 428015, required: false })
    batch_id?: number;

    @ApiProperty({ description: 'kHeadSpa flag', example: false, required: false })
    kHeadSpa?: boolean;
}

export class CustomerAnalysisHistoryItemDto {
    @ApiProperty({ description: 'Measurement type', example: 'porphyrin' })
    measurement: string;

    @ApiProperty({ description: 'Analysis comment', example: null, required: false })
    analysis_comment?: string | null;

    @ApiProperty({ description: 'License ID', example: '9' })
    licenseid: string;

    @ApiProperty({ description: 'No image license flag', example: 'false' })
    no_image_license: string;

    @ApiProperty({ description: 'Batch ID', example: '428015' })
    batch_id: string;

    @ApiProperty({
        description: 'Original image URL',
        example: 'staging.chowis.cloud:3444/image/ba867be6-cc60-463a-89d3-a3db2a6c1e27',
        required: false,
    })
    original_image?: string | null;

    @ApiProperty({
        description: 'Analyzed image URL',
        example: 'staging.chowis.cloud:3444/image/679bfab5-f87e-4f7e-8f1b-47d723693bd2',
        required: false,
    })
    analyzed_url?: string | null;

    @ApiProperty({ description: 'Hash value', example: 'ba867be6-cc60-463a-89d3-a3db2a6c1e27', required: false })
    hash?: string | null;

    @ApiProperty({ description: 'Type of image', example: 'originalImage' })
    type: string;

    @ApiProperty({ description: 'Additional analysis arguments', type: AnalysisItemArgsDto })
    args: AnalysisItemArgsDto;
}

export class CustomerAnalysisHistoryResponseDto {
    @ApiProperty({ description: 'HTTP status code', example: 200 })
    status: number;

    @ApiProperty({ description: 'Name of the service', example: 'Customer Analysis History Details' })
    service: string;

    @ApiProperty({
        description: 'An array of customer analysis history items',
        type: [CustomerAnalysisHistoryItemDto],
    })
    data: CustomerAnalysisHistoryItemDto[];
}

// src/dto/user-analysis-image-history-response.dto.ts

/**
 * Represents the inner arguments for an analysis history item.
 */
export class AnalysisHistoryItemArgsDto {
    @ApiProperty({ description: 'Raw value', required: false, example: '12' })
    raw?: number | string;

    @ApiProperty({ description: 'Label', required: false, example: false })
    label?: boolean | string;

    @ApiProperty({ description: 'Score', example: 1 })
    score: number | string;

    @ApiProperty({ description: 'Answers', example: 'ABCDCBCCBAAAAAAAAAAA' })
    answers: string;

    @ApiProperty({ description: 'Comment', required: false, example: false })
    comment?: boolean | string;

    @ApiProperty({ description: 'Keyword', example: 'Almost Clear' })
    keyWord: string;

    @ApiProperty({ description: 'Sebum Type', required: false, example: null })
    sebumType?: string | null;

    @ApiProperty({ description: 'Deep score', required: false, example: null })
    deep_score?: number | null;

    @ApiProperty({ description: 'Fine score', required: false, example: null })
    fine_score?: number | null;

    @ApiProperty({ description: 'Score average', example: '6.50' })
    score_average: string;

    @ApiProperty({ description: 'XY coordinates', required: false, example: false })
    xy_coordinates?: string | boolean;

    @ApiProperty({ description: 'Ultra deep score', required: false, example: null })
    ultra_deep_score?: number | null;

    @ApiProperty({ description: 'Ultra fine score', required: false, example: null })
    ultra_fine_score?: number | null;

    @ApiProperty({ description: 'Computation score', example: '7.00' })
    computation_score: string;

    @ApiProperty({ description: 'Questionnaire score', example: '0.00' })
    questionnaire_score: string;

    @ApiProperty({ description: 'Analysis type', example: 'keratin' })
    analysis_type: string;

    @ApiProperty({ description: 'Date of analysis', example: '2025-02-06' })
    date: string;

    @ApiProperty({ description: 'Time of analysis', example: '06:03:10.337233' })
    time: string;
}

/**
 * Represents a single analysis history item.
 */
export class AnalysisHistoryItemDto {
    @ApiProperty({ description: 'Measurement type', example: 'porphyrin' })
    measurement: string;

    @ApiProperty({ description: 'Analysis comment', required: false, example: null })
    analysis_comment?: string | null;

    @ApiProperty({ description: 'License ID', example: '9' })
    licenseid: string;

    @ApiProperty({ description: 'No image license flag', example: 'false' })
    no_image_license: string;

    @ApiProperty({ description: 'Batch ID', example: '428015' })
    batch_id: string;

    @ApiProperty({
        description: 'Original image (URL as string)',
        required: false,
        example: 'staging.chowis.cloud:3444/image/...',
    })
    original_image?: string | null;

    @ApiProperty({
        description: 'Analyzed image (URL as string)',
        required: false,
        example: 'staging.chowis.cloud:3444/image/...',
    })
    analyzed_url?: string | null;

    @ApiProperty({ description: 'Hash value', required: false, example: 'ba867be6-cc60-463a-89d3-a3db2a6c1e27' })
    hash?: string | null;

    @ApiProperty({ description: 'Type', example: 'originalImage' })
    type: string;

    @ApiProperty({ description: 'Analysis arguments', type: AnalysisHistoryItemArgsDto })
    args: AnalysisHistoryItemArgsDto;
}

/**
 * Represents moisture analysis data (for moistureT and moistureU).
 */
export class MoistureAnalysisDto {
    @ApiProperty({ description: 'Raw value', example: 0 })
    raw: number;

    @ApiProperty({ description: 'Score', example: 55 })
    score: number;

    @ApiProperty({ description: 'Batch ID', example: 428014 })
    batch_id: number;

    @ApiProperty({ description: 'kHeadSpa flag', example: false })
    kHeadSpa: boolean;

    @ApiProperty({ description: 'Analysis type', example: 'moistureT' })
    analysis_type: string;

    @ApiProperty({ description: 'Date', example: '2025-02-06' })
    date: string;

    @ApiProperty({ description: 'Time', example: '06:03:14.437839' })
    time: string;
}

/**
 * Represents the body of the response.
 * Each property corresponds to a measurement type.
 */
export class CustomerAnalysisHistoryBodyDto {
    @ApiProperty({ description: 'Keratin analysis history', type: [AnalysisHistoryItemDto], required: false })
    keratin?: AnalysisHistoryItemDto[];

    @ApiProperty({ description: 'Moisture T analysis history', type: MoistureAnalysisDto, required: false })
    moistureT?: MoistureAnalysisDto;

    @ApiProperty({ description: 'Moisture U analysis history', type: MoistureAnalysisDto, required: false })
    moistureU?: MoistureAnalysisDto;

    @ApiProperty({ description: 'Pores analysis history', type: [AnalysisHistoryItemDto], required: false })
    pores?: AnalysisHistoryItemDto[];

    @ApiProperty({ description: 'Porphyrin analysis history', type: [AnalysisHistoryItemDto], required: false })
    porphyrin?: AnalysisHistoryItemDto[];

    @ApiProperty({ description: 'Sebum T analysis history', type: [AnalysisHistoryItemDto], required: false })
    sebumT?: AnalysisHistoryItemDto[];

    @ApiProperty({ description: 'Sebum U analysis history', type: [AnalysisHistoryItemDto], required: false })
    sebumU?: AnalysisHistoryItemDto[];

    @ApiProperty({
        description: 'Sensitivity Redness analysis history',
        type: [AnalysisHistoryItemDto],
        required: false,
    })
    sensitivityredness?: AnalysisHistoryItemDto[];

    @ApiProperty({ description: 'Spots analysis history', type: [AnalysisHistoryItemDto], required: false })
    spots?: AnalysisHistoryItemDto[];

    @ApiProperty({ description: 'Wrinkles analysis history', type: [AnalysisHistoryItemDto], required: false })
    wrinkles?: AnalysisHistoryItemDto[];
}

/**
 * Top-level response DTO.
 */
export class CustomerAnalysisHistoryMainResponseDto {
    @ApiProperty({ description: 'HTTP status code', example: 200 })
    status: number;

    @ApiProperty({ description: 'Response message', example: 'Success' })
    msg: string;

    @ApiProperty({ description: 'Service name', example: 'getUserAnalysisImageHistory' })
    service: string;

    @ApiProperty({
        description: 'Response body containing analysis history details',
        type: CustomerAnalysisHistoryBodyDto,
    })
    body: CustomerAnalysisHistoryBodyDto;
}

export class AnalysisImageDto {
    @ApiProperty({
        description: 'The URL of the image',
        example: '',
    })
    url: string;

    @ApiProperty({
        description: 'Type of analysis (e.g., moistureT, moistureU)',
        example: 'moistureT',
    })
    analysis_type: string;

    @ApiProperty({
        description: 'Image type',
        example: 'originalImage',
    })
    type: string;

    @ApiProperty({
        description: 'Score as a string',
        example: '15',
    })
    score: string;

    @ApiProperty({
        description: 'Label value (optional)',
        example: null,
        required: false,
    })
    label?: string | null;

    @ApiProperty({
        description: 'Comment (optional)',
        example: null,
        required: false,
    })
    comment?: string | null;

    @ApiProperty({
        description: 'XY coordinates (optional)',
        example: null,
        required: false,
    })
    xy_coordinates?: string | null;

    @ApiProperty({
        description: 'Hash value for the image',
        example: '83de4d23-2f79-4ec7-a7c3-bf45bf760d0d',
    })
    hash: string;

    @ApiProperty({
        description: 'License ID (optional)',
        example: null,
        required: false,
    })
    licenseid?: string | null;

    @ApiProperty({
        description: 'No image license flag (optional)',
        example: null,
        required: false,
    })
    no_image_license?: string | null;

    @ApiProperty({
        description: 'Creation time in ISO format',
        example: '2023-01-04T13:37:00.683Z',
    })
    created_time: string;
}

export class AnalysisHistoryBodyItemDto {
    @ApiProperty({
        description: 'Batch ID',
        example: 43131,
    })
    batch_id: number;

    @ApiProperty({
        description: 'Customer ID',
        example: 0,
    })
    customer_id: number;

    @ApiProperty({
        description: 'Array of analysis images',
        type: [AnalysisImageDto],
    })
    images: AnalysisImageDto[];
}

export class UserAnalysisImageHistoryResponseDto {
    @ApiProperty({
        description: 'HTTP status code',
        example: 200,
    })
    status: number;

    @ApiProperty({
        description: 'Response message',
        example: 'Success',
    })
    msg: string;

    @ApiProperty({
        description: 'Service name',
        example: 'getUserAnalysisImageHistory',
    })
    service: string;

    @ApiProperty({
        description: 'Response body containing an array of analysis history items',
        type: [AnalysisHistoryBodyItemDto],
    })
    body: AnalysisHistoryBodyItemDto[];
}

export class AnalysisListItemDto {
    @ApiProperty({ description: 'Batch ID', example: 421145 })
    batch_id: number;

    @ApiProperty({ description: 'Analysis comment', example: null, required: false })
    analysis_comment?: string | null;

    @ApiProperty({ description: 'Date of analysis', example: '2022-08-03T15:13:06.000Z' })
    date: string;

    @ApiProperty({ description: 'Pores score', example: 29.75 })
    pores_score: number;

    @ApiProperty({ description: 'Pores computation', example: 29.75 })
    pores_computation: number;

    @ApiProperty({ description: 'Sensitivity scaling score', example: null, required: false })
    sensitivity_scaling_score?: number | null;

    @ApiProperty({ description: 'Sensitivity scaling computation', example: null, required: false })
    sensitivity_scaling_computation?: number | null;

    @ApiProperty({ description: 'Porphyrin score', example: 34.25 })
    porphiryn_score: number;

    @ApiProperty({ description: 'Porphyrin computation', example: 34.25 })
    porphiryn_computation: number;

    @ApiProperty({ description: 'Wrinkles score', example: 6.5 })
    wrinkles_score: number;

    @ApiProperty({ description: 'Wrinkles computation', example: 6.5 })
    wrinkles_computation: number;

    @ApiProperty({ description: 'Sebum U score', example: null, required: false })
    sebum_u_score?: number | null;

    @ApiProperty({ description: 'Sebum U computation', example: null, required: false })
    sebum_u_computation?: number | null;

    @ApiProperty({ description: 'Skintone score', example: null, required: false })
    skintone_score?: number | null;

    @ApiProperty({ description: 'Skintone computation', example: null, required: false })
    skintone_computation?: number | null;

    @ApiProperty({ description: 'Spots score', example: 50 })
    spots_score: number;

    @ApiProperty({ description: 'Spots computation', example: 50 })
    spots_computation: number;

    @ApiProperty({ description: 'Sebum T score', example: null, required: false })
    sebum_t_score?: number | null;

    @ApiProperty({ description: 'Sebum T computation', example: null, required: false })
    sebum_t_computation?: number | null;

    @ApiProperty({ description: 'Shine score', example: null, required: false })
    shine_score?: number | null;

    @ApiProperty({ description: 'Shine computation', example: null, required: false })
    shine_computation?: number | null;

    @ApiProperty({ description: 'Keratin score', example: 21.5 })
    keratin_score: number;

    @ApiProperty({ description: 'Keratin computation', example: 21.5 })
    keratin_computation: number;

    @ApiProperty({ description: 'Sensitivity redness score', example: null, required: false })
    sensitivity_redness_score?: number | null;

    @ApiProperty({ description: 'Sensitivity redness computation', example: null, required: false })
    sensitivity_redness_computation?: number | null;

    @ApiProperty({ description: 'Sensitivity scabs score', example: null, required: false })
    sensitivity_scabs_score?: number | null;

    @ApiProperty({ description: 'Sensitivity scabs computation', example: null, required: false })
    sensitivity_scabs_computation?: number | null;

    @ApiProperty({ description: 'Sebum score', example: null, required: false })
    sebum_score?: number | null;

    @ApiProperty({ description: 'Sebum computation', example: null, required: false })
    sebum_computation?: number | null;

    @ApiProperty({ description: 'Moisture T score', example: null, required: false })
    moisture_t_score?: number | null;

    @ApiProperty({ description: 'Moisture T computation', example: null, required: false })
    moisture_t_computation?: number | null;

    @ApiProperty({ description: 'Moisture U score', example: null, required: false })
    moisture_u_score?: number | null;

    @ApiProperty({ description: 'Moisture U computation', example: null, required: false })
    moisture_u_computation?: number | null;

    @ApiProperty({ description: 'Moisture score', example: null, required: false })
    moisture_score?: number | null;

    @ApiProperty({ description: 'Moisture computation', example: null, required: false })
    moisture_computation?: number | null;

    @ApiProperty({ description: 'Skin tone', example: null, required: false })
    skin_tone?: string | null;

    @ApiProperty({ description: 'Customer ID', example: 117706 })
    customer_id: number;

    @ApiProperty({ description: 'Combined sensitivity redness score', example: null, required: false })
    sens_redness_combined_score?: number | null;
}

export class UserAnalysisHistoryBodyDto {
    @ApiProperty({ description: 'Number of remaining items', example: 2 })
    rest_items: number;

    @ApiProperty({ description: 'Current page as a string', example: '1' })
    current_page: string;

    @ApiProperty({ description: 'List of analysis history items', type: [AnalysisListItemDto] })
    analysis_list: AnalysisListItemDto[];
}

export class UserAnalysisHistoryResponseDto {
    @ApiProperty({ description: 'HTTP status code', example: 200 })
    status: number;

    @ApiProperty({ description: 'Response message', example: 'Success' })
    msg: string;

    @ApiProperty({ description: 'Service name', example: 'getUserAnalysisHistory' })
    service: string;

    @ApiProperty({ description: 'Response body containing analysis history details', type: UserAnalysisHistoryBodyDto })
    body: UserAnalysisHistoryBodyDto;
}

