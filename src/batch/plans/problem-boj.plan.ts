import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PROBLEM_BOJ } from '../constants/batch-plan.constant';
import { BatchPlanner } from '../decorators/batch-planner.decorator';
import { BatchDefinitionDto } from '../dto/batch-definition.dto';
import { BatchPlan } from '../interfaces/batch-plan.interface';

@BatchPlanner(PROBLEM_BOJ)
@Injectable()
export class ProblemBojPlan implements BatchPlan {
  constructor(private readonly prismaService: PrismaService) {}

  async plan(batchDefinition: BatchDefinitionDto) {
    const lastProblemBoj = await this.prismaService.problemV2.findFirst({
      select: {
        sourceId: true,
      },
      orderBy: {
        no: 'desc',
      },
    });

    const lastProblemBojNo = lastProblemBoj?.sourceId ?? '1000';
    const lastProblemBojNoInt = parseInt(lastProblemBojNo);

    return [
      {
        batchDefinitionNo: batchDefinition.no,
        state: 'PENDING',
        data: {
          source: 'acmicpc',
          sourceId: String(lastProblemBojNoInt + 1),
        },
      },
    ];
  }
}
