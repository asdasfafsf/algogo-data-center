import { JOB_HANDLER_MAP, JOB_STATE_MAP } from '../constants/job.constants';

export type JobHandlerKey =
  (typeof JOB_HANDLER_MAP)[keyof typeof JOB_HANDLER_MAP];

export type JobState = (typeof JOB_STATE_MAP)[keyof typeof JOB_STATE_MAP];
