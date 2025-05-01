import { BatchStepDto } from './batch-step.dto';
import { OrchestratorKey } from 'src/orchestrator/types/orchestrator.type';
export class BatchDefinitionDto {
  no: number;
  name: OrchestratorKey;
  cron: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
  stepList: BatchStepDto[];
}
