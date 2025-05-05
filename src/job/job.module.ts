import { Module } from '@nestjs/common';
import { JobRegistry } from './job-registry';
import { DispatcherService } from './dispatcher.service';
import { DiscoveryModule } from '@nestjs/core';
import { PrismaModule } from 'src/prisma/prisma.module';
import { JobRepository } from './job.repository';
import { JobController } from './job.controller';
import { JobService } from './job.service';
@Module({
  imports: [DiscoveryModule, PrismaModule],
  providers: [JobRegistry, DispatcherService, JobRepository, JobService],
  exports: [JobRegistry, DispatcherService],
  controllers: [JobController],
})
export class JobModule {}
