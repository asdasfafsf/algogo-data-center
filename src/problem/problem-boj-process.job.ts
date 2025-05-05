import { Injectable } from '@nestjs/common';
import { JobRunner } from '../job/interfaces/job-runner.interface';
import { JobHandler } from '../job/decorators/job-handler.decorator';
import { PROBLEM_BOJ_PROCESS } from '../job/constants/job.constants';
import { AcmicpcResponse } from './types/acmicpc.type';

@Injectable()
@JobHandler(PROBLEM_BOJ_PROCESS)
export class ProblemBojProcessJob
  implements JobRunner<AcmicpcResponse, AcmicpcResponse>
{
  constructor() {}

  async run(data: AcmicpcResponse) {
    return data;
  }
}
