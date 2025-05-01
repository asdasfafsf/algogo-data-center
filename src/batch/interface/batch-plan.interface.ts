import { BatchDefinitionDto } from '../dto/batch-definition.dto';
import { BatchInstance } from '../types/batch-instance.type';

export interface BatchPlan {
  plan(batchDefinition: BatchDefinitionDto): Promise<BatchInstance<any>[]>;
}
