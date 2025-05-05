import { Injectable } from '@nestjs/common';
import { JobHandlerKey } from '../job/types/job.type';

@Injectable()
export class WorkerService {
  constructor() {}

  async dispatch(key: JobHandlerKey, data: any) {}
}
