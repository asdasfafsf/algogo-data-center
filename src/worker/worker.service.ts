import { Injectable } from '@nestjs/common';
import { DispatcherService } from '../job/dispatcher.service';
import { JobKey } from '../job/types/job.type';

@Injectable()
export class WorkerService {
  constructor(private readonly dispatcherService: DispatcherService) {}

  async dispatch(key: JobKey, data: any) {
    return this.dispatcherService.dispatch(key, data);
  }
}
