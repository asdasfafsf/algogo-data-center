export type NemoResponse<T> = {
  code: string;
  message: string;
  techMessage: string;
  data: T;
};
