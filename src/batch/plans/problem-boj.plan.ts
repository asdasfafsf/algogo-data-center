import { BatchDefinitionDto } from '../dto/batch-definition.dto';
import { BatchPlan } from '../interfaces/batch-plan.interface';

export class ProblemBojPlan implements BatchPlan {
  constructor() {}

  async plan(batchDefinition: BatchDefinitionDto) {
    return [];
  }
}
