// src/batch/plans/problem-boj.plan.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { ProblemBojPlan } from './problem-boj.plan';
import { PrismaService } from '../../prisma/prisma.service';
import { BatchDefinitionDto } from '../dto/batch-definition.dto';
import { CreateBatchInstanceDto } from '../dto/create-batch-instance.dto';

describe('ProblemBojPlan', () => {
  let plan: ProblemBojPlan;

  const mockPrismaService = {
    problemV2: {
      findMany: jest.fn(),
    },
  };

  const mockBatchDefinition: BatchDefinitionDto = {
    no: 1,
    name: 'BOJ Problem Sync',
    cron: '0 0 * * *',
    description: 'Sync BOJ problems',
    createdAt: new Date(),
    updatedAt: new Date(),
    jobName: 'PROBLEM_BOJ',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProblemBojPlan,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    plan = module.get<ProblemBojPlan>(ProblemBojPlan);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('plan', () => {
    it('마지막 문제가 없을 경우 1000번부터 시작해야 한다', async () => {
      // Given
      mockPrismaService.problemV2.findMany.mockResolvedValue([]);

      // When
      const result = await plan.plan(mockBatchDefinition);

      // Then
      const expected: CreateBatchInstanceDto[] = [
        {
          batchDefinitionNo: mockBatchDefinition.no,
          state: 'PENDING',
          data: {
            source: 'acmicpc',
            sourceId: '1000',
          },
        },
      ];

      expect(result).toEqual(expected);
    });

    it('마지막 문제가 있을 경우 다음 번호부터 시작해야 한다', async () => {
      // Given
      const lastProblem = [{ sourceId: '1000' }, { sourceId: '1001' }];
      mockPrismaService.problemV2.findMany.mockResolvedValue(lastProblem);

      // When
      const result = await plan.plan(mockBatchDefinition);

      // Then
      const expected: CreateBatchInstanceDto[] = [
        {
          batchDefinitionNo: mockBatchDefinition.no,
          state: 'PENDING',
          data: {
            source: 'acmicpc',
            sourceId: '1002',
          },
        },
      ];

      expect(result).toEqual(expected);
    });

    it('중간에 빈 번호가 있을 경우 빈 번호부터 시작해야 함', async () => {
      // Given
      const lastProblem = [{ sourceId: '1000' }, { sourceId: '1002' }];
      mockPrismaService.problemV2.findMany.mockResolvedValue(lastProblem);

      // When
      const result = await plan.plan(mockBatchDefinition);

      // Then
      const expected: CreateBatchInstanceDto[] = [
        {
          batchDefinitionNo: mockBatchDefinition.no,
          state: 'PENDING',
          data: {
            source: 'acmicpc',
            sourceId: '1001',
          },
        },
      ];

      expect(result).toEqual(expected);
    });
  });
});
