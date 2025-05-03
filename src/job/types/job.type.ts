import { JOB_HANDLER_MAP } from '../constants/job.constants';

export type JobHandlerKey =
  (typeof JOB_HANDLER_MAP)[keyof typeof JOB_HANDLER_MAP];
