import { Injectable } from '@nestjs/common';
import { JobRunner } from '../job/interfaces/job-runner.interface';
import { JobHandler } from '../job/decorators/job-handler.decorator';
import { PROBLEM_BOJ_PROCESS } from '../job/constants/job.constants';
import { AcmicpcResponse } from './types/acmicpc.type';
import { S3Service } from '../s3/s3.service';
import { parse } from 'node-html-parser';

@Injectable()
@JobHandler(PROBLEM_BOJ_PROCESS)
export class ProblemBojProcessJob
  implements JobRunner<AcmicpcResponse, AcmicpcResponse>
{
  constructor(private readonly s3Service: S3Service) {}

  async run(data: AcmicpcResponse) {
    const newData = { ...data };
    newData.content = await this.processImage(
      newData.content,
      `${data.source}/${data.sourceId}/content`,
    );

    newData.input = await this.processImage(
      newData.input,
      `${data.source}/${data.sourceId}/input`,
    );

    newData.output = await this.processImage(
      newData.output,
      `${data.source}/${data.sourceId}/output`,
    );

    newData.limit = await this.processImage(
      newData.limit,
      `${data.source}/${data.sourceId}/limit`,
    );

    newData.hint = await this.processImage(
      newData.hint,
      `${data.source}/${data.sourceId}/hint`,
    );

    newData.etc = await this.processImage(
      newData.etc,
      `${data.source}/${data.sourceId}/etc`,
    );

    newData.inputOutputList = await Promise.all(
      newData.inputOutputList.map(async (item) => {
        const processedContent = await this.processImage(
          item.content,
          `${data.source}/${data.sourceId}/inputoutput${item.order}`,
        );

        return {
          ...item,
          content: processedContent,
        };
      }),
    );

    return newData;
  }

  async processImage(data: string, fileName: string) {
    const node = parse(data);
    const images = node.querySelectorAll('img');
    let count = 0;
    for (const image of images) {
      const src = image.getAttribute('src');
      if (src) {
        const imageBuffer = await this.downloadImage(src);
        const newSrc = await this.s3Service.uploadFile(
          imageBuffer,
          `${fileName}_${++count}.png`,
        );
        image.setAttribute('src', newSrc.url);
      }
    }
    return node.toString();
  }

  async downloadImage(src: string) {
    const response = await fetch(src);
    const buffer = await response.arrayBuffer();
    return Buffer.from(buffer);
  }
}
