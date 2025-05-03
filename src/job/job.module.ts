import { Module } from '@nestjs/common';
import { JobRegistry } from './job-registry';
import { DispatcherService } from './dispatcher.service';
import { DiscoveryModule } from '@nestjs/core';
import { PrismaModule } from 'src/prisma/prisma.module';
@Module({
  imports: [DiscoveryModule, PrismaModule],
  providers: [JobRegistry, DispatcherService],
  exports: [JobRegistry, DispatcherService],
})
export class JobModule {}
