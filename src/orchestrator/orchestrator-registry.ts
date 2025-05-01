import { Injectable, OnModuleInit } from '@nestjs/common';
import { DiscoveryService } from '@nestjs/core';
import { Orchestrator as OrchestratorInterface } from './interface/orchestrator.interface';
import { OrchestratorKey } from './types/orchestrator.type';
import { Orchestration } from './decorators/orchestration.decorator';

@Injectable()
export class OrchestratorRegistry implements OnModuleInit {
  private readonly orchestrators = new Map<string, OrchestratorInterface>();

  constructor(private readonly discoveryService: DiscoveryService) {}

  async onModuleInit() {
    await this.registerOrchestrators();
  }

  private async registerOrchestrators() {
    const wrappers = this.discoveryService.getProviders();
    const orchestratorEntries = wrappers
      .map((wrapper) => {
        const key = this.discoveryService.getMetadataByDecorator(
          Orchestration,
          wrapper,
        );
        return { key, instance: wrapper.instance as OrchestratorInterface };
      })
      .filter((entry) => entry.key && entry.instance);

    for (const { key, instance } of orchestratorEntries) {
      this.orchestrators.set(key, instance);
    }
  }

  get(key: OrchestratorKey): OrchestratorInterface {
    const orchestrator = this.orchestrators.get(key);
    return orchestrator;
  }
}
