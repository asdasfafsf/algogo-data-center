import { Injectable } from '@nestjs/common';
import { JobRunner } from '../job/interfaces/job-runner.interface';
import { JobHandler } from '../job/decorators/job-handler.decorator';
import { PROBLEM_BOJ_COLLECT } from '../job/constants/job.constants';
import {
  ProblemCollectRequest,
  ProblemCollectResponse,
} from './types/problem.type';
import { NemoService } from '../nemo/nemo.service';
import { AcmicpcRequest, AcmicpcResponse } from './types/acmicpc.type';

@Injectable()
@JobHandler(PROBLEM_BOJ_COLLECT)
export class ProblemBojCollectJob
  implements JobRunner<ProblemCollectRequest, ProblemCollectResponse>
{
  constructor(private readonly nemoService: NemoService) {}

  async run(data: ProblemCollectRequest) {
    const { source, sourceId } = data;
    const nemoResponse = await this.nemoService.execute<
      AcmicpcRequest,
      AcmicpcResponse
    >({
      key1: source,
      key2: '',
      data: {
        key: sourceId,
      },
      config: {
        timeout: 30000,
      },
    });
    return nemoResponse.data;
  }
}
