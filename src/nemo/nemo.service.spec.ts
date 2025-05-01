import { Test, TestingModule } from '@nestjs/testing';
import { NemoService } from './nemo.service';

describe('NemoService', () => {
  let service: NemoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [NemoService],
    }).compile();

    service = module.get<NemoService>(NemoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
