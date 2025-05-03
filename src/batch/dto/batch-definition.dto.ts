import { BatchStepDto } from './batch-step.dto';

export class BatchDefinitionDto {
  name: string;
  cron: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
  stepList: BatchStepDto[];
}
