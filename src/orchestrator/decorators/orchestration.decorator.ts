import { DiscoveryService } from '@nestjs/core';
import { OrchestratorKey } from '../types/orchestrator.type';

export const Orchestration =
  DiscoveryService.createDecorator<OrchestratorKey>();
