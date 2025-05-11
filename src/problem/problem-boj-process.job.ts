import { Injectable } from '@nestjs/common';
import { JobRunner } from '../job/interfaces/job-runner.interface';
import { JobHandler } from '../job/decorators/job-handler.decorator';
import { PROBLEM_BOJ_PROCESS } from '../job/constants/job.constants';
import { AcmicpcResponse } from './types/acmicpc.type';
import { S3Service } from '../s3/s3.service';
import { parse } from 'node-html-parser';
import * as path from 'path';

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
        const extName = path.extname(src) || '.png';
        const newSrc = await this.s3Service.uploadFile(
          imageBuffer,
          `${fileName}_${++count}${extName}`,
        );
        image.setAttribute('src', newSrc.url);
      }
    }
    return node.toString();
  }

  async downloadImage(src: string) {
    const requestHeaders = {
      accept:
        'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
      'accept-language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
      'cache-control': 'no-cache',
      pragma: 'no-cache',
      priority: 'u=0, i',
      'sec-ch-ua':
        '"Google Chrome";v="125", "Chromium";v="125", "Not.A/Brand";v="24"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"macOS"',
      'sec-fetch-dest': 'document',
      'sec-fetch-mode': 'navigate',
      'sec-fetch-site': 'same-origin',
      'sec-fetch-user': '?1',
      'upgrade-insecure-requests': '1',
      referrer: 'https://www.acmicpc.net/',
      referrerPolicy: 'strict-origin',
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36 Edg/125.0.0.0',
    };
    if (!src.startsWith('http')) {
      src = `https://acmicpc.net/${src}`;
    }
    const response = await fetch(src, {
      headers: requestHeaders,
      method: 'GET',
    });
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }
}
