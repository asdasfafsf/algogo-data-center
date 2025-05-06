import { OrchestratorService } from './orchestrator.service';
import { NotFoundException } from '@nestjs/common';

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
    config = { queueName: 'test-queue' };

    service = new OrchestratorService(repo, cache, config, flowProducer);
  });

  describe('getJobDefinition', () => {
    it('should return from cache if present', async () => {
      cache.get.mockResolvedValue(JSON.stringify({ stepList: ['dummy'] }));

      const res = await service.getJobDefinition('job1');

      expect(res).toEqual({ stepList: ['dummy'] });
      expect(repo.findJobDefinition).not.toHaveBeenCalled();
    });

    it('should get from repo and cache it if not in cache', async () => {
      cache.get.mockResolvedValue(null);
      repo.findJobDefinition.mockResolvedValue({ stepList: ['repoStep'] });

      const res = await service.getJobDefinition('job2');

      expect(res).toEqual({ stepList: ['repoStep'] });
      expect(cache.set).toHaveBeenCalledWith(
        'jobDefinition:job2',
        JSON.stringify({ stepList: ['repoStep'] }),
      );
    });

    it('should throw NotFoundException if not in cache or repo', async () => {
      cache.get.mockResolvedValue(null);
      repo.findJobDefinition.mockResolvedValue(null);

      await expect(service.getJobDefinition('none')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('generateJob', () => {
    it('should create nested job options from stepList with step1 as root', async () => {
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

  describe('orchestrate', () => {
    it('should orchestrate jobs properly', async () => {
      const jobDef = { stepList: [{ name: 's1' }, { name: 's2' }] };

      service.getJobDefinition = jest.fn().mockResolvedValue(jobDef);
      service.generateJob = jest.fn().mockResolvedValue({ name: 'jobOption' });

      await service.orchestrate('test', { foo: 'bar' });

      expect(service.getJobDefinition).toHaveBeenCalledWith('test');
      expect(service.generateJob).toHaveBeenCalledWith(
        jobDef.stepList,
        expect.objectContaining({ foo: 'bar', uuid: expect.any(String) }),
      );
      expect(flowProducer.add).toHaveBeenCalledWith({ name: 'jobOption' });
    });
  });
});
