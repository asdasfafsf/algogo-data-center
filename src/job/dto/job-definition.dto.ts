import { ApiProperty } from '@nestjs/swagger';
import { JobStepDto } from './job-step.dto';
export class JobDefinitionDto {
  @ApiProperty({ example: 1, description: '잡 번호' })
  no: number;

  @ApiProperty({ example: '잡 이름', description: '잡 이름' })
  name: string;

  @ApiProperty({ example: '잡 설명', description: '잡 설명' })
  description: string;

  @ApiProperty({ example: new Date(), description: '잡 생성일' })
  createdAt: Date;

  @ApiProperty({ example: new Date(), description: '잡 수정일' })
  updatedAt: Date;

  @ApiProperty({ example: [], description: '잡 단계 리스트' })
  stepList: JobStepDto[];
}
