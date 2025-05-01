import { DiscoveryService } from '@nestjs/core';
import { BatchPlan } from '../types/batch-plan.type';

export const BatchPlanner = DiscoveryService.createDecorator<BatchPlan>();
