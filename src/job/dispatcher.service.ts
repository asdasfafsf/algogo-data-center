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

  async getNextData({ uuid }: { key: JobHandlerKey; uuid: string }) {
    const jobInstances = await this.jobRepository.findJobInstanceByUuid(uuid);

    return jobInstances.at(-1)?.result;
  }

  async dispatch(key: JobHandlerKey, data: any & { uuid: string }) {
    this.logger.log(`Dispatching job ${key}`);

    const startedAt = new Date();
    const { uuid } = data;
    let request = { ...data, uuid: undefined };

    try {
      const nextData = (await this.getNextData({ key, uuid })) ?? data;
      request = { ...nextData, uuid: undefined };

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

      const result = await job.run(nextData);
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
