import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { JobRegistry } from './job-registry';
import { JobHandlerKey } from './types/job.type';
import { JobRepository } from './job.repository';
import { getElapsedTime } from '../common/date';

@Injectable()
export class DispatcherService {
  private readonly logger = new Logger(DispatcherService.name);

  constructor(
    private readonly jobRepository: JobRepository,
    private readonly jobRegistry: JobRegistry,
  ) {}

  async dispatch(key: JobHandlerKey, data: any & { uuid: string }) {
    const startedAt = new Date();
    this.logger.log(`Dispatching job ${key}`);
    this.logger.log(data);
    const { uuid } = data;
    const request = { ...data, uuid: undefined };
    try {
      await this.jobRepository.upsertJobInstance({
        uuid,
        startedAt,
        name: key,
        step: key,
        request,
        state: 'RUNNING',
      });

      const job = this.jobRegistry.get(key);

      if (!job) {
        throw new NotFoundException(`Job not found: ${key}`);
      }

      const result = await job.run(data);
      this.logger.log(`Job ${key} finished`, result);
      const finishedAt = new Date();
      const elapsedTime = getElapsedTime(startedAt, finishedAt);

      await this.jobRepository.upsertJobInstance({
        uuid,
        startedAt,
        finishedAt,
        name: key,
        step: key,
        elapsedTime,
        state: 'SUCCESS',
        result,
      });
      return result;
    } catch (error) {
      this.logger.error(`Job ${key} failed`, error);
      const finishedAt = new Date();
      const elapsedTime = getElapsedTime(startedAt, finishedAt);

      await this.jobRepository.upsertJobInstance({
        uuid,
        startedAt,
        finishedAt,
        request,
        elapsedTime,
        name: key,
        step: key,
        state: 'FAILED',
        errorCode: error.code,
        errorMessage: error.message,
      });

      throw error;
    }
  }
}
