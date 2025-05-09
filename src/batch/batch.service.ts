import { Injectable } from '@nestjs/common';
import { BatchRepository } from './batch.repository';
import { CreateBatchDefinitionDto } from './dto/create-batch-definition.dto';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { BatchDefinitionDto } from './dto/batch-definition.dto';
import { BatchPlanService } from './batch.plan.service';
import { OrchestratorService } from '../orchestrator/orchestrator.service';
import { getElapsedTime } from '../common/date';

@Injectable()
export class BatchService {
  constructor(
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly batchPlanService: BatchPlanService,
    private readonly batchRepository: BatchRepository,
    private readonly orchestratorService: OrchestratorService,
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
        const batchPlanList = await this.batchPlanService.plan(batchDefinition);

        for (const batchPlan of batchPlanList) {
          await this.executeBatch(batchPlan);
        }
      }),
    );
  }

  async executeBatch(batchPlan: any) {
    const startedAt = new Date();
    this.orchestratorService
      .orchestrate(batchPlan.name, batchPlan)
      .then(async (result) => {
        const finishedAt = new Date();
        const elapsedTime = getElapsedTime(startedAt, finishedAt);

        await this.batchRepository.updateBatchInstance({
          no: batchPlan.no,
          state: result.state,
          startedAt,
          finishedAt,
          elapsedTime,
          errorCode: result.errorCode,
          errorMessage: result.errorMessage,
        });
      })
      .catch(async (error) => {
        const finishedAt = new Date();
        const elapsedTime = getElapsedTime(startedAt, finishedAt);
        console.error(error);

        await this.batchRepository.updateBatchInstance({
          no: batchPlan.no,
          state: 'FAILED',
          startedAt,
          finishedAt,
          elapsedTime,
          errorCode: error.code,
          errorMessage: error.message,
        });
      });
  }
}
