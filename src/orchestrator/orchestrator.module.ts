import { Module } from '@nestjs/common';
import { OrchestratorService } from './orchestrator.service';
import { OrchestratorRegistry } from './orchestrator-registry';
import { DiscoveryModule } from '@nestjs/core';
@Module({
  providers: [OrchestratorService, OrchestratorRegistry],
  exports: [OrchestratorService],
  imports: [DiscoveryModule],
})
export class OrchestratorModule {}
