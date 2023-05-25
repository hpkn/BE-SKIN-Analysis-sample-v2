import { IsNumber, Min, IsOptional, IsString, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';
import { isNull } from 'util';

export class ArgsDTO {
    @IsOptional()
    score?: number | string;

    @IsOptional()
    raw?: number | string;
}

export class AlgoDTO {
    @IsNotEmpty()
    algoName?: string;
}

export class OfflineDatasDTO {
    @IsNotEmpty()
    batchId?: number;

    @IsString()
    type?: string | null;

    @IsOptional()
    deviceModel?: string | null;

    @IsOptional()
    deviceOS?: String | null;

    @IsOptional()
    lat?: number | null;

    @IsOptional()
    long?: number | null;

    @IsOptional()
    temperature?: number | null;

    @IsOptional()
    humidity?: number | null;

    @IsOptional()
    uv_index?: number | null;

    @IsOptional()
    task?: AlgoDTO;

    @IsOptional()
    args: ArgsDTO;
}

