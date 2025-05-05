import { Module } from '@nestjs/common';
import { ProblemBojCollectJob } from './problem-boj-collect.job';
import { NemoModule } from '../nemo/nemo.module';
import { ProblemBojProcessJob } from './problem-boj-process.job';
import { PrismaModule } from '../prisma/prisma.module';
import { ProblemBojLoadJob } from './problem-boj-load.job';

@Module({
  imports: [NemoModule, PrismaModule],
  providers: [ProblemBojCollectJob, ProblemBojProcessJob, ProblemBojLoadJob],
})
export class ProblemModule {}
