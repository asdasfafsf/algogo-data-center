import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { FlowProducer, JobNode, QueueEvents } from 'bullmq';
import { Cache } from 'cache-manager';
import { uuidv7 } from 'uuidv7';
import { BullMQConfig } from '../config/BullMQConfig';
import { ORCHESTRATOR_FLOW_PRODUCER } from './constants/injection';
import { OrchestratorRepository } from './orchestrator.repository';

@Injectable()
export class OrchestratorService {
  private readonly logger = new Logger(OrchestratorService.name);
  private queueEvents: QueueEvents;

  constructor(
    private readonly orchestratorRepository: OrchestratorRepository,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    @Inject(BullMQConfig.KEY)
    private bullmqConfig: ConfigType<typeof BullMQConfig>,
    @Inject(ORCHESTRATOR_FLOW_PRODUCER)
    private flowProducer: FlowProducer,
  ) {
    this.queueEvents = new QueueEvents(this.bullmqConfig.queueName, {
      connection: {
        host: this.bullmqConfig.host,
        port: this.bullmqConfig.port,
        password: this.bullmqConfig.password,
      },
    });
  }

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

      if (jobDefinition) {
        await this.cacheManager.set(
          `jobDefinition:${name}`,
          JSON.stringify(jobDefinition),
          60,
        );
      }
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

  async toFlatJobNode(jobOption: JobNode) {
    const jobNodes: JobNode[] = [];
    const stack = [jobOption];

    while (stack.length) {
      const jobNode = stack.pop();
      jobNodes.push(jobNode);

      if (jobNode.children) {
        stack.push(...jobNode.children);
      }
    }

    return jobNodes;
  }

  async orchestrate(name: string, data: any) {
    this.logger.log(`OrchestratorService - orchestrate - ${name}`);
    const jobDefinition = await this.getJobDefinition(name);
    const uuid = uuidv7();
    const { stepList } = jobDefinition;

    const newData: typeof data & { uuid: string } = {
      uuid,
      ...data,
    };

    const jobOption = await this.generateJob(stepList, newData);
    const jobs = await this.flowProducer.add(jobOption);
    const flatJobNodes = await this.toFlatJobNode(jobs);

    for (const jobNode of flatJobNodes) {
      try {
        await jobNode.job.waitUntilFinished(this.queueEvents);
      } catch (err) {
        return {
          state: 'FAILED',
          errorCode: err?.code,
          errorMessage: err?.message,
        };
      }
    }

    this.logger.log(`OrchestratorService - orchestrate - ${name} - 완료`);

    return {
      state: 'SUCCESS',
      data: newData,
    };
  }
}
