import { Injectable } from '@nestjs/common';
import { BatchRepository } from './batch.repository';
import { CreateBatchDefinitionDto } from './dto/create-batch-definition.dto';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { BatchDefinitionDto } from './dto/batch-definition.dto';
import { BatchPlanService } from './batch.plan.service';

@Injectable()
export class BatchService {
  constructor(
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly batchPlanService: BatchPlanService,
    private readonly batchRepository: BatchRepository,
  ) {}

  async saveBatchDefinition(batchDefinition: CreateBatchDefinitionDto) {
    await this.batchRepository.saveBatchDefinition(batchDefinition);
  }

  async findAllBatchDefinition() {
    return await this.batchRepository.findAllBatchDefinition();
  }

  async synchronizeBatchDefinition() {
    const cronJobs = this.schedulerRegistry.getCronJobs();

    for (const [name] of cronJobs) {
      this.schedulerRegistry.deleteCronJob(name);
    }

    const batchDefinitions =
      await this.batchRepository.findAllBatchDefinition();

    for (const batchDefinition of batchDefinitions) {
      await this.addSchedule(batchDefinition as BatchDefinitionDto);
    }
  }

  async addSchedule(batchDefinition: BatchDefinitionDto) {
    this.schedulerRegistry.addCronJob(
      batchDefinition.name,
      new CronJob(batchDefinition.cron, async () => {
        await this.batchPlanService.plan(batchDefinition);
      }),
    );
  }
}
