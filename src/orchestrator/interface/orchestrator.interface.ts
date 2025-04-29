export interface Orchestrator {
  orchestrate<T, R>(data: T): Promise<R>;
}
