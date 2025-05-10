import { BatchDefinitionDto } from '../dto/batch-definition.dto';
import { CreateBatchInstanceDto } from '../dto/create-batch-instance.dto';

export interface BatchPlan {
  plan(batchDefinition: BatchDefinitionDto): Promise<CreateBatchInstanceDto[]>;
}
