import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBatchDefinitionDto } from './dto/create-batch-definition.dto';
@Injectable()
export class BatchRepository {
  constructor(private readonly prisma: PrismaService) {}

  async saveBatchDefinition(batchDefinition: CreateBatchDefinitionDto) {
    await this.prisma.batchDefinition.create({
      data: {
        name: batchDefinition.name,
        cron: batchDefinition.cron,
        description: batchDefinition.description,
        stepList: {
          create: batchDefinition.stepList,
        },
      },
    });
  }

  async findAllBatchDefinition() {
    return await this.prisma.batchDefinition.findMany({
      include: {
        stepList: true,
      },
    });
  }
}
