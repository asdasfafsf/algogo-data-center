import { Injectable, OnModuleInit } from '@nestjs/common';
import { DiscoveryService } from '@nestjs/core';
import { JobHandler } from './decorators/job-handler.decorator';
import { JobRunner } from './interfaces/job-runner.interface';
import { JobKey } from 'src/job/types/job.type';

@Injectable()
export class JobRegistry implements OnModuleInit {
  private readonly jobs = new Map<string, JobRunner>();

  constructor(private readonly discoveryService: DiscoveryService) {}

  async onModuleInit() {
    await this.registerJobs();
  }

  private async registerJobs() {
    const wrappers = this.discoveryService.getProviders();
    const jobEntries = wrappers
      .map((wrapper) => {
        const key = this.discoveryService.getMetadataByDecorator(
          JobHandler,
          wrapper,
        );
        return { key, instance: wrapper.instance as JobRunner };
      })
      .filter((entry) => entry.key && entry.instance);

    for (const { key, instance } of jobEntries) {
      this.jobs.set(key, instance);
    }
  }

  get(key: JobKey): JobRunner {
    const runner = this.jobs.get(key);
    return runner;
  }
}
