import { Injectable } from '@nestjs/common';
import { BatchRepository } from './batch.repository';
import { CreateBatchDefinitionDto } from './dto/create-batch-definition.dto';

@Injectable()
export class BatchService {
  constructor(private readonly batchRepository: BatchRepository) {}

  async saveBatchDefinition(batchDefinition: CreateBatchDefinitionDto) {
    await this.batchRepository.saveBatchDefinition(batchDefinition);
  }

  async findAllBatchDefinition() {
    return await this.batchRepository.findAllBatchDefinition();
  }
}
