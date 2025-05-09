import { Injectable } from '@nestjs/common';
import { BatchDefinitionDto } from './dto/batch-definition.dto';
import { BatchPlanRegistry } from './batch-plan.registry';
import { BatchRepository } from './batch.repository';

@Injectable()
export class BatchPlanService {
  constructor(
    private readonly batchRepository: BatchRepository,
    private readonly batchPlanRegistry: BatchPlanRegistry,
  ) {}

  async plan(batchDefinition: BatchDefinitionDto) {
    try {
      const batchPlan = this.batchPlanRegistry.get(batchDefinition.name);

      if (!batchPlan) {
        throw new Error(`Batch plan ${batchDefinition.name} not found`);
      }

      const planList = await batchPlan.plan(batchDefinition);
      const batchInstanceList = [];

      for (const plan of planList) {
        const batchInstance =
          await this.batchRepository.createBatchInstance(plan);
        batchInstanceList.push(batchInstance);
      }
      return batchInstanceList;
    } catch {
      return [];
    }
  }
}
