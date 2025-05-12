import { Test, TestingModule } from '@nestjs/testing';
import { S3Service } from './s3.service';
import { S3Config } from '../config/S3Config';
import { S3 } from '@aws-sdk/client-s3';

// AWS SDK mock
jest.mock('@aws-sdk/client-s3', () => {
  return {
    S3: jest.fn().mockImplementation(() => ({
      send: jest.fn().mockResolvedValue({}),
    })),
    PutObjectCommand: jest.fn().mockImplementation((params) => params),
  };
});

describe('S3Service', () => {
  let service: S3Service;

  const mockS3Config = {
    region: 'test-region',
    accessKey: 'test-access-key',
    secretKey: 'test-secret-key',
    bucketName: 'test-bucket',
    endpoint: 'https://test-endpoint.com',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        S3Service,
        {
          provide: S3Config.KEY,
          useValue: mockS3Config,
        },
      ],
    }).compile();

    service = module.get<S3Service>(S3Service);
    await service.onModuleInit(); // 수동으로 초기화 호출
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should initialize S3 client on module init', () => {
    expect(S3).toHaveBeenCalledWith({
      region: mockS3Config.region,
      forcePathStyle: true,
      endpoint: mockS3Config.endpoint,
      credentials: {
        accessKeyId: mockS3Config.accessKey,
        secretAccessKey: mockS3Config.secretKey,
      },
    });
  });

  it('should upload file and return URL', async () => {
    const file = Buffer.from('test file content');
    const key = 'test/file.jpg';
    const contentType = 'image/jpeg';

    const result = await service.uploadFile(file, key, contentType);

    // URL 형식 확인
    expect(result).toEqual({
      url: `${mockS3Config.endpoint}/${mockS3Config.bucketName}/${key}`,
    });
  });
});
