import { Injectable } from '@nestjs/common';
import { DispatcherService } from '../batch/dispatcher.service';
import { JobKey } from '../common/types/job.type';

@Injectable()
export class WorkerService {
  constructor(private readonly dispatcherService: DispatcherService) {}

  async dispatch(key: JobKey, data: any) {
    return this.dispatcherService.dispatch(key, data);
  }
}
