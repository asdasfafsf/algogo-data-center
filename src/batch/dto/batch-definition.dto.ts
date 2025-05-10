import { ApiProperty } from '@nestjs/swagger';

export class BatchDefinitionDto {
  @ApiProperty({
    description: '배치 작업 정의 번호',
    example: 1,
  })
  no: number;

  @ApiProperty({
    description: '배치 작업 이름',
    example: 'PROBLEM_BOJ',
  })
  name: string;

  @ApiProperty({
    description: '배치 작업 설명',
    example: '백준 온라인 저지의 문제 데이터를 동기화합니다.',
  })
  description: string;

  @ApiProperty({
    description: 'Cron 표현식',
    example: '0 0 * * *',
  })
  cron: string;

  @ApiProperty({
    description: '생성일시',
    example: '2024-03-20T00:00:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: '수정일시',
    example: '2024-03-20T00:00:00Z',
  })
  updatedAt: Date;
}
