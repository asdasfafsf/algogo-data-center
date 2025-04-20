import { Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import { NemoRequest } from './types/request';
import { NemoResponse } from './types/response';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { NemoConfig } from 'src/config/NemoConfig';
import { ConfigType } from '@nestjs/config';

@Injectable()
export class NemoService {
  constructor(
    @Inject(NemoConfig.KEY) private readonly nemoConfig: ConfigType<typeof NemoConfig>,
    private readonly httpService: HttpService,
  ) {}

  async execute<T, R>(request: NemoRequest<T>): Promise<NemoResponse<R>> {
    try {
        const response = await lastValueFrom(
            this.httpService.post<NemoResponse<R>>(
                `${this.nemoConfig.url}/execute`,
                request,
            ),
        );
        return response.data;
    } catch (e) {
        throw new InternalServerErrorException('서버 내부 오류가 발생하였습니다.');
    }
  }
}
