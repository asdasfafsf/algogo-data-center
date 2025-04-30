import { Module, OnModuleInit } from '@nestjs/common';
import { JobRegistry } from '../job/job-registry';
import { DiscoveryModule } from '@nestjs/core';
import { DispatcherService } from '../job/dispatcher.service';
import { BatchService } from './batch.service';
import { BatchRepository } from './batch.repository';
import { PrismaModule } from '../prisma/prisma.module';
@Module({
  imports: [DiscoveryModule, PrismaModule],
  providers: [JobRegistry, DispatcherService, BatchService, BatchRepository],
  exports: [DispatcherService, JobRegistry],
})
export class BatchModule implements OnModuleInit {
  constructor() {}
  onModuleInit() {}
}
