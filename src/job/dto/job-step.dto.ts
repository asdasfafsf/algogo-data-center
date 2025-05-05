import { ApiProperty } from '@nestjs/swagger';

export class JobStepDto {
  @ApiProperty({ example: 1, description: '잡 단계 번호' })
  no: number;

  @ApiProperty({ example: '잡 단계 이름', description: '잡 단계 이름' })
  name: string;

  @ApiProperty({ example: 1, description: '잡 단계 순서' })
  order: number;

  @ApiProperty({ example: '잡 단계 설명', description: '잡 단계 설명' })
  description: string;

  @ApiProperty({ example: '잡 단계 생성일', description: '잡 단계 생성일' })
  createdAt: Date;

  @ApiProperty({ example: '잡 단계 수정일', description: '잡 단계 수정일' })
  updatedAt: Date;
}
