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
    const sourceIds = await this.prismaService.problemV2.findMany({
      select: {
        sourceId: true,
      },
    });

    const problemNumbers = sourceIds
      .map((problem) => Number(problem.sourceId))
      .filter((num) => !isNaN(num))
      .sort((a, b) => a - b);

    let problemNo: number;

    if (problemNumbers.length === 0) {
      problemNo = 1000;
    } else {
      let foundGap = false;
      let prev = problemNumbers[0];

      for (let i = 1; i < problemNumbers.length; i++) {
        const current = problemNumbers[i];
        if (current - prev > 1) {
          problemNo = prev + 1;
          foundGap = true;
          break;
        }
        prev = current;
      }

      if (!foundGap) {
        problemNo = problemNumbers.at(-1) + 1;
      }
    }

    return [
      {
        batchDefinitionNo: batchDefinition.no,
        state: 'PENDING',
        data: {
          source: 'acmicpc',
          sourceId: String(problemNo),
        },
      },
    ];
  }
}
