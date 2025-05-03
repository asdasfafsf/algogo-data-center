import 'reflect-metadata';
import { DiscoveryService } from '@nestjs/core';
import { JobHandlerKey } from '../types/job.type';

export const JobHandler = DiscoveryService.createDecorator<JobHandlerKey>();
