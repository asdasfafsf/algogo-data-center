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

    const nonTargets = [
      1320, 1382, 1383, 1403, 1714, 1794, 1903, 1923, 1961, 1984, 2165, 2182,
      2308, 2368, 2400, 2746,
    ];
    const nonTargetsSet = new Set(nonTargets);
    const problemNumbers = sourceIds
      .map((problem) => Number(problem.sourceId))
      .filter((num) => !isNaN(num) && num >= 1000)
      .sort((a, b) => a - b);

    const missingProblems: number[] = [];
    const targetCount = 15;

    if (problemNumbers.length === 0) {
      let current = 1000;
      let added = 0;
      while (added < targetCount) {
        if (!nonTargetsSet.has(current)) {
          missingProblems.push(current);
          added++;
        }
        current++;
      }
    } else {
      let current = 1000;
      let problemIndex = 0;

      while (missingProblems.length < targetCount) {
        while (
          problemIndex < problemNumbers.length &&
          problemNumbers[problemIndex] < current
        ) {
          problemIndex++;
        }

        if (
          (problemIndex >= problemNumbers.length ||
            problemNumbers[problemIndex] !== current) &&
          !nonTargetsSet.has(current)
        ) {
          missingProblems.push(current);
        }

        current++;
      }
    }

    return missingProblems.map((problemNo) => ({
      batchDefinitionNo: batchDefinition.no,
      state: 'PENDING',
      data: {
        source: 'acmicpc',
        sourceId: String(problemNo),
      },
    }));
  }
}
