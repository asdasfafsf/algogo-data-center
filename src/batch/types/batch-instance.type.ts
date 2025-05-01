export type BatchInstance<T> = {
  no: number;
  batchDefinitionNo: number;
  state: string;
  createdAt: Date;
  updatedAt: Date;
  startedAt: Date;
  finishedAt: Date;
  elapsedTime: number;
  data: T;
};
