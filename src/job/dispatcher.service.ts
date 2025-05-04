import { Injectable, NotFoundException } from '@nestjs/common';
import { JobRegistry } from './job-registry';
import { JobHandlerKey } from './types/job.type';
import { JobRepository } from './job.repository';
import { getElapsedTime } from '../common/date';

@Injectable()
export class DispatcherService {
  constructor(
    private readonly jobRepository: JobRepository,
    private readonly jobRegistry: JobRegistry,
  ) {}

  async dispatch(key: JobHandlerKey, param: any & { data: any; uuid: string }) {
    const startedAt = new Date();
    try {
      const { data, uuid } = param;
      await this.jobRepository.upsertJobInstance({
        uuid,
        startedAt,
        request: data,
        state: 'RUNNING',
      });

      const job = this.jobRegistry.get(key);

      if (!job) {
        throw new NotFoundException(`Job not found: ${key}`);
      }

      const result = await job.run(data);
      const finishedAt = new Date();
      const elapsedTime = getElapsedTime(startedAt, finishedAt);

      await this.jobRepository.upsertJobInstance({
        uuid,
        finishedAt,
        elapsedTime,
        state: 'SUCCESS',
        result,
      });
      return result;
    } catch (error) {
      const finishedAt = new Date();
      const elapsedTime = getElapsedTime(startedAt, finishedAt);

      await this.jobRepository.upsertJobInstance({
        uuid: param.uuid,
        finishedAt,
        elapsedTime,
        state: 'FAILED',
        errorCode: error.code,
        errorMessage: error.message,
      });
    }
  }
}
