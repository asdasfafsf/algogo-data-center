import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
@Injectable()
export class OrchestratorRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findJobDefinition({ name }: { name: string }) {
    const jobDefinition = await this.prisma.jobDefinition.findUnique({
      where: {
        name,
      },
      select: {
        no: true,
        name: true,
        stepList: {
          select: {
            name: true,
            description: true,
            order: true,
          },
          orderBy: {
            order: 'asc',
          },
        },
      },
    });

    return {
      ...jobDefinition,
      stepList: jobDefinition.stepList.sort((a, b) => a.order - b.order),
    };
  }
}
