// src/batch/batch.controller.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { BatchController } from './batch.controller';
import { BatchService } from './batch.service';
import { CreateBatchDefinitionDto } from './dto/create-batch-definition.dto';
import { ValidationPipe } from '@nestjs/common';

describe('BatchController', () => {
  let controller: BatchController;
  let service: BatchService;

  const mockBatchService = {
    findAllBatchDefinition: jest.fn(),
    saveBatchDefinition: jest.fn(),
    deleteBatchDefinition: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BatchController],
      providers: [
        {
          provide: BatchService,
          useValue: mockBatchService,
        },
      ],
    }).compile();

    controller = module.get<BatchController>(BatchController);
    service = module.get<BatchService>(BatchService);
  });

  describe('getBatchDefinitions', () => {
    it('배치 작업 정의 목록을 성공적으로 조회해야 한다', async () => {
      // Given
      const mockDefinitions = [
        {
          no: 1,
          name: 'PROBLEM_BOJ',
          description: '테스트 설명',
          cron: '0 0 * * *',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      mockBatchService.findAllBatchDefinition.mockResolvedValue(
        mockDefinitions,
      );

      // When
      const result = await controller.getBatchDefinitions();

      // Then
      expect(result).toEqual(mockDefinitions);
      expect(service.findAllBatchDefinition).toHaveBeenCalled();
    });
  });

  describe('createBatchDefinition', () => {
    it('유효한 데이터로 배치 작업 정의를 생성해야 한다', async () => {
      // Given
      const validDto: CreateBatchDefinitionDto = {
        name: 'PROBLEM_BOJ',
        description: '테스트 설명',
        cron: '0 0 * * *',
      };

      // When
      await controller.createBatchDefinition(validDto);

      // Then
      expect(service.saveBatchDefinition).toHaveBeenCalledWith(validDto);
    });

    it('잘못된 name으로 요청 시 400 에러를 반환해야 한다', async () => {
      // Given
      const invalidDto: CreateBatchDefinitionDto = {
        name: 'INVALID_NAME',
        description: '테스트 설명',
        cron: '0 0 * * *',
      };

      // When & Then
      await expect(
        new ValidationPipe().transform(invalidDto, {
          type: 'body',
          metatype: CreateBatchDefinitionDto,
        }),
      ).rejects.toThrow();
    });

    it('잘못된 cron 표현식으로 요청 시 400 에러를 반환해야 한다', async () => {
      // Given
      const invalidDto: CreateBatchDefinitionDto = {
        name: 'PROBLEM_BOJ',
        description: '테스트 설명',
        cron: 'invalid cron',
      };

      // When & Then
      await expect(
        new ValidationPipe().transform(invalidDto, {
          type: 'body',
          metatype: CreateBatchDefinitionDto,
        }),
      ).rejects.toThrow();
    });

    it('설명이 500자를 초과하면 400 에러를 반환해야 한다', async () => {
      // Given
      const invalidDto: CreateBatchDefinitionDto = {
        name: 'PROBLEM_BOJ',
        description: 'a'.repeat(501),
        cron: '0 0 * * *',
      };

      // When & Then
      await expect(
        new ValidationPipe().transform(invalidDto, {
          type: 'body',
          metatype: CreateBatchDefinitionDto,
        }),
      ).rejects.toThrow();
    });
  });

  describe('deleteBatchDefinition', () => {
    it('유효한 번호로 배치 작업 정의를 삭제해야 한다', async () => {
      // Given
      const validNo = 1;

      // When
      const result = await controller.deleteBatchDefinition(validNo);

      // Then
      expect(result).toBeUndefined();
      expect(service.deleteBatchDefinition).toHaveBeenCalledWith(validNo);
    });
  });
});
