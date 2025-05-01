import { Injectable } from '@nestjs/common';
import { OrchestratorKey } from './types/orchestrator.type';
import { OrchestratorRegistry } from './orchestrator-registry';
@Injectable()
export class OrchestratorService {
  constructor(private readonly orchestratorRegistry: OrchestratorRegistry) {}

  async orchestrate(key: OrchestratorKey, data: any) {
    try {
      const orchestrator = this.orchestratorRegistry.get(key);
      return orchestrator.orchestrate(data);
    } catch {}
  }
}
