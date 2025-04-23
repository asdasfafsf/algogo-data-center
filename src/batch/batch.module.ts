import { Module } from '@nestjs/common';
import { JobRegistry } from './job-registry';
import { DiscoveryModule } from '@nestjs/core';

@Module({
  imports: [DiscoveryModule],
  providers: [JobRegistry],
})
export class BatchModule {}
