import {
    IsOptional,
    IsString,
    IsNotEmpty,
    IsArray,
    IsInt,
    IsObject,
    ValidateNested,
    ArrayNotEmpty,
    IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ArgsDTO {
    @ApiProperty({
        type: Number,
    })
    score?: number | string;

    @ApiProperty({
        type: Number,
    })
    raw?: number | string;
}

export class AlgoDTO {
    @ApiProperty({
        type: String,
        description: 'This is required',
    })
    algoName?: string;
}

export class MultiArgsEncryptionDTO {
    @ApiProperty({
        description: 'array of Scores',
        type: [String],
        example: ['am', 'amHPC'],
    })
    @IsArray()
    @ArrayNotEmpty()
    @IsInt({ each: true })
    score?: string[];

    @ApiProperty({
        description: 'array of raw Scores',
        type: [String],
        example: ['am', 'amHPC'],
    })
    @IsArray()
    @ArrayNotEmpty()
    @IsInt({ each: true })
    raw?: string[];
}

/* 
    CBB Encryption
*/

export class EncryptedCBBDTO {
    @ApiProperty({
        type: 'array',
        items: { type: 'string', format: 'binary' },
    })
    @IsNotEmpty()
    // @IsArray()
    originalImage: string[];

    @ApiProperty({
        type: 'array',
        items: { type: 'string', format: 'binary' },
    })
    @IsNotEmpty()
    // @IsArray()
    analyzedImage: string[];

    @ApiProperty({
        type: String,
        description: 'This is required',
        example: 5462,
    })
    @IsNotEmpty()
    batchId?: number;

    @ApiPropertyOptional({
        type: String,
        description: 'This is required',
    })
    answers?: string | null;

    @ApiProperty({
        type: String,
        description: 'This is required',
        example: 5462,
    })
    @IsNotEmpty()
    birthYear?: number;

    @ApiProperty({
        type: Number,
        description: 'This is required',
        example: 1,
    })
    @IsString()
    type?: any | null;

    @ApiProperty({
        type: String,
        description: 'This is required',
        example: 'Samsung',
    })
    deviceModel?: string | null;

    @ApiProperty({
        type: String,
        description: 'This is required',
        example: 'Android',
    })
    deviceOS?: String | null;

    @ApiProperty({
        type: String,
        description: 'This is required',
        example: 'V_0.0.1',
    })
    appVersion?: String | null;

    @ApiProperty({
        type: String,
        description: 'This is required',
        example: 45,
    })
    lat?: number | null;

    @ApiProperty({
        type: String,
        description: 'This is required',
        example: 0,
    })
    long?: number | null;

    @ApiProperty({
        type: String,
        description: 'This is required',
        example: 20,
    })
    temperature?: number | null;

    @ApiProperty({
        type: String,
        description: 'This is required',
        example: 0,
    })
    humidity?: number | null;

    @ApiProperty({
        type: String,
        description: 'This is required',
        example: 20,
    })
    uv_index?: number | null;

    @IsOptional()
    task?: AlgoDTO;

    @ApiProperty({ description: 'Nested object containing score and raw data', type: MultiArgsEncryptionDTO })
    @IsObject()
    @ValidateNested()
    @Type(() => MultiArgsEncryptionDTO)
    args: MultiArgsEncryptionDTO;

    @ApiPropertyOptional({
        type: String,
        description: 'Label about the image result',
        example: ['Deep Wrinkles found', 'Check Spots again'],
        isArray: true,
    })
    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    label?: string[];

    @ApiPropertyOptional({
        type: String,
        description: 'Comment on the image result',
        example: ['Evaluate in 2 weeks', 'Spots need more analysis'],
        isArray: true,
    })
    comment?: string[];

    @ApiPropertyOptional({
        type: String,
        isArray: true,
        description: 'Coodinate of the commented image erea',
        example: ['coordinate1', 'coodinate2'],
    })
    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    xy_coordinates?: string[];

    @ApiPropertyOptional({
        type: Number,
        description:
            'Type: Number - Licence Type: { Eco: 4, STANDARD: 5, PROFESSIONAL: 6, Expert: 7, PMX: 8, Pro-AI: 9}',
        example: 9,
    })
    licenseId?: number;
}
/* 
    CBB and offline upload
*/

export class OfflineDatasDTO {
    @ApiProperty({
        type: 'array',
        items: { type: 'string', format: 'binary' },
    })
    @IsNotEmpty()
    // @IsArray()
    originalImage: string[];

    @ApiProperty({
        type: 'array',
        items: { type: 'string', format: 'binary' },
    })
    @IsNotEmpty()
    // @IsArray()
    analyzedImage: string[];

    @ApiProperty({
        type: String,
        description: 'This is required',
        example: 5462,
    })
    @IsNotEmpty()
    batchId?: number;

    @ApiProperty({
        type: String,
        description: 'This is required',
        example: 'density',
    })
    @IsString()
    type?: string | null;

    @ApiProperty({
        type: String,
        description: 'This is required',
        example: 'Samsung',
    })
    deviceModel?: string | null;

    @ApiProperty({
        type: String,
        description: 'This is required',
        example: 'Android',
    })
    deviceOS?: String | null;

    @ApiProperty({
        type: String,
        description: 'This is required',
        example: 45,
    })
    lat?: number | null;

    @ApiProperty({
        type: String,
        description: 'This is required',
        example: 0,
    })
    long?: number | null;

    @ApiProperty({
        type: String,
        description: 'This is required',
        example: 20,
    })
    temperature?: number | null;

    @ApiProperty({
        type: String,
        description: 'This is required',
        example: 0,
    })
    humidity?: number | null;

    @ApiProperty({
        type: String,
        description: 'This is required',
        example: 20,
    })
    uv_index?: number | null;

    @ApiPropertyOptional({
        type: String,
        description: 'This is required',
        example: 20,
    })
    questionnaire_score?: number | null;

    @ApiPropertyOptional({
        type: String,
        description: 'This is required',
        example: 200,
    })
    computation_score?: number | null;

    @ApiPropertyOptional({
        type: String,
        description: 'This is required',
        example: 20,
    })
    score_average?: number | null;

    @IsOptional()
    task?: AlgoDTO;

    @ApiProperty({ type: [ArgsDTO] })
    args: ArgsDTO[];

    @ApiProperty({
        type: String,
        description: 'This is required',
        example: 'V_0.0.1',
    })
    appVersion?: String | null;

    @ApiPropertyOptional({
        type: Number,
        description:
            'Type: Number - Licence Type: { Eco: 4, STANDARD: 5, PROFESSIONAL: 6, Expert: 7, PMX: 8, Pro-AI: 9}',
        example: 9,
    })
    licenseId?: number;

    @ApiPropertyOptional({
        type: Number,
        description: 'Fine score',
        example: 100,
    })
    @IsOptional()
    @IsArray()
    @IsNumber()
    fineScore?: number[];

    @ApiPropertyOptional({
        type: Number,
        description: 'Ultra fine score',
        example: 100,
    })
    @IsOptional()
    @IsArray()
    @IsNumber()
    ultraFineScore?: number[];

    @ApiPropertyOptional({
        type: Number,
        description: 'Deep score',
        example: 100,
    })
    @IsOptional()
    @IsArray()
    @IsNumber()
    deepScore?: number[];

    @ApiPropertyOptional({
        type: Number,
        description: 'Ultra deep score',
        example: 100,
    })
    @IsOptional()
    @IsArray()
    @IsNumber()
    ultraDeepScore?: number[];

    @IsOptional()
    kiosk: any;
}

export class MultiArgsDTO {
    @ApiProperty({
        description: 'array of Scores',
        type: [Number],
        example: [1, 23],
    })
    @IsArray()
    @ArrayNotEmpty()
    @IsInt({ each: true })
    score?: number[] | any[];

    @ApiProperty({
        description: 'array of raw Scores',
        type: [Number],
        example: [1, 23],
    })
    @IsArray()
    @ArrayNotEmpty()
    @IsInt({ each: true })
    raw?: number[] | any[];
}

export class OfflineDataCBBDTO {
    @ApiProperty({
        type: 'array',
        items: { type: 'string', format: 'binary' },
    })
    @IsNotEmpty()
    // @IsArray()
    originalImage: string[];

    @ApiProperty({
        type: 'array',
        items: { type: 'string', format: 'binary' },
    })
    @IsNotEmpty()
    // @IsArray()
    analyzedImage: string[];

    @ApiProperty({
        type: String,
        description: 'This is required',
        example: 5462,
    })
    @IsNotEmpty()
    batchId?: number;

    @ApiPropertyOptional({
        type: String,
        description: 'This is required',
    })
    answers?: string | null;

    @ApiProperty({
        type: String,
        description: 'This is required',
        example: 5462,
    })
    @IsNotEmpty()
    birthYear?: number;

    @ApiProperty({
        type: Number,
        description: 'This is required',
        example: 1,
    })
    @IsString()
    type?: any | null;

    @ApiProperty({
        type: String,
        description: 'This is required',
        example: 'Samsung',
    })
    deviceModel?: string | null;

    @ApiProperty({
        type: String,
        description: 'This is required',
        example: 'Android',
    })
    deviceOS?: String | null;

    @ApiProperty({
        type: String,
        description: 'This is required',
        example: 'V_0.0.1',
    })
    appVersion?: String | null;

    @ApiProperty({
        type: String,
        description: 'This is required',
        example: 45,
    })
    lat?: number | null;

    @ApiProperty({
        type: String,
        description: 'This is required',
        example: 0,
    })
    long?: number | null;

    @ApiProperty({
        type: String,
        description: 'This is required',
        example: 20,
    })
    temperature?: number | null;

    @ApiProperty({
        type: String,
        description: 'This is required',
        example: 0,
    })
    humidity?: number | null;

    @ApiProperty({
        type: String,
        description: 'This is required',
        example: 20,
    })
    uv_index?: number | null;

    /* Optional customer data. */
    @ApiPropertyOptional({
        type: String,
        description: 'This is optional',
        example: 'Male',
    })
    gender?: String | null;

    @ApiPropertyOptional({
        type: String,
        description: 'This is optional',
        example: 'SG1',
    })
    skin_color_group?: String | null;

    @ApiPropertyOptional({
        type: String,
        description: 'This is optional',
        example: 'Dark Skin',
    })
    ethnicities?: String | null;

    @ApiPropertyOptional({
        type: Number,
        description:
            'Type: Number - Licence Type: { Eco: 4, STANDARD: 5, PROFESSIONAL: 6, Expert: 7, PMX: 8, Pro-AI: 9}',
        example: 9,
    })
    licenseId?: number;

    /* Optional customer data. */

    @IsOptional()
    task?: AlgoDTO;

    @ApiProperty({ description: 'Nested object containing score and raw data', type: MultiArgsDTO })
    @IsObject()
    @ValidateNested()
    @Type(() => MultiArgsDTO)
    args: MultiArgsDTO | any;

    @IsOptional()
    batch_id: any;

    @IsOptional()
    encryptedCBB: boolean = false;

    @IsOptional()
    kHeadSpa: boolean = false;

    // New Fields
    @ApiPropertyOptional({
        type: String,
        description: 'Label about the image result',
        example: ['Deep Wrinkles found', 'Check Spots again'],
        isArray: true,
    })
    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    label?: string[];

    @ApiPropertyOptional({
        type: String,
        description: 'Comment on the image result',
        example: ['Evaluate in 2 weeks', 'Spots need more analysis'],
        isArray: true,
    })
    comment?: string[];

    @ApiPropertyOptional({
        type: String,
        isArray: true,
        description: 'Coodinate of the commented image erea',
        example: ['coordinate1', 'coodinate2'],
    })
    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    xy_coordinates?: string[];

    @ApiPropertyOptional({
        type: Number,
        isArray: true,
        description: 'Fine score',
        example: 100,
    })
    @IsOptional()
    @IsArray()
    @IsNumber()
    fineScore?: number[];

    @ApiPropertyOptional({
        type: Number,
        isArray: true,
        description: 'Ultra fine score',
        example: 100,
    })
    @IsOptional()
    @IsArray()
    @IsNumber()
    ultraFineScore?: number[];

    @ApiPropertyOptional({
        type: Number,
        isArray: true,
        description: 'Deep score',
        example: 100,
    })
    @IsOptional()
    @IsArray()
    @IsNumber()
    deepScore?: number[];

    @ApiPropertyOptional({
        type: Number,
        isArray: true,
        description: 'Ultra deep score',
        example: 100,
    })
    @IsOptional()
    @IsArray()
    @IsNumber()
    ultraDeepScore?: number[];

    @IsOptional()
    kiosk: any;
}
