import { OrchestratorKey } from 'src/orchestrator/types/orchestrator.type';
import { CreateBatchStepDto } from './create-batch-step.dto';

export class CreateBatchDefinitionDto {
  name: OrchestratorKey;
  description: string;
  cron: string;
  stepList: CreateBatchStepDto[];
}
