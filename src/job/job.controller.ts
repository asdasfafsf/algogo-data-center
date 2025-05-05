import {
  Controller,
  Delete,
  Get,
  HttpCode,
  Post,
  Body,
  Param,
} from '@nestjs/common';
import { JobService } from './job.service';
import { CreateJobDefinitionDto } from './dto/create-job-definition.dto';
import {
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOperation,
  ApiOkResponse,
} from '@nestjs/swagger';
import { ResponseDto } from '../common/dto/response-dto';
import { JobDefinitionDto } from './dto/job-definition.dto';
@Controller('api/v1/job')
export class JobController {
  constructor(private readonly jobService: JobService) {}

  @ApiOperation({ summary: '잡 정의 생성' })
  @ApiCreatedResponse({
    description: '잡 정의 생성 성공',
    type: ResponseDto<JobDefinitionDto>,
  })
  @Post()
  @HttpCode(201)
  async createJob(@Body() dto: CreateJobDefinitionDto) {
    return this.jobService.createJobDefinition(dto);
  }

  @ApiOperation({ summary: '잡 정의 삭제' })
  @ApiNoContentResponse({
    description: '잡 정의 삭제 성공',
  })
  @Delete(':jobNo')
  @HttpCode(204)
  async deleteJob(@Param('jobNo') jobNo: number) {
    return this.jobService.deleteJobDefinition(jobNo);
  }

  @ApiOperation({ summary: '잡 정의 목록 조회' })
  @ApiOkResponse({
    description: '잡 정의 목록 조회 성공',
    type: ResponseDto<JobDefinitionDto[]>,
  })
  @Get()
  @HttpCode(200)
  async getJob() {
    return this.jobService.getJobDefinitions();
  }

  @ApiOperation({ summary: '잡 정의 조회' })
  @ApiOkResponse({
    description: '잡 정의 조회 성공',
    type: ResponseDto<JobDefinitionDto>,
  })
  @Get(':jobNo')
  @HttpCode(200)
  async getJobByNo(@Param('jobNo') jobNo: number) {
    return this.jobService.getJobDefinitionByNo(jobNo);
  }
}
