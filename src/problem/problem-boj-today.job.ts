import { Inject, Injectable } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { TodayProblemConfig } from 'src/config/TodayProblemConfig';
import { PrismaService } from 'src/prisma/prisma.service';
import { PROBLEM_BOJ_TODAY } from '../job/constants/job.constants';
import { JobHandler } from '../job/decorators/job-handler.decorator';
import { JobRunner } from '../job/interfaces/job-runner.interface';
import {
  ENGINEERED_PROBLEM_TYPE_SCORE,
  ENGINIEERED_PROBLEM_TYPE_HANDLER,
} from './constants/engineered.problem.type.contants';

type PreviousProblem = {
  servedAt: Date;
  uuid: string;
  level: number;
  typeList: string[];
};

type TargetProblem = {
  uuid: string;
  level: number;
  typeList: string[];
};

@Injectable()
@JobHandler(PROBLEM_BOJ_TODAY)
export class ProblemBojTodayJob implements JobRunner<any, any> {
  constructor(
    @Inject(TodayProblemConfig.KEY)
    private readonly todayProblemConfig: ConfigType<typeof TodayProblemConfig>,
    private readonly prismaService: PrismaService,
  ) {}

  /**
   * 전체 문제 대상 출력
   * @returns 문제리스트
   */
  async getTargetProblems() {
    const targetProblems = await this.prismaService.problemV2.findMany({
      select: {
        uuid: true,
        level: true,
        typeList: {
          select: {
            name: true,
          },
        },
      },
      where: {
        answerCount: {
          gte: 200,
        },
        level: {
          gte: 1,
          lt: 19,
        },
      },
    });

    return targetProblems.map((problem) => ({
      ...problem,
      typeList: problem.typeList.map((type) => type.name),
    }));
  }

  /**
   * 최근 7일 문제 출력
   * @returns 문제리스트
   */
  async getPreviousProblems(currentDate: number): Promise<PreviousProblem[]> {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(
      sevenDaysAgo.getDate() - this.todayProblemConfig.maxDays + currentDate,
    );
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const result = await this.prismaService.todayProblem.findMany({
      select: {
        servedAt: true,
        problemV2: {
          select: {
            uuid: true,
            level: true,
            typeList: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      where: {
        servedAt: {
          gte: sevenDaysAgo,
        },
      },
      orderBy: {
        servedAt: 'asc',
      },
    });

    return result.map((item) => ({
      ...item.problemV2,
      typeList: item.problemV2.typeList.map((type) => type.name),
      servedAt: item.servedAt,
    }));
  }

  normalize(targetProblems: TargetProblem[]) {
    return targetProblems
      .map((problem) => ({
        ...problem,
        typeList: this.normalizeTypes(problem.typeList),
      }))
      .filter((problem) => problem.typeList.length > 0);
  }

  /**
   * 문제 타입을 정규화
   * @param typeList 문제 타입 리스트
   * @returns 정규화된 문제 타입 리스트
   */
  normalizeTypes(typeList: string[]) {
    const normalizedTypes = typeList
      .map((type) => ENGINIEERED_PROBLEM_TYPE_HANDLER[type])
      .filter((type) => !!type)
      .flat();

    const removedDuplicatedTypes = [...new Set(normalizedTypes)];
    return removedDuplicatedTypes;
  }

  /**
   * 이전 문제 유형별 가중치 계산
   * @param previousProblems 이전 문제 리스트
   * @returns 유형별 가중치
   */
  generateTypeWeight(previousProblems: PreviousProblem[], currentDate: number) {
    const engineeredTypeWeight = JSON.parse(
      JSON.stringify(ENGINEERED_PROBLEM_TYPE_SCORE),
    );

    const groupedByDate = previousProblems.reduce((acc, problem) => {
      const dateKey = new Date(problem.servedAt).toISOString().split('T')[0];
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(problem);
      return acc;
    }, {});

    const lambda = 0.7;

    Object.keys(groupedByDate).forEach((date) => {
      const problems = groupedByDate[date];
      const unnormalizedTypes = problems
        .map((problem) => problem.typeList)
        .flat();
      const normalizedTypes = this.normalizeTypes(unnormalizedTypes);

      const now = new Date(
        new Date().setDate(new Date().getDate() + currentDate),
      );
      const servedAt = new Date(problems[0].servedAt);
      const diff = now.getTime() - servedAt.getTime();
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const decay = 1 - Math.exp(-lambda * days);

      // console.log(days, decay);

      normalizedTypes.forEach((type) => {
        if (engineeredTypeWeight[type]) {
          engineeredTypeWeight[type] *= decay;
        }
      });
    });

    return engineeredTypeWeight;
  }

  /**
   * 문제 가중치 계산
   * @param targetProblems 문제 리스트
   * @param typeWeight 유형별 가중치
   * @returns 문제 가중치
   */
  generateWeight(
    targetProblems: TargetProblem[],
    typeWeight: typeof ENGINEERED_PROBLEM_TYPE_SCORE,
  ) {
    const todayProblems = [];

    for (const problem of targetProblems) {
      const types = [...problem.typeList.map((type) => typeWeight[type])];
      const minWeight = Math.min(...types);
      todayProblems.push({
        ...problem,
        weight: minWeight,
      });
    }

    return todayProblems;
  }

  /**
   * 문제 레벨별 그룹화
   * @param weightedProblems 문제 리스트
   * @returns 레벨별 그룹화된 문제 리스트
   */
  groupByLevel(weightedProblems: TargetProblem[]) {
    const groupedByLevel = weightedProblems.reduce((acc, problem) => {
      const level = Math.floor(problem.level / 3);
      if (!acc[level]) acc[level] = [];
      acc[level].push(problem);
      return acc;
    }, {});

    return Object.keys(groupedByLevel).map((level) => groupedByLevel[level]);
  }

  /**
   * 오늘 문제 생성
   * @param weightedProblems 문제 리스트
   * @returns 오늘 문제
   */
  generateTodayProblem(
    weightedProblems: (TargetProblem & {
      weight: number;
    })[],
    currentDate: number,
  ) {
    const sortedWeightedProblems = [...weightedProblems].sort((a, b) => {
      if (Math.abs(a.weight - b.weight) < 5) {
        return Math.random() - 0.5;
      }

      return a.weight > b.weight ? -1 : 1;
    });

    const targetProblem =
      sortedWeightedProblems[
        Math.floor(Math.random() * Math.min(10, sortedWeightedProblems.length))
      ];

    const servedAt = new Date(
      new Date().setDate(new Date().getDate() + currentDate),
    );
    servedAt.setHours(0, 0, 0, 0);
    return {
      ...targetProblem,
      servedAt,
    };
  }

  async insertTodayProblems(todayProblems: { uuid: string; servedAt: Date }[]) {
    await this.prismaService.todayProblem.createMany({
      data: todayProblems.map((problem) => ({
        problemUuid: problem.uuid,
        servedAt: problem.servedAt,
      })),
    });
  }

  async run({ currentDate }: { currentDate: number }) {
    // 이전 7일 문제 추출
    currentDate = Number(currentDate);
    const previousProblems = await this.getPreviousProblems(currentDate);
    // 제출수 500인 이상 전체 문제 가져옴
    const previousProblemUuids = new Set(
      previousProblems.map((problem) => problem.uuid),
    );
    const targetProblems = await this.getTargetProblems();
    const realTargetProblems = targetProblems.filter(
      (problem) => !previousProblemUuids.has(problem.uuid),
    );

    const groupedByLevelPreviousProblems = this.groupByLevel(previousProblems);
    const groupedByLevelTargetProblems = this.groupByLevel(realTargetProblems);

    const todayProblems = [];
    for (let i = 0; i < groupedByLevelTargetProblems.length; i++) {
      const previousProblems = groupedByLevelPreviousProblems[i] ?? [];
      const targetProblems = groupedByLevelTargetProblems[i];

      // 이전에 나온 유형별로 유형별 가중치를 계산
      const typeWeight = this.generateTypeWeight(previousProblems, currentDate);
      // console.log('i:--------------------------------', i);
      // console.log(typeWeight);
      // console.log('--------------------------------');
      // 문제 타입을 정규화
      const normalizedTargetProblems = this.normalize(targetProblems);

      // 문제 가중치를 계산
      const weightedProblems = this.generateWeight(
        normalizedTargetProblems,
        typeWeight,
      );

      // 오늘의 문제 생성
      const todayProblem1 = this.generateTodayProblem(
        weightedProblems,
        currentDate,
      );
      todayProblems.push(todayProblem1);

      if (i === 3) {
        const todayProblem2 = this.generateTodayProblem(
          weightedProblems
            .filter((elem) => elem.uuid !== todayProblem1.uuid)
            .filter(
              (elem) =>
                !elem.typeList.some((type) =>
                  todayProblem1.typeList.includes(type),
                ),
            ),
          currentDate,
        );
        todayProblems.push(todayProblem2);
      }
    }

    todayProblems.sort((a, b) => a.level - b.level);
    await this.insertTodayProblems(todayProblems);
    // console.log(todayProblems);

    return todayProblems;
  }
}
