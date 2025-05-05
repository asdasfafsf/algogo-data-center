import { Injectable } from '@nestjs/common';
import { JobRunner } from '../job/interfaces/job-runner.interface';
import { JobHandler } from '../job/decorators/job-handler.decorator';
import { PROBLEM_BOJ_LOAD } from '../job/constants/job.constants';
import { AcmicpcResponse } from './types/acmicpc.type';

@Injectable()
@JobHandler(PROBLEM_BOJ_LOAD)
export class ProblemBojLoadJob
  implements JobRunner<AcmicpcResponse, AcmicpcResponse>
{
  constructor() {}

  async run(data: AcmicpcResponse) {
    return data;
  }
}
