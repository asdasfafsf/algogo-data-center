export type NemoRequest<T> = {
  key1: string;
  key2: string;
  config: NemoRequestConfig;
  data: T;
};

export type NemoRequestConfig = {
  timeout?: number;
  memory?: number;
};
