import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBatchDefinitionDto } from './dto/create-batch-definition.dto';
import { CreateBatchInstanceDto } from './dto/create-batch-instance.dto';
import { UpdateBatchInstanceDto } from './dto/update-batch-instance.dto';
@Injectable()
export class BatchRepository {
  constructor(private readonly prisma: PrismaService) {}

  async saveBatchDefinition(batchDefinition: CreateBatchDefinitionDto) {
    await this.prisma.batchDefinition.create({
      data: {
        name: batchDefinition.name,
        cron: batchDefinition.cron,
        description: batchDefinition.description,
      },
    });
  }

  async findAllBatchDefinition() {
    return await this.prisma.batchDefinition.findMany();
  }

  async createBatchInstance(batchInstance: CreateBatchInstanceDto) {
    return await this.prisma.batchInstance.create({
      data: {
        batchDefinitionNo: batchInstance.batchDefinitionNo,
        updatedAt: new Date(),
        state: batchInstance.state,
        data: batchInstance.data,
      },
    });
  }

  async updateBatchInstance(batchInstance: UpdateBatchInstanceDto) {
    return await this.prisma.batchInstance.update({
      select: {
        no: true,
      },
      where: { no: batchInstance.no },
      data: {
        state: batchInstance.state,
        finishedAt: batchInstance.finishedAt,
        elapsedTime: batchInstance.elapsedTime,
        errorCode: batchInstance.errorCode,
        errorMessage: batchInstance.errorMessage,
      },
    });
  }
}
