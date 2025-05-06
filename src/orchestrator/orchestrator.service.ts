import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { OrchestratorRepository } from './orchestrator.repository';
import { uuidv7 } from 'uuidv7';
import { FlowProducer } from 'bullmq';
import { BullMQConfig } from '../config/BullMQConfig';
import { ConfigType } from '@nestjs/config';
import { ORCHESTRATOR_FLOW_PRODUCER } from './constants/injection';

@Injectable()
export class OrchestratorService {
  constructor(
    private readonly orchestratorRepository: OrchestratorRepository,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    @Inject(BullMQConfig.KEY)
    private bullmqConfig: ConfigType<typeof BullMQConfig>,
    @Inject(ORCHESTRATOR_FLOW_PRODUCER)
    private flowProducer: FlowProducer,
  ) {}

  async getJobDefinition(name: string) {
    const jobDefinitionStr = await this.cacheManager.get(
      `jobDefinition:${name}`,
    );

    let jobDefinition: Awaited<
      ReturnType<typeof this.orchestratorRepository.findJobDefinition>
    >;

    if (!jobDefinitionStr) {
      jobDefinition = await this.orchestratorRepository.findJobDefinition({
        name,
      });
      await this.cacheManager.set(
        `jobDefinition:${name}`,
        JSON.stringify(jobDefinition),
      );
    } else {
      jobDefinition = JSON.parse(jobDefinitionStr as string);
    }

    if (!jobDefinition) {
      throw new NotFoundException(`Job definition not found: ${name}`);
    }

    return jobDefinition;
  }

  async generateJob(stepList: any[], data: any) {
    const stack = [...stepList].reverse();

    let jobOption = null;
    while (stack.length) {
      const step = stack.pop();

      jobOption = {
        name: step.name,
        queueName: this.bullmqConfig.queueName,
        data,
        children: jobOption ? [jobOption] : undefined,
        opts: {
          removeOnComplete: true,
          removeOnFail: true,
          failParentOnFailure: true,
        },
      };
    }

    return jobOption;
  }

  async orchestrate(name: string, data: any) {
    const jobDefinition = await this.getJobDefinition(name);
    const uuid = uuidv7();
    const { stepList } = jobDefinition;

    const newData: typeof data & { uuid: string } = {
      uuid,
      ...data,
    };

    const jobOption = await this.generateJob(stepList, newData);
    await this.flowProducer.add(jobOption);
  }
}
