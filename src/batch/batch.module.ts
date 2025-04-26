import { Module } from '@nestjs/common';
import { JobRegistry } from './job-registry';
import { DiscoveryModule } from '@nestjs/core';
import { DispatcherService } from './dispatcher.service';
@Module({
  imports: [DiscoveryModule],
  providers: [JobRegistry, DispatcherService],
  exports: [DispatcherService],
})
export class BatchModule {}
