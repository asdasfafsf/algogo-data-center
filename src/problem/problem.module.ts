import { Module } from '@nestjs/common';
import { NemoModule } from '../nemo/nemo.module';
import { PrismaModule } from '../prisma/prisma.module';
import { S3Module } from '../s3/s3.module';
import { ProblemBojCollectJob } from './problem-boj-collect.job';
import { ProblemBojLoadJob } from './problem-boj-load.job';
import { ProblemBojProcessJob } from './problem-boj-process.job';
import { ProblemBojTodayJob } from './problem-boj-today.job';
import { ProblemBojSolvedUserJob } from './problem-boj-solved-user.job';
import { ProblemAcmicpcUserJob } from './problem-boj-acmicpc-user.job';

@Module({
  imports: [NemoModule, PrismaModule, S3Module],
  providers: [
    ProblemBojCollectJob,
    ProblemBojProcessJob,
    ProblemBojLoadJob,
    ProblemBojTodayJob,
    ProblemBojSolvedUserJob,
    ProblemAcmicpcUserJob,
  ],
})
export class ProblemModule {}
