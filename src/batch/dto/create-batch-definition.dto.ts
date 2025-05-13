import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MaxLength, IsIn } from 'class-validator';
import { BATCH_PLAN_MAP } from '../constants/batch-plan.constant';
import { IsCron } from '../../common/decorators/is-cron.decorator';

export class CreateBatchDefinitionDto {
  @ApiProperty({
    description: '배치 작업 이름',
    enum: Object.values(BATCH_PLAN_MAP),
    example: 'PROBLEM_BOJ',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: '배치 작업 이름',
    enum: Object.values(BATCH_PLAN_MAP),
    example: 'PROBLEM_BOJ',
  })
  @IsString()
  @IsNotEmpty()
  @IsIn(Object.values(BATCH_PLAN_MAP), {
    message: `jobName은 다음 중 하나여야 합니다: ${Object.values(BATCH_PLAN_MAP).join(', ')}`,
  })
  jobName: string;

  @ApiProperty({
    description: '배치 작업 설명',
    example: '백준 온라인 저지의 문제 데이터를 동기화합니다.',
    maxLength: 500,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500, { message: '설명은 500자를 초과할 수 없습니다.' })
  description: string;

  @ApiProperty({
    description: 'Cron 표현식 (예: "0 0 * * *")',
    example: '0 0 * * *',
  })
  @IsString()
  @IsNotEmpty()
  @IsCron()
  cron: string;
}
