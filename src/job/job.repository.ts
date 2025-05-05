import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpsertJobInstanceDto } from './dto/upsert-job-instance.dto';
import { CreateJobDefinitionDto } from './dto/create-job-definition.dto';
@Injectable()
export class JobRepository {
  constructor(private readonly prisma: PrismaService) {}

  async upsertJobInstance(data: UpsertJobInstanceDto) {
    const jobInstance = await this.prisma.jobInstance.upsert({
      select: {
        uuid: true,
      },
      where: {
        uuid_name: {
          uuid: data.uuid,
          name: data.name,
        },
      },
      update: {
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

  async createJobDefinition(data: CreateJobDefinitionDto) {
    const jobDefinition = await this.prisma.jobDefinition.create({
      select: {
        no: true,
        name: true,
        description: true,
        createdAt: true,
        updatedAt: true,
        stepList: {
          select: {
            no: true,
            order: true,
            name: true,
            description: true,
            createdAt: true,
            updatedAt: true,
          },
          orderBy: {
            order: 'asc',
          },
        },
      },
      data: {
        name: data.name,
        description: data.description,
        stepList: {
          create: data.stepList.map((step) => ({
            order: step.order,
            name: step.name,
            description: step.description,
          })),
        },
      },
    });

    return jobDefinition;
  }

  async deleteJobDefinition(no: number) {
    await this.prisma.jobDefinition.delete({
      where: {
        no,
      },
    });
  }

  async findAllJobDefinition() {
    return this.prisma.jobDefinition.findMany({
      select: {
        no: true,
        name: true,
        description: true,
        createdAt: true,
        updatedAt: true,
        stepList: {
          select: {
            no: true,
            order: true,
            name: true,
            description: true,
            createdAt: true,
            updatedAt: true,
          },
          orderBy: {
            order: 'asc',
          },
        },
      },
    });
  }

  async findJobDefinitionByNo(no: number) {
    return this.prisma.jobDefinition.findUnique({
      select: {
        no: true,
        name: true,
        description: true,
        createdAt: true,
        updatedAt: true,
        stepList: {
          select: {
            no: true,
            order: true,
            name: true,
            description: true,
            createdAt: true,
            updatedAt: true,
          },
          orderBy: {
            order: 'asc',
          },
        },
      },
      where: {
        no,
      },
    });
  }
}
