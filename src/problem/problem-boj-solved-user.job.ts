import { JobRunner } from '../job/interfaces/job-runner.interface';
import { NemoService } from '../nemo/nemo.service';
import { SolvedUser } from './types/solved.type';
import { PrismaService } from '../prisma/prisma.service';

export class ProblemBojSolvedUserJob implements JobRunner<any, any> {
  constructor(
    private readonly nemoService: NemoService,
    private readonly prismaService: PrismaService,
  ) {}

  async run({
    userUuid,
    handle,
    solvedCount,
  }: {
    userUuid: string;
    handle: string;
    solvedCount: number;
  }) {
    const nemoResponse = await this.nemoService.execute({
      key1: 'solved-user',
      key2: 'solved-user',
      config: {
        timeout: 10000,
      },
      data: {
        userId: handle,
      },
    });

    const solvedUser = nemoResponse.data as SolvedUser;

    if (solvedCount === solvedUser.solvedCount) {
      throw new Error('solvedCount is not changed');
    }

    await this.prismaService.problemSiteAccount.update({
      where: {
        userUuid_provider: {
          userUuid,
          provider: 'BOJ',
        },
      },
      data: {
        solvedCount: solvedUser.solvedCount,
      },
    });

    return {
      userUuid,
      handle,
    };
  }
}
