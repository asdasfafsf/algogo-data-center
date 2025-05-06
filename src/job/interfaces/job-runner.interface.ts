export interface JobRunner<T, R> {
  run(data: T): Promise<R> | R;
}
