import { JobRunner } from '../job/interfaces/job-runner.interface';
import { NemoService } from '../nemo/nemo.service';
import { PrismaService } from '../prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import { JobHandler } from 'src/job/decorators/job-handler.decorator';
import {
  JOB_HANDLER_MAP,
  PROBLEM_ACMICPC_USER,
} from '../job/constants/job.constants';
import { AcmicpcUser } from './types/acmicpc.type';

@Injectable()
@JobHandler(JOB_HANDLER_MAP[PROBLEM_ACMICPC_USER])
export class ProblemAcmicpcUserJob implements JobRunner<any, any> {
  constructor(
    private readonly nemoService: NemoService,
    private readonly prismaService: PrismaService,
  ) {}

  async run({ userUuid, handle }: { userUuid: string; handle: string }) {
    const nemoResponse = await this.nemoService.execute({
      key1: 'acmicpc-user',
      key2: 'acmicpc-user',
      config: {
        timeout: 10000,
      },
      data: {
        userId: handle,
      },
    });

    const acmicpcUser = nemoResponse.data as AcmicpcUser;

    await this.prismaService.problemSiteAccount.update({
      where: {
        userUuid_provider: {
          userUuid,
          provider: 'BOJ',
        },
      },
      data: {
        failedCount: acmicpcUser.fails.length,
      },
    });

    const problemUuids = await this.prismaService.problemV2.findMany({
      where: {
        source: 'BOJ',
        sourceId: {
          in: acmicpcUser.solves.map(String),
        },
      },
      select: {
        uuid: true,
      },
    });

    await this.prismaService.userProblemState.createMany({
      data: problemUuids.map((problem) => ({
        userUuid,
        problemUuid: problem.uuid,
        state: 'SOLVED',
      })),
    });

    return {
      userUuid,
      handle,
    };
  }
}
