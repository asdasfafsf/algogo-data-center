import { Controller, Delete, Get, Post, Body, Param } from '@nestjs/common';
import { JobService } from './job.service';
import { CreateJobDefinitionDto } from './dto/create-job-definition.dto';

@Controller('api/v1/job')
export class JobController {
  constructor(private readonly jobService: JobService) {}

  @Post()
  async createJob(@Body() dto: CreateJobDefinitionDto) {
    return this.jobService.createJobDefinition(dto);
  }

  @Delete(':jobNo')
  async deleteJob(@Param('jobNo') jobNo: number) {
    return this.jobService.deleteJobDefinition(jobNo);
  }

  @Get()
  async getJob() {
    return this.jobService.getJobDefinitions();
  }

  @Get(':jobNo')
  async getJobByNo(@Param('jobNo') jobNo: number) {
    return this.jobService.getJobDefinitionByNo(jobNo);
  }
}
