import { Injectable } from '@nestjs/common';
import { BatchPlan } from '../interfaces/batch-plan.interface';
import { BatchDefinitionDto } from '../dto/batch-definition.dto';
import { PROBLEM_BOJ_USER } from '../constants/batch-plan.constant';
import { CreateBatchInstanceDto } from '../dto/create-batch-instance.dto';
import { BatchPlanner } from '../decorators/batch-planner.decorator';
import { PrismaService } from '../../prisma/prisma.service';

@BatchPlanner(PROBLEM_BOJ_USER)
@Injectable()
export class ProblemBojUserPlan implements BatchPlan {
  constructor(private readonly prismaService: PrismaService) {}
  async plan(
    batchDefinition: BatchDefinitionDto,
  ): Promise<CreateBatchInstanceDto[]> {
    const userUuids = await this.prismaService.userLoginHistory.findMany({
      select: {
        userUuid: true,
        User: {
          select: {
            problemSiteAccountList: {
              select: {
                handle: true,
                solvedCount: true,
                failedCount: true,
                rank: true,
              },
            },
          },
        },
      },
      where: {
        createdAt: {
          gte: new Date(new Date().setDate(new Date().getDate() - 1)),
        },
        User: {
          problemSiteAccountList: {
            some: {
              provider: 'BOJ',
            },
          },
        },
      },
      distinct: ['userUuid'],
    });

    return userUuids.map((user) => ({
      batchDefinitionNo: batchDefinition.no,
      state: 'PENDING' as const,
      data: {
        userUuid: user.userUuid,
        handle: user.User.problemSiteAccountList[0].handle,
        solvedCount: user.User.problemSiteAccountList[0].solvedCount,
        failedCount: user.User.problemSiteAccountList[0].failedCount,
      },
    }));
  }
}
