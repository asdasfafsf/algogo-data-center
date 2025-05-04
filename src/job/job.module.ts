import { Module } from '@nestjs/common';
import { JobRegistry } from './job-registry';
import { DispatcherService } from './dispatcher.service';
import { DiscoveryModule } from '@nestjs/core';
import { PrismaModule } from 'src/prisma/prisma.module';
import { JobRepository } from './job.repository';
@Module({
  imports: [DiscoveryModule, PrismaModule],
  providers: [JobRegistry, DispatcherService, JobRepository],
  exports: [JobRegistry, DispatcherService],
})
export class JobModule {}
