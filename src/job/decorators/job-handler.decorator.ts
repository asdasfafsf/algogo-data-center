import 'reflect-metadata';
import { DiscoveryService } from '@nestjs/core';
import { JobKey } from '../types/job.type';

export const JobHandler = DiscoveryService.createDecorator<JobKey>();
