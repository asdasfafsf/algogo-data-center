import { Injectable } from '@nestjs/common';
import { JobRegistry } from './job-registry';
import { JobHandlerKey } from './types/job.type';

@Injectable()
export class DispatcherService {
  constructor(private readonly jobRegistry: JobRegistry) {}

  async dispatch(key: JobHandlerKey, data: any) {
    try {
      const job = this.jobRegistry.get(key);
      const result = await job.run(data);
      return result;
    } catch {}
  }
}
