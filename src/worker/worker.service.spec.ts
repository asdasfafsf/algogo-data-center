import { Test, TestingModule } from '@nestjs/testing';
import { WorkerService } from './worker.service';
import { DispatcherService } from '../job/dispatcher.service';
import { Job } from 'bullmq';

describe('WorkerService', () => {
  let service: WorkerService;
  let dispatcherService: DispatcherService;

  const mockDispatcherService = {
    dispatch: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkerService,
        {
          provide: DispatcherService,
          useValue: mockDispatcherService,
        },
      ],
    }).compile();

    service = module.get<WorkerService>(WorkerService);
    dispatcherService = module.get<DispatcherService>(DispatcherService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('process', () => {
    it('작업을 성공적으로 처리하고 결과를 반환한다', async () => {
      // Given
      const jobId = 'job-123';
      const jobName = 'TEST_JOB';
      const jobData = { uuid: 'test-uuid', param1: 'value1' };

      const mockJob = {
        id: jobId,
        name: jobName,
        data: jobData,
      } as Job;

      const mockResult = { success: true, data: 'processed' };
      mockDispatcherService.dispatch.mockResolvedValueOnce(mockResult);

      // When
      const result = await service.process(mockJob);

      // Then
      expect(dispatcherService.dispatch).toHaveBeenCalledWith(jobName, jobData);
      expect(result).toEqual(mockResult);
    });

    it('작업 처리 중 오류가 발생하면 예외를 다시 던진다', async () => {
      // Given
      const jobId = 'job-123';
      const jobName = 'ERROR_JOB';
      const jobData = { uuid: 'test-uuid', param1: 'value1' };

      const mockJob = {
        id: jobId,
        name: jobName,
        data: jobData,
      } as Job;

      const error = new Error('Job processing failed');
      mockDispatcherService.dispatch.mockRejectedValueOnce(error);

      // When & Then
      await expect(service.process(mockJob)).rejects.toThrow(
        'Job processing failed',
      );
      expect(dispatcherService.dispatch).toHaveBeenCalledWith(jobName, jobData);
    });
  });
});
