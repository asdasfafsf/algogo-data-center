import { Injectable } from '@nestjs/common';
import { JobRegistry } from './job-registry';
import { JobKey } from '../common/types/job.type';

@Injectable()
export class DispatcherService {
  constructor(private readonly jobRegistry: JobRegistry) {}

  async dispatch(key: JobKey, data: any) {
    const job = this.jobRegistry.get(key);
    const result = await job.run(data);
    return result;
  }
}
