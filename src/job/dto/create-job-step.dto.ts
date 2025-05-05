import { IsNotEmpty, IsInt, Min, IsIn, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { JOB_HANDLER_MAP } from '../constants/job.constants';
import { JobHandlerKey } from '../types/job.type';

export class CreateJobStepDto {
  @ApiProperty({
    example: 'PROBLEM_BOJ_COLLECT',
    description: 'JobHandler의 key 값 (JOB_HANDLER_MAP의 key 중 하나)',
    enum: Object.keys(JOB_HANDLER_MAP),
  })
  @IsIn(Object.keys(JOB_HANDLER_MAP))
  @IsNotEmpty()
  name: JobHandlerKey;

  @ApiProperty({
    example: '문제 수집 단계',
    description: '이 단계의 설명',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    example: 0,
    description: '단계 순서 (0부터 시작)',
    minimum: 0,
  })
  @IsInt()
  @Min(0)
  order: number;
}
