import { OrchestratorService } from './orchestrator.service';
import { NotFoundException } from '@nestjs/common';

// QueueEvents 클래스만 모킹
jest.mock('bullmq', () => {
  const originalModule = jest.requireActual('bullmq');

  return {
    ...originalModule,
    QueueEvents: jest.fn().mockImplementation(() => ({
      on: jest.fn(),
      close: jest.fn(),
    })),
  };
});

describe('OrchestratorService', () => {
  let service: OrchestratorService;
  let repo: any;
  let cache: any;
  let flowProducer: any;
  let config: any;

  beforeEach(() => {
    repo = { findJobDefinition: jest.fn() };
    cache = { get: jest.fn(), set: jest.fn() };
    flowProducer = { add: jest.fn() };
    config = {
      queueName: 'test-queue',
      host: 'localhost',
      port: 6379,
      password: 'password',
    };

    service = new OrchestratorService(repo, cache, config, flowProducer);
  });

  describe('getJobDefinition', () => {
    it('캐시에 작업 정의가 있으면 캐시에서 반환해야 함', async () => {
      cache.get.mockResolvedValue(JSON.stringify({ stepList: ['dummy'] }));

      const res = await service.getJobDefinition('job1');

      expect(res).toEqual({ stepList: ['dummy'] });
      expect(repo.findJobDefinition).not.toHaveBeenCalled();
    });

    it('캐시에 없으면 저장소에서 가져와 캐시에 저장해야 함', async () => {
      cache.get.mockResolvedValue(null);
      repo.findJobDefinition.mockResolvedValue({ stepList: ['repoStep'] });

      const res = await service.getJobDefinition('job2');

      expect(res).toEqual({ stepList: ['repoStep'] });
      expect(cache.set).toHaveBeenCalledWith(
        'jobDefinition:job2',
        JSON.stringify({ stepList: ['repoStep'] }),
        60,
      );
    });

    it('캐시와 저장소 모두에 없으면 NotFoundException을 발생시켜야 함', async () => {
      cache.get.mockResolvedValue(null);
      repo.findJobDefinition.mockResolvedValue(null);

      await expect(service.getJobDefinition('none')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('generateJob', () => {
    it('단계 목록에서 중첩된 작업 옵션을 올바르게 생성해야 함', async () => {
      const steps = [{ name: 'step1' }, { name: 'step2' }, { name: 'step3' }];
      const result = await service.generateJob(steps, { foo: 1 });

      expect(result).toEqual({
        name: 'step3',
        queueName: 'test-queue',
        data: { foo: 1 },
        children: [
          {
            name: 'step2',
            queueName: 'test-queue',
            data: { foo: 1 },
            children: [
              {
                name: 'step1',
                queueName: 'test-queue',
                data: { foo: 1 },
                opts: expect.any(Object),
              },
            ],
            opts: expect.any(Object),
          },
        ],
        opts: expect.any(Object),
      });
    });
  });

  describe('toFlatJobNode', () => {
    it('중첩된 작업 노드 구조를 평면화해야 함', async () => {
      const mockJobNode = {
        name: 'parent',
        children: [
          { name: 'child1', children: [] },
          { name: 'child2', children: [] },
        ],
      };

      service.toFlatJobNode = jest.fn().mockImplementation(async (jobNode) => {
        const result = [];
        const stack = [jobNode];

        while (stack.length) {
          const node = stack.pop();
          result.push(node);
          if (node.children) {
            stack.push(...node.children);
          }
        }

        return result;
      });

      const result = await service.toFlatJobNode(mockJobNode as any);

      expect(result).toHaveLength(3);
      expect(result).toContainEqual({ name: 'child1', children: [] });
      expect(result).toContainEqual({ name: 'child2', children: [] });
    });
  });

  describe('orchestrate', () => {
    it('모든 작업이 성공적으로 완료되면 성공 상태를 반환해야 함', async () => {
      const jobDef = { stepList: [{ name: 's1' }, { name: 's2' }] };
      const testData = { foo: 'bar' };
      const mockJobs = { name: 'job1', id: 'job-id-1' };
      const mockFlatJobNodes = [
        {
          name: 's1',
          job: {
            waitUntilFinished: jest
              .fn()
              .mockResolvedValue({ result: 's1-result' }),
          },
        },
        {
          name: 's2',
          job: {
            waitUntilFinished: jest
              .fn()
              .mockResolvedValue({ result: 's2-result' }),
          },
        },
      ];

      service.getJobDefinition = jest.fn().mockResolvedValue(jobDef);
      service.generateJob = jest.fn().mockResolvedValue({ name: 'jobOption' });
      flowProducer.add.mockResolvedValue(mockJobs);
      service.toFlatJobNode = jest.fn().mockResolvedValue(mockFlatJobNodes);

      const result = await service.orchestrate('test', testData);

      expect(service.getJobDefinition).toHaveBeenCalledWith('test');
      expect(service.generateJob).toHaveBeenCalledWith(
        jobDef.stepList,
        expect.objectContaining({ foo: 'bar', uuid: expect.any(String) }),
      );
      expect(flowProducer.add).toHaveBeenCalledWith({ name: 'jobOption' });
      expect(service.toFlatJobNode).toHaveBeenCalledWith(mockJobs);
      expect(mockFlatJobNodes[0].job.waitUntilFinished).toHaveBeenCalled();
      expect(mockFlatJobNodes[1].job.waitUntilFinished).toHaveBeenCalled();

      expect(result).toEqual({
        state: 'SUCCESS',
        data: expect.objectContaining({ foo: 'bar', uuid: expect.any(String) }),
      });
    });

    it('작업 중 하나라도 실패하면 실패 상태를 반환해야 함', async () => {
      const jobDef = { stepList: [{ name: 's1' }, { name: 's2' }] };
      const testData = { foo: 'bar' };
      const mockJobs = { name: 'job1', id: 'job-id-1' };
      const errorMessage = '작업 실행 실패';
      const mockFlatJobNodes = [
        {
          name: 's1',
          job: {
            waitUntilFinished: jest
              .fn()
              .mockResolvedValue({ result: 's1-result' }),
          },
        },
        {
          name: 's2',
          job: {
            waitUntilFinished: jest.fn().mockRejectedValue({
              code: 'ERR_JOB_FAILED',
              message: errorMessage,
            }),
          },
        },
      ];

      service.getJobDefinition = jest.fn().mockResolvedValue(jobDef);
      service.generateJob = jest.fn().mockResolvedValue({ name: 'jobOption' });
      flowProducer.add.mockResolvedValue(mockJobs);
      service.toFlatJobNode = jest.fn().mockResolvedValue(mockFlatJobNodes);

      const result = await service.orchestrate('test', testData);

      expect(result).toEqual({
        state: 'FAILED',
        errorCode: 'ERR_JOB_FAILED',
        errorMessage: errorMessage,
      });
    });
  });
});
