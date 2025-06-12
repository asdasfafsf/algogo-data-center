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
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const result = await this.prismaService.$queryRaw<{ day_index: number }[]>`
      WITH RECURSIVE date_series AS (
        SELECT 0 AS day_index, DATE(${today}) AS target_date
        UNION ALL
        SELECT day_index + 1, DATE_ADD(DATE(${today}), INTERVAL day_index + 1 DAY)
        FROM date_series
        WHERE day_index < 6
      )
      SELECT ds.day_index
      FROM date_series ds
      LEFT JOIN TODAY_PROBLEM tp ON DATE(tp.TODAY_PROBLEM_SERVED_AT) = ds.target_date
      WHERE tp.TODAY_PROBLEM_NO IS NULL
      ORDER BY ds.day_index
    `;

    const emptyDays = result.map((row) => row.day_index);

    return [
      {
        batchDefinitionNo: batchDefinition.no,
        state: 'PENDING',
        data: emptyDays,
      },
    ];
  }
}
