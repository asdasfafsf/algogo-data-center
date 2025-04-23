import { JOB_KEY } from '../constants/job.constants';

export type JobKey = (typeof JOB_KEY)[keyof typeof JOB_KEY];
