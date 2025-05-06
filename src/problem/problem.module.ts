import { Module } from '@nestjs/common';
import { ProblemBojCollectJob } from './problem-boj-collect.job';
import { NemoModule } from '../nemo/nemo.module';
import { ProblemBojProcessJob } from './problem-boj-process.job';
import { PrismaModule } from '../prisma/prisma.module';
import { ProblemBojLoadJob } from './problem-boj-load.job';
import { S3Module } from '../s3/s3.module';

@Module({
  imports: [NemoModule, PrismaModule, S3Module],
  providers: [ProblemBojCollectJob, ProblemBojProcessJob, ProblemBojLoadJob],
})
export class ProblemModule {}
