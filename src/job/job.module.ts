import { Module } from '@nestjs/common';
import { JobRegistry } from './job-registry';
import { DispatcherService } from './dispatcher.service';
import { DiscoveryModule } from '@nestjs/core';
@Module({
  imports: [DiscoveryModule],
  providers: [JobRegistry, DispatcherService],
  exports: [JobRegistry, DispatcherService],
})
export class JobModule {}
