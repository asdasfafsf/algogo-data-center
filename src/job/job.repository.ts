import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpsertJobInstanceDto } from './dto/upsert-job-instance.dto';

@Injectable()
export class JobRepository {
  constructor(private readonly prisma: PrismaService) {}

  async upsertJobInstance(data: UpsertJobInstanceDto) {
    const jobInstance = await this.prisma.jobInstance.upsert({
      select: {
        uuid: true,
      },
      where: {
        uuid: data.uuid,
      },
      update: {
        startedAt: data.startedAt,
        finishedAt: data.finishedAt,
        elapsedTime: data.elapsedTime,
        state: data.state,
        request: data.request,
        result: data.result,
        errorCode: data.errorCode,
        errorMessage: data.errorMessage,
      },
      create: {
        uuid: data.uuid,
        name: data.name,
        step: data.step,
        batchInstanceNo: data.batchInstanceNo,
        startedAt: data.startedAt,
        state: data.state,
        request: data.request,
        result: data.result,
        errorCode: data.errorCode,
        errorMessage: data.errorMessage,
      },
    });

    return jobInstance;
  }
}
