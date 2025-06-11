import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TODAY_PROBLEM_BOJ } from '../constants/batch-plan.constant';
import { BatchPlanner } from '../decorators/batch-planner.decorator';
import { BatchDefinitionDto } from '../dto/batch-definition.dto';
import { CreateBatchInstanceDto } from '../dto/create-batch-instance.dto';
import { BatchPlan } from '../interfaces/batch-plan.interface';

@BatchPlanner(TODAY_PROBLEM_BOJ)
@Injectable()
export class TodayProblemBojPlan implements BatchPlan {
  constructor(private readonly prismaService: PrismaService) {}
  async plan(
    batchDefinition: BatchDefinitionDto,
  ): Promise<CreateBatchInstanceDto[]> {
    const problems = await this.prismaService.todayProblem.findMany({
      where: {
        servedAt: {
          gte: new Date(batchDefinition),
        },
      },
    });

    return [
      {
        batchDefinitionNo: batchDefinition.no,
        state: 'PENDING',
        data: 7,
      },
    ];
  }
}
