export class CreateJobInstanceDto {
  uuid: string;
  name: string;
  step: string;
  batchInstanceNo?: number;
  request: any;
}
