export class UpdateBatchInstanceDto {
  no: number;
  state: string;
  startedAt?: Date;
  finishedAt: Date;
  elapsedTime: number;
  errorCode?: string;
  errorMessage?: string;
}
