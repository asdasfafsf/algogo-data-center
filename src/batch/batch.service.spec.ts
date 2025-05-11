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
import { BatchInstanceDto } from './dto/batch-instance.dto';

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
            getCronJobs: jest.fn().mockReturnValue(
              new Map([
                ['job1', {}],
                ['job2', {}],
              ]),
            ),
            deleteCronJob: jest.fn(),
            addCronJob: jest.fn(),
          },
        },
        {
          provide: BatchPlanService,
          useValue: { plan: jest.fn() },
        },
        {
          provide: BatchRepository,
          useValue: {
            saveBatchDefinition: jest.fn(),
            findAllBatchDefinition: jest.fn(),
            updateBatchInstance: jest.fn(),
            deleteBatchDefinition: jest.fn(),
          },
        },
        {
          provide: OrchestratorService,
          useValue: { orchestrate: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<BatchService>(BatchService);
    schedulerRegistry = module.get<SchedulerRegistry>(SchedulerRegistry);
    batchPlanService = module.get<BatchPlanService>(BatchPlanService);
    batchRepository = module.get<BatchRepository>(BatchRepository);
    orchestratorService = module.get<OrchestratorService>(OrchestratorService);

    jest.spyOn(dateUtils, 'getElapsedTime').mockReturnValue(100);
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  describe('saveBatchDefinition', () => {
    it('배치 정의를 저장소에 저장해야 함', async () => {
      const batchDefinition: CreateBatchDefinitionDto = {
        name: 'testBatch',
        cron: '0 0 * * *',
        description: '테스트 배치',
      };

      jest
        .spyOn(service, 'synchronizeBatchDefinition')
        .mockResolvedValue(undefined);

      await service.saveBatchDefinition(batchDefinition);

      expect(batchRepository.saveBatchDefinition).toHaveBeenCalledWith(
        batchDefinition,
      );
      expect(service.synchronizeBatchDefinition).toHaveBeenCalled();
    });

    it('저장 실패 시 동기화를 수행하지 않아야 함', async () => {
      const batchDefinition: CreateBatchDefinitionDto = {
        name: 'testBatch',
        cron: '0 0 * * *',
        description: '테스트 배치',
      };
      const error = new Error('저장 실패');
      (batchRepository.saveBatchDefinition as jest.Mock).mockRejectedValue(
        error,
      );
      jest.spyOn(service, 'synchronizeBatchDefinition');

      await expect(
        service.saveBatchDefinition(batchDefinition),
      ).rejects.toThrow(error);
      expect(service.synchronizeBatchDefinition).not.toHaveBeenCalled();
    });
  });

  describe('findAllBatchDefinition', () => {
    it('모든 배치 정의를 반환해야 함', async () => {
      const batchDefinitions = [
        { name: 'batch1', cron: '0 0 * * *', description: '배치 1' },
        { name: 'batch2', cron: '0 12 * * *', description: '배치 2' },
      ];
      (batchRepository.findAllBatchDefinition as jest.Mock).mockResolvedValue(
        batchDefinitions,
      );

      const result = await service.findAllBatchDefinition();

      expect(result).toEqual(batchDefinitions);
      expect(batchRepository.findAllBatchDefinition).toHaveBeenCalled();
    });
  });

  describe('synchronizeBatchDefinition', () => {
    it('기존 크론 작업을 제거하고 새로운 배치 정의로 스케줄을 추가해야 함', async () => {
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
      jest.spyOn(service, 'addSchedule').mockResolvedValue(undefined);

      await service.synchronizeBatchDefinition();

      expect(schedulerRegistry.deleteCronJob).toHaveBeenCalledTimes(2);
      expect(schedulerRegistry.deleteCronJob).toHaveBeenCalledWith('job1');
      expect(schedulerRegistry.deleteCronJob).toHaveBeenCalledWith('job2');
      expect(service.addSchedule).toHaveBeenCalledWith(batchDefinitions[0]);
      expect(service.addSchedule).toHaveBeenCalledWith(batchDefinitions[1]);
    });
  });

  describe('addSchedule', () => {
    it('배치 정의에 따라 크론 작업을 스케줄러에 추가해야 함', async () => {
      const batchDefinition: BatchDefinitionDto = {
        no: 1,
        name: 'testBatch',
        cron: '0 0 * * *',
        description: '테스트 배치',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const mockCronJob = { start: jest.fn() };
      (CronJob as jest.MockedClass<typeof CronJob>).mockImplementation(
        () => mockCronJob as any,
      );

      await service.addSchedule(batchDefinition);

      expect(schedulerRegistry.addCronJob).toHaveBeenCalledWith(
        'testBatch',
        mockCronJob,
      );
      expect(mockCronJob.start).toHaveBeenCalled();
    });

    it('크론 작업 실행 시 배치 계획을 수립하고 실행해야 함', async () => {
      const batchDefinition: BatchDefinitionDto = {
        no: 1,
        name: 'testBatch',
        cron: '0 0 * * *',
        description: '테스트 배치',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      let cronJobCallback: () => any;
      (CronJob as jest.MockedClass<typeof CronJob>).mockImplementation(
        (cronTime, onTick) => {
          cronJobCallback = onTick as () => any;
          return { start: jest.fn() } as any;
        },
      );

      const batchPlans = [
        { name: 'plan1', no: 1 },
        { name: 'plan2', no: 2 },
      ];
      (batchPlanService.plan as jest.Mock).mockResolvedValue(batchPlans);
      jest
        .spyOn(service, 'executeBatch')
        .mockImplementation(async () => undefined);

      await service.addSchedule(batchDefinition);

      expect(CronJob).toHaveBeenCalledWith(
        batchDefinition.cron,
        expect.any(Function),
      );

      await cronJobCallback();

      expect(batchPlanService.plan).toHaveBeenCalledWith(batchDefinition);
      expect(service.executeBatch).toHaveBeenCalledWith(batchPlans[0]);
      expect(service.executeBatch).toHaveBeenCalledWith(batchPlans[1]);
    });

    it('CronJob 생성 실패 시 에러를 전파해야 함', async () => {
      const batchDefinition: BatchDefinitionDto = {
        no: 1,
        name: 'testBatch',
        cron: '0 0 * * *',
        description: '테스트 배치',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const error = new Error('CronJob 생성 실패');
      (CronJob as jest.MockedClass<typeof CronJob>).mockImplementation(() => {
        throw error;
      });

      await expect(service.addSchedule(batchDefinition)).rejects.toThrow(error);
      expect(schedulerRegistry.addCronJob).not.toHaveBeenCalled();
    });

    it('schedulerRegistry.addCronJob 실패 시 에러를 전파해야 함', async () => {
      const batchDefinition: BatchDefinitionDto = {
        no: 1,
        name: 'testBatch',
        cron: '0 0 * * *',
        description: '테스트 배치',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const error = new Error('CronJob 생성 실패');
      (schedulerRegistry.addCronJob as jest.Mock).mockImplementation(() => {
        throw error;
      });

      await expect(service.addSchedule(batchDefinition)).rejects.toThrow(error);
    });
  });

  describe('executeBatch', () => {
    it('성공적인 배치 실행 결과를 처리해야 함', async () => {
      const batchPlan: BatchInstanceDto & { name: string } = {
        name: 'PROBLEM_BOJ',
        no: 1,
        createdAt: undefined,
        updatedAt: undefined,
        batchDefinitionNo: 1,
        state: 'SUCCESS',
        startedAt: undefined,
        finishedAt: undefined,
        elapsedTime: 0,
        data: { result: 'ok' },
      };
      const successResult = { state: 'SUCCESS', data: { result: 'ok' } };
      (orchestratorService.orchestrate as jest.Mock).mockReturnValue(
        Promise.resolve(successResult),
      );
      (batchRepository.updateBatchInstance as jest.Mock).mockResolvedValue(
        undefined,
      );

      service.executeBatch(batchPlan);
      await Promise.resolve();
      expect(orchestratorService.orchestrate).toHaveBeenCalledWith(
        batchPlan.name,
        batchPlan.data,
      );

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
      const batchPlan: BatchInstanceDto & { name: string } = {
        name: 'PROBLEM_BOJ',
        no: 1,
        createdAt: undefined,
        updatedAt: undefined,
        batchDefinitionNo: 1,
        state: 'SUCCESS',
        startedAt: undefined,
        finishedAt: undefined,
        elapsedTime: 0,
        data: { result: 'ok' },
      };
      const failedResult = {
        state: 'FAILED',
        errorCode: 'ERR_TEST',
        errorMessage: '테스트 오류',
      };
      (orchestratorService.orchestrate as jest.Mock).mockReturnValue(
        Promise.resolve(failedResult),
      );

      service.executeBatch(batchPlan);
      await Promise.resolve();
      jest.runAllTimers();
      await Promise.resolve();

      expect(orchestratorService.orchestrate).toHaveBeenCalledWith(
        batchPlan.name,
        batchPlan.data,
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
      const batchPlan: BatchInstanceDto & { name: string } = {
        name: 'PROBLEM_BOJ',
        no: 1,
        createdAt: undefined,
        updatedAt: undefined,
        batchDefinitionNo: 1,
        state: 'SUCCESS',
        startedAt: undefined,
        finishedAt: undefined,
        elapsedTime: 0,
        data: { result: 'ok' },
      };
      const error = new Error('예상치 못한 오류');
      Object.defineProperty(error, 'code', { value: 'ERR_UNEXPECTED' });
      (orchestratorService.orchestrate as jest.Mock).mockReturnValue(
        Promise.reject(error),
      );
      jest.spyOn(console, 'error').mockImplementation(() => {});

      service.executeBatch(batchPlan);
      await Promise.resolve();
      jest.runAllTimers();
      await Promise.resolve();

      expect(orchestratorService.orchestrate).toHaveBeenCalledWith(
        batchPlan.name,
        batchPlan.data,
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

  describe('deleteBatchDefinition', () => {
    it('배치 정의 삭제 후 동기화를 수행해야 함', async () => {
      const no = 1;
      jest
        .spyOn(service, 'synchronizeBatchDefinition')
        .mockResolvedValue(undefined);

      await service.deleteBatchDefinition(no);

      expect(batchRepository.deleteBatchDefinition).toHaveBeenCalledWith(no);
      expect(service.synchronizeBatchDefinition).toHaveBeenCalled();
    });

    it('삭제 실패 시 동기화를 수행하지 않아야 함', async () => {
      const no = 1;
      const error = new Error('삭제 실패');
      (batchRepository.deleteBatchDefinition as jest.Mock).mockRejectedValue(
        error,
      );
      jest.spyOn(service, 'synchronizeBatchDefinition');

      await expect(service.deleteBatchDefinition(no)).rejects.toThrow(error);
      expect(service.synchronizeBatchDefinition).not.toHaveBeenCalled();
    });
  });
});
