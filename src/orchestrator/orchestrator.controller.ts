import { Controller, Get, Query } from '@nestjs/common';
import { OrchestratorService } from './orchestrator.service';
import { PrismaService } from 'src/prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';

@Controller('api/v1/orchestrator')
export class OrchestratorController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly orchestratorService: OrchestratorService,
  ) {}

  @Get()
  async test(@Query('problemId') problemId: string) {
    return await this.orchestratorService.orchestrate('PROBLEM_BOJ', {
      sourceId: problemId,
      source: 'acmicpc',
    });
  }

  @Get('test')
  async job() {
    return await this.processBatchRecursively();
  }

  @Get('replay')
  async replayFromFiles() {
    return await this.processFromSavedFiles();
  }

  private async processFromSavedFiles(): Promise<{
    totalProcessed: number;
    completed: boolean;
    processedFiles: number;
  }> {
    let totalProcessed = 0;
    let processedFiles = 0;

    for (let fileNumber = 1; fileNumber <= 35; fileNumber++) {
      const fileName = `requests_${fileNumber}.json`;
      const filePath = path.join(process.cwd(), fileName);

      // 파일 존재 확인
      if (!fs.existsSync(filePath)) {
        console.log(`File ${fileName} not found, skipping...`);
        continue;
      }

      try {
        // 파일 읽기
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const requests = JSON.parse(fileContent);

        console.log(
          `Processing file ${fileName} with ${requests.length} requests`,
        );

        // 순차적으로 하나씩 처리 (동기)
        for (let i = 0; i < requests.length; i++) {
          const request = requests[i];
          request.html = '';

          if (!request.subTaskList) {
            request.subTaskList = [];
          }

          if (!request.languageLimitList) {
            request.languageLimitList = [];
          }
          console.log(
            `Processing item ${totalProcessed + i + 1} from ${fileName}`,
          );
          await this.orchestratorService.orchestrate(
            'PROBLEM_BOJ_LOAD',
            request,
          );
        }

        totalProcessed += requests.length;
        processedFiles++;

        console.log(
          `Completed file ${fileName}. Total processed: ${totalProcessed}`,
        );
      } catch (error) {
        console.error(`Error processing file ${fileName}:`, error);
        continue;
      }
    }

    return {
      totalProcessed,
      completed: true,
      processedFiles,
    };
  }

  private async processBatchRecursively(): Promise<{
    totalProcessed: number;
    completed: boolean;
  }> {
    const max = 130162;
    const chunkSize = 1000; // 1000개씩 처리
    let totalProcessed = 0;
    let currentOffset = 0;
    let batchNumber = 1;

    while (true) {
      // 1000개씩 쿼리해서 가져오기
      const jobInstances = await this.prisma.jobInstance.findMany({
        select: {
          request: true,
        },
        where: {
          no: {
            gte: 1,
            lte: max,
          },
          state: 'SUCCESS',
          step: 'PROBLEM_BOJ_LOAD',
        },
        orderBy: {
          no: 'asc',
        },
        take: chunkSize,
        skip: currentOffset,
      });

      // 더 이상 데이터가 없으면 종료
      if (jobInstances.length === 0) {
        break;
      }

      // request 배열 추출
      const requests = jobInstances.map((instance) => instance.request);

      // JSON 파일로 저장
      const fileName = `requests_${batchNumber}.json`;
      const filePath = path.join(process.cwd(), fileName);

      try {
        fs.writeFileSync(filePath, JSON.stringify(requests, null, 2));
        console.log(`Saved ${fileName} with ${requests.length} requests`);
      } catch (error) {
        console.error(`Failed to save ${fileName}:`, error);
      }

      console.log(
        `Processing batch ${batchNumber} starting from offset ${currentOffset}: ${jobInstances.length} items`,
      );

      // 순차적으로 하나씩 처리 (동기)
      for (let i = 0; i < jobInstances.length; i++) {
        const elem = jobInstances[i];
        const newElem = JSON.parse(JSON.stringify(elem.request));
        newElem.html = '';

        if (!newElem.subTaskList) {
          newElem.subTaskList = [];
        }

        if (!newElem.languageLimitList) {
          newElem.languageLimitList = [];
        }
        console.log(`Processing item ${totalProcessed + i + 1}`);
        await this.orchestratorService.orchestrate('PROBLEM_BOJ_LOAD', newElem);
      }

      totalProcessed += jobInstances.length;
      currentOffset += chunkSize;
      batchNumber++;

      console.log(
        `Completed batch ${batchNumber - 1}. Total processed: ${totalProcessed}`,
      );

      // 가져온 데이터가 chunkSize보다 적으면 마지막 배치
      if (jobInstances.length < chunkSize) {
        break;
      }
    }

    return {
      totalProcessed,
      completed: true,
    };
  }
}
