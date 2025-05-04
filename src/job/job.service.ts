import { Injectable, NotFoundException } from '@nestjs/common';
import { JobRepository } from './job.repository';
import { CreateJobDefinitionDto } from './dto/create-job-definition.dto';

@Injectable()
export class JobService {
  constructor(private readonly jobRepository: JobRepository) {}

  async createJobDefinition(dto: CreateJobDefinitionDto) {
    return this.jobRepository.createJobDefinition(dto);
  }

  async deleteJobDefinition(jobNo: number) {
    return this.jobRepository.deleteJobDefinition(jobNo);
  }

  async getJobDefinitions() {
    const jobDefinitions = await this.jobRepository.findAllJobDefinition();

    if (!jobDefinitions.length) {
      throw new NotFoundException('잡 정의가 존재하지 않습니다.');
    }

    return jobDefinitions;
  }

  async getJobDefinitionByNo(jobNo: number) {
    const jobDefinition = await this.jobRepository.findJobDefinitionByNo(jobNo);

    if (!jobDefinition) {
      throw new NotFoundException('잡 정의가 존재하지 않습니다.');
    }

    return jobDefinition;
  }
}
