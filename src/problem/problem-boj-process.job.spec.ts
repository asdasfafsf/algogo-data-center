import { Test, TestingModule } from '@nestjs/testing';
import { ProblemBojProcessJob } from './problem-boj-process.job';
import { S3Service } from '../s3/s3.service';
import { AcmicpcResponse } from './types/acmicpc.type';

describe('ProblemBojProcessJob', () => {
  let job: ProblemBojProcessJob;
  let s3Service: S3Service;

  // 모의 S3Service 생성
  const mockS3Service = {
    uploadFile: jest.fn(),
  };

  // 전역 fetch 모킹 설정
  global.fetch = jest.fn();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProblemBojProcessJob,
        {
          provide: S3Service,
          useValue: mockS3Service,
        },
      ],
    }).compile();

    job = module.get<ProblemBojProcessJob>(ProblemBojProcessJob);
    s3Service = module.get<S3Service>(S3Service);

    // 모든 모킹 초기화
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(job).toBeDefined();
  });

  describe('downloadImage', () => {
    it('외부 이미지를 성공적으로 다운로드한다', async () => {
      // Given
      const imageUrl = 'https://example.com/image.png';
      const mockArrayBuffer = new ArrayBuffer(8);

      (fetch as jest.Mock).mockResolvedValueOnce({
        arrayBuffer: jest.fn().mockResolvedValueOnce(mockArrayBuffer),
      });

      // When
      const result = await job.downloadImage(imageUrl);

      // Then
      expect(result).toBeInstanceOf(Buffer);
    });
  });

  describe('processImage', () => {
    it('HTML에서 이미지를 추출하고 S3에 업로드한 후 URL을 교체한다', async () => {
      // Given
      const fileName = 'BOJ/1000/content';
      const htmlWithImage =
        '<div><img src="https://example.com/image.png" alt="test"></div>';
      const mockBuffer = Buffer.from('test image');

      // downloadImage 모킹
      jest.spyOn(job, 'downloadImage').mockResolvedValueOnce(mockBuffer);

      // S3 업로드 모킹
      mockS3Service.uploadFile.mockResolvedValueOnce({
        url: 'https://s3.example.com/BOJ/1000/content_1.png',
      });

      // When
      const result = await job.processImage(htmlWithImage, fileName);

      // Then
      expect(job.downloadImage).toHaveBeenCalledWith(
        'https://example.com/image.png',
      );
      expect(s3Service.uploadFile).toHaveBeenCalledWith(
        mockBuffer,
        'BOJ/1000/content_1.png',
      );
      expect(result).toContain('https://s3.example.com/BOJ/1000/content_1.png');
    });

    it('이미지가 없는 HTML은 변경 없이 반환한다', async () => {
      // Given
      const fileName = 'BOJ/1000/content';
      const htmlWithoutImage = '<div>No image here</div>';

      // When
      const result = await job.processImage(htmlWithoutImage, fileName);

      // Then
      expect(result).toBe(htmlWithoutImage);
    });

    it('여러 이미지가 있는 HTML을 모두 처리한다', async () => {
      // Given
      const fileName = 'BOJ/1000/content';
      const htmlWithMultipleImages =
        '<div><img src="https://example.com/image1.png"><img src="https://example.com/image2.png"></div>';
      const mockBuffer = Buffer.from('test image');

      // downloadImage 모킹
      jest
        .spyOn(job, 'downloadImage')
        .mockResolvedValueOnce(mockBuffer)
        .mockResolvedValueOnce(mockBuffer);

      // S3 업로드 모킹
      mockS3Service.uploadFile
        .mockResolvedValueOnce({
          url: 'https://s3.example.com/BOJ/1000/content_1.png',
        })
        .mockResolvedValueOnce({
          url: 'https://s3.example.com/BOJ/1000/content_2.png',
        });

      // When
      const result = await job.processImage(htmlWithMultipleImages, fileName);

      // Then
      expect(job.downloadImage).toHaveBeenCalledTimes(2);
      expect(s3Service.uploadFile).toHaveBeenCalledTimes(2);
      expect(result).toContain('https://s3.example.com/BOJ/1000/content_1.png');
      expect(result).toContain('https://s3.example.com/BOJ/1000/content_2.png');
    });
  });

  describe('run', () => {
    it('문제 데이터의 모든 HTML 필드의 이미지를 처리한다', async () => {
      // Given
      const sourceData: AcmicpcResponse = {
        source: 'BOJ',
        sourceId: '1000',
        title: 'A+B',
        html: '',
        key: '1000',
        level: 1,
        levelText: '브론즈5',
        typeList: ['수학'],
        answerRate: 50.0,
        submitCount: 1000,
        timeout: 1000,
        additionalTimeAllowed: false,
        memoryLimit: 128,
        answerCount: 500,
        answerPeopleCount: 400,
        content: '<div><img src="https://example.com/image.png"></div>',
        input: '<div>입력 설명</div>',
        output: '<div>출력 설명</div>',
        limit: '<div>제한사항</div>',
        hint: '<div><img src="https://example.com/hint.png"></div>',
        etc: '',
        sourceUrl: 'https://boj.kr/1000',
        inputOutputList: [
          {
            input: '1 2',
            output: '3',
            content: '<div><img src="https://example.com/example.png"></div>',
            order: 0,
          },
        ],
        subTask: '',
        protocol: '',
        isSpecialJudge: false,
        isSubTask: false,
        isFunction: false,
        isInteractive: false,
        isTwoStep: false,
        isClass: false,
      };

      // processImage 모킹
      jest
        .spyOn(job, 'processImage')
        .mockResolvedValue('<div>처리된 이미지</div>');

      // When
      const result = await job.run(sourceData);

      // Then
      expect(job.processImage).toHaveBeenCalledTimes(7); // 6개 필드 + 1개 inputOutputList 항목
      expect(job.processImage).toHaveBeenCalledWith(
        sourceData.content,
        'BOJ/1000/content',
      );
      expect(job.processImage).toHaveBeenCalledWith(
        sourceData.hint,
        'BOJ/1000/hint',
      );
      expect(job.processImage).toHaveBeenCalledWith(
        sourceData.inputOutputList[0].content,
        'BOJ/1000/inputoutput0',
      );

      expect(result).not.toBe(sourceData); // 새 객체가 반환되어야 함
      expect(result.content).toBe('<div>처리된 이미지</div>');
      expect(result.inputOutputList[0].content).toBe(
        '<div>처리된 이미지</div>',
      );
    });
  });
});
