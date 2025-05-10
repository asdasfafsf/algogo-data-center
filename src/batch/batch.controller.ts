import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  HttpCode,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { BatchService } from './batch.service';
import { CreateBatchDefinitionDto } from './dto/create-batch-definition.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { BatchDefinitionDto } from './dto/batch-definition.dto';
import { ResponseDto } from '../common/dto/response-dto';

@ApiTags('Batch')
@Controller('api/v1/batch')
export class BatchController {
  constructor(private readonly batchService: BatchService) {}

  @Get('definitions')
  @ApiOperation({
    summary: '배치 작업 정의 목록 조회',
    description: '등록된 모든 배치 작업 정의를 조회합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '배치 작업 정의 목록 조회 성공',
    type: ResponseDto<BatchDefinitionDto[]>,
  })
  async getBatchDefinitions() {
    return await this.batchService.findAllBatchDefinition();
  }

  @ApiOperation({
    summary: '배치 작업 정의 생성',
    description: '새로운 배치 작업 정의를 생성합니다.',
  })
  @ApiResponse({
    status: 201,
    description: '배치 작업 정의가 성공적으로 생성됨',
    type: ResponseDto<null>,
  })
  @ApiResponse({
    status: 400,
    description: '잘못된 요청 데이터',
  })
  @Post('definition')
  @HttpCode(201)
  async createBatchDefinition(
    @Body() createBatchDefinitionDto: CreateBatchDefinitionDto,
  ) {
    const result = await this.batchService.saveBatchDefinition(
      createBatchDefinitionDto,
    );
    return result;
  }

  @Delete('definition/:no')
  @ApiOperation({
    summary: '배치 작업 정의 삭제',
    description: '지정된 번호의 배치 작업 정의를 삭제합니다.',
  })
  @ApiParam({
    name: 'no',
    description: '삭제할 배치 작업 정의 번호',
    type: 'number',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: '배치 작업 정의 삭제 성공',
  })
  @ApiResponse({
    status: 404,
    description: '해당 번호의 배치 작업 정의를 찾을 수 없음',
  })
  async deleteBatchDefinition(@Param('no', ParseIntPipe) no: number) {
    await this.batchService.deleteBatchDefinition(no);
    return;
  }
}
