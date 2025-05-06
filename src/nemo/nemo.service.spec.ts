import { Test, TestingModule } from '@nestjs/testing';
import { NemoService } from './nemo.service';
import { HttpService } from '@nestjs/axios';
import { NemoConfig } from '../config/NemoConfig';
import { of, throwError } from 'rxjs';
import { InternalServerErrorException } from '@nestjs/common';

describe('NemoService', () => {
  let service: NemoService;
  let httpService: HttpService;

  const mockNemoConfig = {
    url: 'http://nemo-test.url',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NemoService,
        {
          provide: HttpService,
          useValue: {
            post: jest.fn(),
          },
        },
        {
          provide: NemoConfig.KEY,
          useValue: mockNemoConfig,
        },
      ],
    }).compile();

    service = module.get<NemoService>(NemoService);
    httpService = module.get<HttpService>(HttpService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('execute', () => {
    it('성공적으로 니모 API를 호출하고 결과를 반환한다', async () => {
      // Given
      const request = {
        key1: 'key1',
        key2: 'key2',
        config: {
          timeout: 1000,
          memory: 128,
        },
        data: {
          value: 'test',
        },
      };

      const mockResponse = {
        code: '1000',
        message: 'success',
        data: { result: 'OK' },
        techMessage: '',
      };

      jest.spyOn(httpService, 'post').mockReturnValueOnce(
        of({
          data: mockResponse,
          status: 200,
          statusText: 'OK',
          headers: {},
          config: {} as any,
        }),
      );

      // When
      const result = await service.execute(request);

      // Then
      expect(httpService.post).toHaveBeenCalledWith(
        `${mockNemoConfig.url}/execute`,
        request,
      );
      expect(result).toEqual(mockResponse);
    });

    it('니모 API 응답이 성공(1000) 코드가 아닐 경우 예외를 던진다', async () => {
      // Given
      const request = {
        key1: 'key1',
        key2: 'key2',
        config: {
          timeout: 1000,
        },
        data: {
          value: 'test',
        },
      };

      const mockResponse = {
        code: '2000',
        message: 'business error',
        data: null,
        techMessage: 'Something went wrong in business logic',
      };

      jest.spyOn(httpService, 'post').mockReturnValueOnce(
        of({
          data: mockResponse,
          status: 200,
          statusText: 'OK',
          headers: {},
          config: {} as any,
        }),
      );

      // When & Then
      await expect(service.execute(request)).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('니모 API 호출 중 오류가 발생하면 예외를 던진다', async () => {
      // Given
      const request = {
        key1: 'key1',
        key2: 'key2',
        config: {},
        data: {
          value: 'test',
        },
      };

      const errorMessage = 'Network error';
      jest
        .spyOn(httpService, 'post')
        .mockReturnValueOnce(throwError(() => new Error(errorMessage)));

      // When & Then
      await expect(service.execute(request)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });
});
