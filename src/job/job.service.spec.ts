import { JobService } from './job.service';
import { NotFoundException } from '@nestjs/common';

describe('JobService', () => {
  let service: JobService;
  let jobRepository: any;

  beforeEach(() => {
    jobRepository = {
      createJobDefinition: jest.fn(),
      deleteJobDefinition: jest.fn(),
      findAllJobDefinition: jest.fn(),
      findJobDefinitionByNo: jest.fn(),
    };
    service = new JobService(jobRepository);
  });

  describe('createJobDefinition', () => {
    it('정상적으로 jobDefinition을 생성한다', async () => {
      const dto = { name: 'test', description: 'desc', stepList: [] };
      jobRepository.createJobDefinition.mockResolvedValue('created');
      const result = await service.createJobDefinition(dto);
      expect(jobRepository.createJobDefinition).toHaveBeenCalledWith(dto);
      expect(result).toBe('created');
    });
  });

  describe('deleteJobDefinition', () => {
    it('정상적으로 jobDefinition을 삭제한다', async () => {
      jobRepository.deleteJobDefinition.mockResolvedValue('deleted');
      const result = await service.deleteJobDefinition(1);
      expect(jobRepository.deleteJobDefinition).toHaveBeenCalledWith(1);
      expect(result).toBe('deleted');
    });
  });

  describe('getJobDefinitions', () => {
    it('jobDefinitions가 있으면 반환한다', async () => {
      jobRepository.findAllJobDefinition.mockResolvedValue([{ no: 1 }]);
      const result = await service.getJobDefinitions();
      expect(jobRepository.findAllJobDefinition).toHaveBeenCalled();
      expect(result).toEqual([{ no: 1 }]);
    });

    it('jobDefinitions가 없으면 NotFoundException을 던진다', async () => {
      jobRepository.findAllJobDefinition.mockResolvedValue([]);
      await expect(service.getJobDefinitions()).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getJobDefinitionByNo', () => {
    it('jobDefinition이 있으면 반환한다', async () => {
      jobRepository.findJobDefinitionByNo.mockResolvedValue({ no: 1 });
      const result = await service.getJobDefinitionByNo(1);
      expect(jobRepository.findJobDefinitionByNo).toHaveBeenCalledWith(1);
      expect(result).toEqual({ no: 1 });
    });

    it('jobDefinition이 없으면 NotFoundException을 던진다', async () => {
      jobRepository.findJobDefinitionByNo.mockResolvedValue(undefined);
      await expect(service.getJobDefinitionByNo(1)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
