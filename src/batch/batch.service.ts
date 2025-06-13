import { Injectable, Logger } from '@nestjs/common';
import { BatchRepository } from './batch.repository';
import { CreateBatchDefinitionDto } from './dto/create-batch-definition.dto';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { BatchDefinitionDto } from './dto/batch-definition.dto';
import { BatchPlanService } from './batch-plan.service';
import { OrchestratorService } from '../orchestrator/orchestrator.service';
import { getElapsedTime } from '../common/date';
import { BatchInstanceDto } from './dto/batch-instance.dto';

@Injectable()
export class BatchService {
  private readonly logger = new Logger(BatchService.name);

  constructor(
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly batchPlanService: BatchPlanService,
    private readonly batchRepository: BatchRepository,
    private readonly orchestratorService: OrchestratorService,
  ) {}

  async saveBatchDefinition(batchDefinition: CreateBatchDefinitionDto) {
    await this.batchRepository.saveBatchDefinition(batchDefinition);
    await this.synchronizeBatchDefinition();
  }

  async deleteBatchDefinition(no: number) {
    await this.batchRepository.deleteBatchDefinition(no);
    await this.synchronizeBatchDefinition();
  }

  async findAllBatchDefinition() {
    return await this.batchRepository.findAllBatchDefinition();
  }

  async synchronizeBatchDefinition() {
    this.logger.log('BatchService - synchronizeBatchDefinition');
    const cronJobs = this.schedulerRegistry.getCronJobs();

    for (const [name] of cronJobs) {
      this.schedulerRegistry.deleteCronJob(name);
    }

    const batchDefinitions =
      await this.batchRepository.findAllBatchDefinition();

    for (const batchDefinition of batchDefinitions) {
      this.logger.log(
        `BatchService - synchronizeBatchDefinition - ${batchDefinition.name}`,
      );
      await this.addSchedule(batchDefinition as BatchDefinitionDto);
    }
  }

  async addSchedule(batchDefinition: BatchDefinitionDto) {
    this.logger.log(`BatchService - addSchedule - ${batchDefinition.name}`);
    this.logger.log(batchDefinition);

    const cronJob = new CronJob(batchDefinition.cron, () => {
      this.batchPlanService
        .plan(batchDefinition)
        .then((batchPlanList) => {
          this.logger.log('start execute batch');
          for (const batchPlan of batchPlanList) {
            this.logger.log(batchPlan);
            this.executeBatch({
              ...batchPlan,
              jobName: batchDefinition.jobName,
            });
          }
        })
        .catch((error) => {
          this.logger.error(error);
        });
    });

    this.schedulerRegistry.addCronJob(batchDefinition.name, cronJob);
    cronJob.start();

    this.logger.log(
      `BatchService - addSchedule - ${batchDefinition.name} - 완료`,
    );
  }

  async executeBatch(
    batchPlan: BatchInstanceDto & { name: string; jobName: string },
  ) {
    this.logger.log(`BatchService - executeBatch - ${batchPlan.name}`);
    const startedAt = new Date();
    this.orchestratorService
      .orchestrate(batchPlan.jobName, batchPlan.data)
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

        this.batchRepository
          .updateBatchInstance({
            no: batchPlan.no,
            state: 'FAILED',
            startedAt,
            finishedAt,
            elapsedTime,
            errorCode: error.code,
            errorMessage: error.message,
          })
          .catch((error) => console.log(error));
      });
  }
}
