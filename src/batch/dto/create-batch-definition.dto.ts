import { CreateBatchStepDto } from './create-batch-step.dto';

export class CreateBatchDefinitionDto {
  name: string;
  description: string;
  cron: string;
  stepList: CreateBatchStepDto[];
}
