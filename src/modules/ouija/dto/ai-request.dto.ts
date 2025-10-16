import { IsString, IsOptional, IsNumber, Min, Max, IsArray } from 'class-validator';

export class AIRequestDto {
  @IsArray()
  messages: Array<{ role: string; content: string }>;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(2)
  temperature?: number = 0.9;

  @IsOptional()
  @IsNumber()
  @Min(100)
  @Max(4096)
  maxTokens?: number = 500;

  @IsOptional()
  @IsString()
  systemPrompt?: string;
}

export class AIResponseDto {
  content: string;
  engine: string;
  model?: string;
  timestamp: Date;
  processingTime: number;
}
