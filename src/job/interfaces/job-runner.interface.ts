export interface JobRunner {
  run<T, R>(data: T): Promise<R> | R;
}
