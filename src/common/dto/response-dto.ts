import { ApiProperty } from '@nestjs/swagger';

export class ResponseDto<T> {
  @ApiProperty({ example: 'SUCCESS', description: '응답 코드' })
  code: string;

  @ApiProperty({
    example: '요청이 성공적으로 처리되었습니다.',
    description: '응답 메시지',
  })
  message: string;

  @ApiProperty({ description: '응답 데이터', required: false })
  data: T;
}
