import 'reflect-metadata';

export const JOB_KEY = Symbol('JOB_KEY');

export function JobHandler(key: string) {
  return (target: (...args: any[]) => any) => {
    Reflect.defineMetadata(JOB_KEY, key, target);
  };
}
