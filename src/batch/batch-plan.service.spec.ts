import { Test, TestingModule } from '@nestjs/testing';
import { BatchPlanService } from './batch-plan.service';
import { BatchRepository } from './batch.repository';
import { BatchPlanRegistry } from './batch-plan.registry';
import { BatchDefinitionDto } from './dto/batch-definition.dto';

describe('BatchPlanService', () => {
  let service: BatchPlanService;
  let batchRepository: BatchRepository;
  let batchPlanRegistry: BatchPlanRegistry;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BatchPlanService,
        {
          provide: BatchRepository,
          useValue: {
            createBatchInstance: jest.fn(),
          },
        },
        {
          provide: BatchPlanRegistry,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<BatchPlanService>(BatchPlanService);
    batchRepository = module.get<BatchRepository>(BatchRepository);
    batchPlanRegistry = module.get<BatchPlanRegistry>(BatchPlanRegistry);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('plan', () => {
    it('배치 정의에 맞는 계획을 수립하고 배치 인스턴스 목록을 반환해야 함', async () => {
      // Given
      const batchDefinition: BatchDefinitionDto = {
        no: 1,
        name: 'testBatch',
        jobName: 'PROBLEM_BOJ',
        cron: '0 0 * * *',
        description: '테스트 배치',
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-01'),
      };

      const mockBatchPlan = {
        plan: jest.fn().mockResolvedValue([
          { name: 'testBatch', data: { param1: 'value1' } },
          { name: 'testBatch', data: { param2: 'value2' } },
        ]),
      };

      const mockBatchInstances = [
        { no: 1, name: 'testBatch', state: 'PENDING' },
        { no: 2, name: 'testBatch', state: 'PENDING' },
      ];

      (batchPlanRegistry.get as jest.Mock).mockReturnValue(mockBatchPlan);
      (batchRepository.createBatchInstance as jest.Mock)
        .mockResolvedValueOnce(mockBatchInstances[0])
        .mockResolvedValueOnce(mockBatchInstances[1]);

      // When
      const result = await service.plan(batchDefinition);

      // Then
      expect(batchPlanRegistry.get).toHaveBeenCalledWith('testBatch');
      expect(mockBatchPlan.plan).toHaveBeenCalledWith(batchDefinition);
      expect(batchRepository.createBatchInstance).toHaveBeenCalledTimes(2);
      expect(result).toEqual(mockBatchInstances);
    });

    it('배치 계획이 레지스트리에 존재하지 않으면 빈 배열을 반환해야 함', async () => {
      // Given
      const batchDefinition: BatchDefinitionDto = {
        no: 1,
        name: 'nonExistentBatch',
        jobName: 'PROBLEM_BOJ',
        cron: '0 0 * * *',
        description: '존재하지 않는 배치',
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-01'),
      };

      (batchPlanRegistry.get as jest.Mock).mockReturnValue(null);

      // When
      const result = await service.plan(batchDefinition);

      // Then
      expect(batchPlanRegistry.get).toHaveBeenCalledWith('nonExistentBatch');
      expect(result).toEqual([]);
      expect(batchRepository.createBatchInstance).not.toHaveBeenCalled();
    });

    it('계획 수립 중 오류가 발생하면 빈 배열을 반환해야 함', async () => {
      // Given
      const batchDefinition: BatchDefinitionDto = {
        no: 1,
        name: 'errorBatch',
        jobName: 'PROBLEM_BOJ',
        cron: '0 0 * * *',
        description: '오류 발생 배치',
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-01'),
      };

      const mockBatchPlan = {
        plan: jest.fn().mockRejectedValue(new Error('계획 수립 오류')),
      };

      (batchPlanRegistry.get as jest.Mock).mockReturnValue(mockBatchPlan);

      // When
      const result = await service.plan(batchDefinition);

      // Then
      expect(batchPlanRegistry.get).toHaveBeenCalledWith('errorBatch');
      expect(mockBatchPlan.plan).toHaveBeenCalledWith(batchDefinition);
      expect(result).toEqual([]);
      expect(batchRepository.createBatchInstance).not.toHaveBeenCalled();
    });

    it('배치 인스턴스 생성 중 오류가 발생하면 빈 배열을 반환해야 함', async () => {
      // Given
      const batchDefinition: BatchDefinitionDto = {
        no: 1,
        name: 'instanceErrorBatch',
        jobName: 'PROBLEM_BOJ',
        cron: '0 0 * * *',
        description: '인스턴스 생성 오류 배치',
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-01'),
      };

      const mockBatchPlan = {
        plan: jest
          .fn()
          .mockResolvedValue([
            { name: 'instanceErrorBatch', data: { param: 'value' } },
          ]),
      };

      (batchPlanRegistry.get as jest.Mock).mockReturnValue(mockBatchPlan);
      (batchRepository.createBatchInstance as jest.Mock).mockRejectedValue(
        new Error('인스턴스 생성 오류'),
      );

      // When
      const result = await service.plan(batchDefinition);

      // Then
      expect(batchPlanRegistry.get).toHaveBeenCalledWith('instanceErrorBatch');
      expect(mockBatchPlan.plan).toHaveBeenCalledWith(batchDefinition);
      expect(batchRepository.createBatchInstance).toHaveBeenCalled();
      expect(result).toEqual([]);
    });
  });
});
