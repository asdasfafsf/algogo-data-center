export class UpsertJobInstanceDto {
  uuid: string;
  name?: string;
  step?: string;
  batchInstanceNo?: number;
  startedAt?: Date;
  finishedAt?: Date;
  elapsedTime?: number;
  state: 'RUNNING' | 'SUCCESS' | 'FAILED';
  request?: any;
  result?: any;
  errorCode?: string;
  errorMessage?: string;
}
