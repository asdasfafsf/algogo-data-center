import { DispatcherService } from './dispatcher.service';

// getElapsedTime을 mock 처리 (실제 서비스처럼 0 반환)
jest.mock('../common/date', () => ({
  getElapsedTime: jest.fn(() => 0),
}));

describe('DispatcherService', () => {
  let service: DispatcherService;
  let jobRepository: any;
  let jobRegistry: any;

  beforeEach(() => {
    jobRepository = { upsertJobInstance: jest.fn() };
    jobRegistry = { get: jest.fn() };
    service = new DispatcherService(jobRepository, jobRegistry);
    jest.clearAllMocks();
  });

  it('정상적으로 job이 실행되고 SUCCESS로 기록된다', async () => {
    const jobMock = { run: jest.fn().mockResolvedValue('ok') };
    jobRegistry.get.mockReturnValue(jobMock);

    const param = { data: { foo: 1 }, uuid: 'abc' };
    const key = 'PROBLEM_BOJ_COLLECT';
    const result = await service.dispatch(key, param);

    expect(jobRepository.upsertJobInstance).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        uuid: 'abc',
        startedAt: expect.any(Date),
        state: 'RUNNING',
      }),
    );
    expect(jobRegistry.get).toHaveBeenCalledWith(key);
    expect(jobMock.run).toHaveBeenCalledWith({ foo: 1 });
    expect(jobRepository.upsertJobInstance).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        uuid: 'abc',
        finishedAt: expect.any(Date),
        elapsedTime: 0,
        state: 'SUCCESS',
        result: 'ok',
      }),
    );
    expect(result).toBe('ok');
  });

  it('job이 없으면 NotFoundException 발생 및 FAILED로 기록된다', async () => {
    jobRegistry.get.mockReturnValue(undefined);

    const param = { data: { foo: 1 }, uuid: 'abc' };
    const key = 'PROBLEM_BOJ_COLLECT';
    await service.dispatch(key, param);

    expect(jobRepository.upsertJobInstance).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        uuid: 'abc',
        startedAt: expect.any(Date),
        state: 'RUNNING',
      }),
    );
    expect(jobRepository.upsertJobInstance).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        uuid: 'abc',
        finishedAt: expect.any(Date),
        elapsedTime: 0,
        state: 'FAILED',
        errorMessage: expect.stringContaining('Job not found'),
      }),
    );
  });

  it('job.run에서 에러 발생 시 FAILED로 기록된다', async () => {
    const jobMock = {
      run: jest.fn().mockRejectedValue({ code: 'ERR', message: '실패' }),
    };
    jobRegistry.get.mockReturnValue(jobMock);

    const param = { data: { foo: 1 }, uuid: 'abc' };
    const key = 'PROBLEM_BOJ_COLLECT';
    await service.dispatch(key, param);

    expect(jobRepository.upsertJobInstance).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        uuid: 'abc',
        startedAt: expect.any(Date),
        state: 'RUNNING',
      }),
    );
    expect(jobMock.run).toHaveBeenCalledWith({ foo: 1 });
    expect(jobRepository.upsertJobInstance).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        uuid: 'abc',
        finishedAt: expect.any(Date),
        elapsedTime: 0,
        state: 'FAILED',
        errorCode: 'ERR',
        errorMessage: '실패',
      }),
    );
  });
});
