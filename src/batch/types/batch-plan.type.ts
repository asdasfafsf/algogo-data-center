import { BATCH_PLAN_MAP } from '../constants/batch-plan.constant';

export type BatchPlan = (typeof BATCH_PLAN_MAP)[keyof typeof BATCH_PLAN_MAP];
