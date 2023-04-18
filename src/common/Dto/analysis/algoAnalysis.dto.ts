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

export class AlgoAnalysisDTO {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  batch_id?: number;

  @IsOptional()
  @Type(() => String)
  @IsString()
  type?: string;

  @IsOptional()
  @Type(() => String)
  @IsString()
  deviceModel?: string;

  @IsOptional()
  @Type(() => String)
  @IsString()
  deviceOS?: String;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  lat?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  long?: number;

  @IsOptional()
  @IsNumber()
  temperature?: number;

  @IsOptional()
  @IsNumber()
  humidity?: number;

  @IsOptional()
  @IsNumber()
  uv_index?: number;

  @IsOptional()
  @IsNumber()
  positionNumber?: number;

  @IsOptional()
  @IsString()
  task: any;
}
