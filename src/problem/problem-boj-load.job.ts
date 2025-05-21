import { Injectable } from '@nestjs/common';
import { JobRunner } from '../job/interfaces/job-runner.interface';
import { JobHandler } from '../job/decorators/job-handler.decorator';
import { PROBLEM_BOJ_LOAD } from '../job/constants/job.constants';
import { AcmicpcResponse } from './types/acmicpc.type';
import { PrismaService } from '../prisma/prisma.service';
import { PrismaTransaction } from 'src/prisma/decorators/prisma-transaction.decorator';
@Injectable()
@JobHandler(PROBLEM_BOJ_LOAD)
export class ProblemBojLoadJob
  implements JobRunner<AcmicpcResponse, AcmicpcResponse>
{
  constructor(private readonly prisma: PrismaService) {}

  @PrismaTransaction()
  async run(data: AcmicpcResponse) {
    const problem = await this.prisma.problemV2.findUnique({
      where: {
        source_sourceId: {
          source: 'BOJ',
          sourceId: data.sourceId,
        },
      },
    });

    if (problem) {
      await this.prisma.problemV2Type.deleteMany({
        where: {
          problemUuid: problem.uuid,
        },
      });
      await this.prisma.problemV2InputOutput.deleteMany({
        where: {
          problemUuid: problem.uuid,
        },
      });

      await this.prisma.problemV2SubTask.deleteMany({
        where: {
          problemUuid: problem.uuid,
        },
      });
    }

    await this.prisma.problemV2.upsert({
      where: {
        source_sourceId: {
          source: 'BOJ',
          sourceId: data.sourceId,
        },
      },
      create: {
        source: 'BOJ',
        sourceId: data.sourceId,
        title: data.title,
        input: data.input,
        output: data.output,
        etc: data.etc,
        level: data.level,
        levelText: data.levelText,
        answerRate: data.answerRate,
        submitCount: data.submitCount,
        timeout: data.timeout,
        memoryLimit: data.memoryLimit,
        answerCount: data.answerCount,
        answerPeopleCount: data.answerPeopleCount,
        sourceUrl: data.sourceUrl,
        content: data.content,
        limit: data.limit,
        hint: data.hint,
        subTask: data.subTask,
        isSpecialJudge: data.isSpecialJudge,
        isSubTask: data.isSubTask,
        isFunction: data.isFunction,
        isInteractive: data.isInteractive,
        isTwoStep: data.isTwoStep,
        isClass: data.isClass,
        inputOutputList: {
          create: data.inputOutputList.map((inputOutput, index) => ({
            input: inputOutput.input,
            output: inputOutput.output,
            content: inputOutput.content,
            order: index,
          })),
        },
        subTaskList: {
          create: data.subTaskList.map((subTask) => ({
            order: subTask.order,
            title: subTask.title,
            content: subTask.content,
          })),
        },
        customExample: data.customExample,
        customImplementation: data.customImplementation,
        customGrader: data.customGrader,
        customNotes: data.customNotes,
        customAttachment: data.customAttachment,
        problemSource: data.problemSource,
        customSample: data.customSample,
        languageLimitList: {
          create: data.languageLimitList.map((languageLimit) => ({
            language: languageLimit,
          })),
        },
        isLanguageRestrict: data.isLanguageRestrict,
        typeList: {
          create: data.typeList.map((type) => ({
            name: type,
          })),
        },
        style: data.style,
      },
      update: {
        style: data.style,
        title: data.title,
        input: data.input,
        output: data.output,
        etc: data.etc,
        level: data.level,
        levelText: data.levelText,
        answerRate: data.answerRate,
        submitCount: data.submitCount,
        timeout: data.timeout,
        memoryLimit: data.memoryLimit,
        answerCount: data.answerCount,
        answerPeopleCount: data.answerPeopleCount,
        sourceUrl: data.sourceUrl,
        content: data.content,
        limit: data.limit,
        hint: data.hint,
        subTask: data.subTask,
        isSpecialJudge: data.isSpecialJudge,
        isSubTask: data.isSubTask,
        isFunction: data.isFunction,
        isInteractive: data.isInteractive,
        isTwoStep: data.isTwoStep,
        isClass: data.isClass,
        isLanguageRestrict: data.isLanguageRestrict,
        inputOutputList: {
          create: data.inputOutputList.map((inputOutput, index) => ({
            input: inputOutput.input,
            output: inputOutput.output,
            content: inputOutput.content,
            order: index,
          })),
        },
        subTaskList: {
          create: data.subTaskList.map((subTask) => ({
            order: subTask.order,
            title: subTask.title,
            content: subTask.content,
          })),
        },
        customExample: data.customExample,
        customImplementation: data.customImplementation,
        customGrader: data.customGrader,
        customNotes: data.customNotes,
        customAttachment: data.customAttachment,
        problemSource: data.problemSource,
        customSample: data.customSample,
        languageLimitList: {
          create: data.languageLimitList.map((languageLimit) => ({
            language: languageLimit,
          })),
        },
        typeList: {
          create: data.typeList.map((type) => ({
            name: type,
          })),
        },
      },
    });

    return data;
  }
}
