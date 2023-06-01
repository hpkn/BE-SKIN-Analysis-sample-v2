// batch_id
// type
// deviceModel
// deviceOS
// lat
// long
// temperature
// humidity
// uv_index
// positionNumber
import { IsNumber, Min, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { isNull } from 'util';

export class AlgoAnalysisDTO {
    @IsOptional()
    // @Type(() => Number)
    // @IsNumber()
    batch_id?: number;

    @IsOptional()
    // @Type(() => String)
    // @IsString()
    type?: string | null;

    @IsOptional()
    // @Type(() => String)
    // @IsString()
    deviceModel?: string | null;

    @IsOptional()
    // @Type(() => String)
    // @IsString()
    deviceOS?: String | null;

    @IsOptional()
    // @Type(() => Number)
    // @IsNumber()
    lat?: number | null;

    @IsOptional()
    // @Type(() => Number)
    // @IsNumber()number | null
    long?: number | null;

    @IsOptional()
    // @IsNumber()
    temperature?: number | null;

    @IsOptional()
    // @IsNumber()
    humidity?: number | null;

    @IsOptional()
    // @IsNumber()
    uv_index?: number | null;

    @IsOptional()
    // @IsNumber()
    positionNumber?: number | null;

    @IsOptional()
    // @IsString()
    task: any;
}
