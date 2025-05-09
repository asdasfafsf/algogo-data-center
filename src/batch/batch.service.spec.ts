import { Test, TestingModule } from '@nestjs/testing';
import { BatchService } from './batch.service';
import { BatchRepository } from './batch.repository';
import { BatchPlanService } from './batch-plan.service';
import { SchedulerRegistry } from '@nestjs/schedule';
import { OrchestratorService } from '../orchestrator/orchestrator.service';
import { CreateBatchDefinitionDto } from './dto/create-batch-definition.dto';
import { BatchDefinitionDto } from './dto/batch-definition.dto';
import { CronJob } from 'cron';
import * as dateUtils from '../common/date';

jest.mock('cron');

describe('BatchService', () => {
  let service: BatchService;
  let schedulerRegistry: SchedulerRegistry;
  let batchPlanService: BatchPlanService;
  let batchRepository: BatchRepository;
  let orchestratorService: OrchestratorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BatchService,
        {
          provide: SchedulerRegistry,
          useValue: {
            getCronJobs: jest.fn(),
            deleteCronJob: jest.fn(),
            addCronJob: jest.fn(),
          },
        },
        {
          provide: BatchPlanService,
          useValue: {
            plan: jest.fn(),
          },
        },
        {
          provide: BatchRepository,
          useValue: {
            saveBatchDefinition: jest.fn(),
            findAllBatchDefinition: jest.fn(),
            updateBatchInstance: jest.fn(),
          },
        },
        {
          provide: OrchestratorService,
          useValue: {
            orchestrate: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<BatchService>(BatchService);
    schedulerRegistry = module.get<SchedulerRegistry>(SchedulerRegistry);
    batchPlanService = module.get<BatchPlanService>(BatchPlanService);
    batchRepository = module.get<BatchRepository>(BatchRepository);
    orchestratorService = module.get<OrchestratorService>(OrchestratorService);

    // 모의 함수 초기화
    jest.spyOn(dateUtils, 'getElapsedTime').mockReturnValue(100);

    // 페이크 타이머 설정
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  describe('saveBatchDefinition', () => {
    it('배치 정의를 저장소에 저장해야 함', async () => {
      // Given
      const batchDefinition: CreateBatchDefinitionDto = {
        name: 'testBatch',
        cron: '0 0 * * *',
        description: '테스트 배치',
      };

      // When
      await service.saveBatchDefinition(batchDefinition);

      // Then
      expect(batchRepository.saveBatchDefinition).toHaveBeenCalledWith(
        batchDefinition,
      );
    });
  });

  describe('findAllBatchDefinition', () => {
    it('모든 배치 정의를 반환해야 함', async () => {
      // Given
      const batchDefinitions = [
        { name: 'batch1', cron: '0 0 * * *', description: '배치 1' },
        { name: 'batch2', cron: '0 12 * * *', description: '배치 2' },
      ];
      (batchRepository.findAllBatchDefinition as jest.Mock).mockResolvedValue(
        batchDefinitions,
      );

      // When
      const result = await service.findAllBatchDefinition();

      // Then
      expect(result).toEqual(batchDefinitions);
      expect(batchRepository.findAllBatchDefinition).toHaveBeenCalled();
    });
  });

  describe('synchronizeBatchDefinition', () => {
    it('기존 크론 작업을 제거하고 새로운 배치 정의로 스케줄을 추가해야 함', async () => {
      // Given
      const cronJobs = new Map();
      cronJobs.set('job1', {});
      cronJobs.set('job2', {});
      (schedulerRegistry.getCronJobs as jest.Mock).mockReturnValue(cronJobs);

      const batchDefinitions = [
        { name: 'batch1', cron: '0 0 * * *', description: '배치 1' },
        { name: 'batch2', cron: '0 12 * * *', description: '배치 2' },
      ];
      (batchRepository.findAllBatchDefinition as jest.Mock).mockResolvedValue(
        batchDefinitions,
      );

      // mock addSchedule 메서드
      jest.spyOn(service, 'addSchedule').mockResolvedValue(undefined);

      // When
      await service.synchronizeBatchDefinition();

      // Then
      expect(schedulerRegistry.deleteCronJob).toHaveBeenCalledTimes(2);
      expect(schedulerRegistry.deleteCronJob).toHaveBeenCalledWith('job1');
      expect(schedulerRegistry.deleteCronJob).toHaveBeenCalledWith('job2');
      expect(service.addSchedule).toHaveBeenCalledTimes(2);
      expect(service.addSchedule).toHaveBeenCalledWith(batchDefinitions[0]);
      expect(service.addSchedule).toHaveBeenCalledWith(batchDefinitions[1]);
    });
  });

  describe('addSchedule', () => {
    it('배치 정의에 따라 크론 작업을 스케줄러에 추가해야 함', async () => {
      // Given
      const batchDefinition: BatchDefinitionDto = {
        name: 'testBatch',
        cron: '0 0 * * *',
        description: '테스트 배치',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // CronJob 모의 구현
      const mockCronJob = { someProperty: 'cronJob' };
      (CronJob as jest.MockedClass<typeof CronJob>).mockImplementation(
        () => mockCronJob as any,
      );

      // When
      await service.addSchedule(batchDefinition);

      // Then
      expect(schedulerRegistry.addCronJob).toHaveBeenCalledWith(
        'testBatch',
        mockCronJob,
      );
    });

    it('크론 작업 실행 시 배치 계획을 수립하고 실행해야 함', async () => {
      // Given
      const batchDefinition: BatchDefinitionDto = {
        name: 'testBatch',
        cron: '0 0 * * *',
        description: '테스트 배치',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      let cronJobCallback: () => any;

      // CronJob 모킹
      (CronJob as jest.MockedClass<typeof CronJob>).mockImplementation(
        (cronTime, onTick) => {
          cronJobCallback = onTick as () => any;
          return { someProperty: 'cronJob' } as any;
        },
      );

      const batchPlans = [
        { name: 'plan1', no: 1 },
        { name: 'plan2', no: 2 },
      ];
      (batchPlanService.plan as jest.Mock).mockResolvedValue(batchPlans);

      // executeBatch 모의 구현
      jest
        .spyOn(service, 'executeBatch')
        .mockImplementation(async () => undefined);

      // When
      await service.addSchedule(batchDefinition);

      // CronJob이 제대로 생성되었는지 확인
      expect(CronJob).toHaveBeenCalledWith(
        batchDefinition.cron,
        expect.any(Function),
      );

      // 크론잡 콜백 실행
      await cronJobCallback();

      // Then
      expect(batchPlanService.plan).toHaveBeenCalledWith(batchDefinition);
      expect(service.executeBatch).toHaveBeenCalledTimes(2);
      expect(service.executeBatch).toHaveBeenCalledWith(batchPlans[0]);
      expect(service.executeBatch).toHaveBeenCalledWith(batchPlans[1]);
    });
  });

  describe('executeBatch', () => {
    it('성공적인 배치 실행 결과를 처리해야 함', async () => {
      // Given
      const batchPlan = { name: 'testBatch', no: 1 };
      const successResult = { state: 'SUCCESS', data: { result: 'ok' } };

      // orchestratorService.orchestrate가 Promise를 반환하도록 설정
      (orchestratorService.orchestrate as jest.Mock).mockReturnValue(
        Promise.resolve(successResult),
      );

      // updateBatchInstance 모킹
      (batchRepository.updateBatchInstance as jest.Mock).mockResolvedValue(
        undefined,
      );

      // When
      service.executeBatch(batchPlan);

      // 비동기 작업 처리
      await Promise.resolve(); // 마이크로태스크 큐 플러시

      // Then
      expect(orchestratorService.orchestrate).toHaveBeenCalledWith(
        'testBatch',
        batchPlan,
      );

      // Promise 해결 후 메서드가 호출되는지 확인
      await Promise.resolve();
      jest.runAllTimers();
      await Promise.resolve();

      expect(batchRepository.updateBatchInstance).toHaveBeenCalledWith(
        expect.objectContaining({
          no: 1,
          state: 'SUCCESS',
          elapsedTime: expect.any(Number),
          startedAt: expect.any(Date),
          finishedAt: expect.any(Date),
        }),
      );
    });

    it('실패한 배치 실행 결과를 처리해야 함', async () => {
      // Given
      const batchPlan = { name: 'testBatch', no: 1 };
      const failedResult = {
        state: 'FAILED',
        errorCode: 'ERR_TEST',
        errorMessage: '테스트 오류',
      };

      // Promise가 해결되도록 모킹
      (orchestratorService.orchestrate as jest.Mock).mockReturnValue(
        Promise.resolve(failedResult),
      );

      // When
      service.executeBatch(batchPlan);

      // 비동기 작업 처리
      await Promise.resolve();
      jest.runAllTimers();
      await Promise.resolve();

      // Then
      expect(orchestratorService.orchestrate).toHaveBeenCalledWith(
        'testBatch',
        batchPlan,
      );
      expect(batchRepository.updateBatchInstance).toHaveBeenCalledWith(
        expect.objectContaining({
          no: 1,
          state: 'FAILED',
          errorCode: 'ERR_TEST',
          errorMessage: '테스트 오류',
        }),
      );
    });

    it('배치 실행 중 예외가 발생하면 실패 상태로 처리해야 함', async () => {
      // Given
      const batchPlan = { name: 'testBatch', no: 1 };
      const error = new Error('예상치 못한 오류');
      Object.defineProperty(error, 'code', { value: 'ERR_UNEXPECTED' });

      // Promise가 거부되도록 모킹
      (orchestratorService.orchestrate as jest.Mock).mockReturnValue(
        Promise.reject(error),
      );

      // 콘솔 오류 출력 모의
      jest.spyOn(console, 'error').mockImplementation(() => {});

      // When
      service.executeBatch(batchPlan);

      // 비동기 작업 처리
      await Promise.resolve();
      jest.runAllTimers();
      await Promise.resolve();

      // Then
      expect(orchestratorService.orchestrate).toHaveBeenCalledWith(
        'testBatch',
        batchPlan,
      );
      expect(console.error).toHaveBeenCalledWith(error);
      expect(batchRepository.updateBatchInstance).toHaveBeenCalledWith(
        expect.objectContaining({
          no: 1,
          state: 'FAILED',
          errorCode: 'ERR_UNEXPECTED',
          errorMessage: '예상치 못한 오류',
        }),
      );
    });
  });
});
