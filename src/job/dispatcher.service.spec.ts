import { Test, TestingModule } from '@nestjs/testing';
import { DispatcherService } from './dispatcher.service';
import { JobRegistry } from './job-registry';
import { JobRepository } from './job.repository';
import { NotFoundException } from '@nestjs/common';
import { JobHandlerKey } from './types/job.type';

// getElapsedTime 모킹
jest.mock('../common/date', () => ({
  getElapsedTime: jest.fn().mockReturnValue(100),
}));

describe('DispatcherService', () => {
  let service: DispatcherService;
  let jobRepository: JobRepository;

  const mockJobRegistry = {
    get: jest.fn(),
  };

  const mockJobRepository = {
    findJobInstanceByUuid: jest.fn(),
    upsertJobInstance: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DispatcherService,
        { provide: JobRegistry, useValue: mockJobRegistry },
        { provide: JobRepository, useValue: mockJobRepository },
      ],
    }).compile();

    service = module.get<DispatcherService>(DispatcherService);
    jobRepository = module.get<JobRepository>(JobRepository);

    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getNextData', () => {
    it('작업 인스턴스의 마지막 결과를 반환한다', async () => {
      // Given
      const uuid = 'test-uuid';
      const key = 'PROBLEM_BOJ_COLLECT';
      const jobInstances = [
        { result: { data: 'result1' } },
        { result: { data: 'result2' } },
      ];
      mockJobRepository.findJobInstanceByUuid.mockResolvedValueOnce(
        jobInstances,
      );

      // When
      const result = await service.getNextData({ key, uuid });

      // Then
      expect(jobRepository.findJobInstanceByUuid).toHaveBeenCalledWith(uuid);
      expect(result).toEqual({ data: 'result2' });
    });

    it('작업 인스턴스가 없으면 undefined를 반환한다', async () => {
      // Given
      const uuid = 'test-uuid';
      const key = 'PROBLEM_BOJ_COLLECT';
      mockJobRepository.findJobInstanceByUuid.mockResolvedValueOnce([]);

      // When
      const result = await service.getNextData({ key, uuid });

      // Then
      expect(jobRepository.findJobInstanceByUuid).toHaveBeenCalledWith(uuid);
      expect(result).toBeUndefined();
    });
  });

  describe('dispatch', () => {
    it('작업을 성공적으로 실행하고 결과를 저장한다', async () => {
      // Given
      const key = 'PROBLEM_BOJ_COLLECT';
      const data = { uuid: 'test-uuid', param1: 'value1' };
      const jobRunner = {
        run: jest.fn().mockResolvedValueOnce({ result: 'success' }),
      };

      mockJobRegistry.get.mockReturnValueOnce(jobRunner);
      mockJobRepository.findJobInstanceByUuid.mockResolvedValueOnce([]);

      // When
      const result = await service.dispatch(key, data);

      // Then
      // 첫 번째 upsert 호출 (실행 시작)
      expect(jobRepository.upsertJobInstance).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          uuid: 'test-uuid',
          name: key,
          step: key,
          state: 'RUNNING',
          request: { param1: 'value1' },
        }),
      );

      // 작업 실행 확인
      expect(jobRunner.run).toHaveBeenCalledWith(data);

      // 두 번째 upsert 호출 (성공 상태)
      expect(jobRepository.upsertJobInstance).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          uuid: 'test-uuid',
          name: key,
          step: key,
          state: 'SUCCESS',
          result: { result: 'success' },
          elapsedTime: 100,
        }),
      );

      expect(result).toEqual({ result: 'success' });
    });

    it('이전 작업 결과가 있으면 이를 사용하여 다음 작업을 실행한다', async () => {
      // Given
      const key = 'TEST_JOB';
      const data = { uuid: 'test-uuid', param1: 'value1' };
      const previousResult = {
        uuid: 'test-uuid',
        param1: 'value1',
        additionalData: 'previous',
      };
      const jobRunner = {
        run: jest.fn().mockResolvedValueOnce({ result: 'success' }),
      };

      mockJobRegistry.get.mockReturnValueOnce(jobRunner);
      mockJobRepository.findJobInstanceByUuid.mockResolvedValueOnce([
        { result: previousResult },
      ]);

      // When
      const result = await service.dispatch(key as JobHandlerKey, data);

      // Then
      // 작업 실행 시 이전 결과를 입력으로 사용
      expect(jobRunner.run).toHaveBeenCalledWith(previousResult);
      expect(result).toEqual({ result: 'success' });
    });

    it('작업이 존재하지 않으면 NotFoundException을 발생시킨다', async () => {
      // Given
      const key = 'PROBLEM_BOJ_COLLECT';
      const data = { uuid: 'test-uuid', param1: 'value1' };

      mockJobRegistry.get.mockReturnValueOnce(null);
      mockJobRepository.findJobInstanceByUuid.mockResolvedValueOnce([]);

      // When & Then
      await expect(service.dispatch(key, data)).rejects.toThrow(
        NotFoundException,
      );
      expect(jobRepository.upsertJobInstance).toHaveBeenCalledTimes(2);
      expect(jobRepository.upsertJobInstance).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          uuid: 'test-uuid',
          name: key,
          step: key,
          state: 'FAILED',
          errorMessage: expect.stringContaining('Job not found'),
        }),
      );
    });

    it('작업 실행 중 오류가 발생하면 FAILED 상태로 저장하고 오류를 다시 던진다', async () => {
      // Given
      const key = 'PROBLEM_BOJ_COLLECT';
      const data = { uuid: 'test-uuid', param1: 'value1' };
      const error = new Error('Job execution failed');

      const jobRunner = { run: jest.fn().mockRejectedValueOnce(error) };

      mockJobRegistry.get.mockReturnValueOnce(jobRunner);
      mockJobRepository.findJobInstanceByUuid.mockResolvedValueOnce([]);

      // When & Then
      await expect(service.dispatch(key, data)).rejects.toThrow(
        'Job execution failed',
      );

      // 작업 실패 상태 저장 확인
      expect(jobRepository.upsertJobInstance).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          uuid: 'test-uuid',
          name: key,
          step: key,
          state: 'FAILED',
          errorCode: undefined,
          errorMessage: 'Job execution failed',
          elapsedTime: 100,
        }),
      );
    });
  });
});
