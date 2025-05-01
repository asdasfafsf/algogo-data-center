import { Injectable, OnModuleInit } from '@nestjs/common';
import { DiscoveryService } from '@nestjs/core';
import { BatchPlanner } from './decorators/batch-planner.decorator';
import { BatchPlan } from './interface/batch-plan.interface';
@Injectable()
export class BatchPlanRegistry implements OnModuleInit {
  private readonly batchPlans = new Map<string, BatchPlan>();

  constructor(private readonly discoveryService: DiscoveryService) {}
  async onModuleInit() {
    await this.register();
  }

  async register() {
    const wrappers = this.discoveryService.getProviders();
    const batchPlanEntries = wrappers
      .map((wrapper) => {
        const key = this.discoveryService.getMetadataByDecorator(
          BatchPlanner,
          wrapper,
        );
        return { key, instance: wrapper.instance as BatchPlan };
      })
      .filter((entry) => entry.key && entry.instance);

    for (const { key, instance } of batchPlanEntries) {
      this.batchPlans.set(key, instance);
    }
  }

  get(key: string): BatchPlan {
    return this.batchPlans.get(key);
  }
}
