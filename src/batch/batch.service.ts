import { Injectable } from '@nestjs/common';
import { BatchRepository } from './batch.repository';
import { JobHandler } from 'src/common/decorators/job-handler.decorator';
import { PrismaTransaction } from 'src/prisma/decorators/prisma-transaction.decorator';
@Injectable()
@JobHandler('PROBLEM_BOJ_COLLECT')
export class BatchService {
  constructor(private readonly batchRepository: BatchRepository) {}

  @PrismaTransaction()
  async registerBatch() {}
  async createBatch() {}
  async getBatch() {}
  async updateBatch() {}
  async deleteBatch() {}
}
