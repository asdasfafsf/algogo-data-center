import { IsArray, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CreateJobStepDto } from './create-job-step.dto';

export class CreateJobDefinitionDto {
  @ApiProperty({ example: 'my-job', description: '잡 이름' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: '이 잡은 데이터를 처리합니다.',
    description: '잡 설명',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ type: [CreateJobStepDto], description: '잡의 단계 리스트' })
  @IsArray()
  stepList: CreateJobStepDto[];
}
