import { Injectable, NotFoundException } from '@nestjs/common';
import { JobRegistry } from './job-registry';
import { JobHandlerKey } from './types/job.type';
import { JobRepository } from './job.repository';

@Injectable()
export class DispatcherService {
  constructor(
    private readonly jobRepository: JobRepository,
    private readonly jobRegistry: JobRegistry,
  ) {}

  async dispatch(key: JobHandlerKey, data: any) {
    try {
      const job = this.jobRegistry.get(key);

      if (!job) {
        throw new NotFoundException(`Job not found: ${key}`);
      }

      const result = await job.run(data);
      return result;
    } catch {}
  }
}
