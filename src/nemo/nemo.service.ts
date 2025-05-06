import {
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { NemoRequest } from './types/request';
import { NemoResponse } from './types/response';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { NemoConfig } from '../config/NemoConfig';
import { ConfigType } from '@nestjs/config';

@Injectable()
export class NemoService {
  private readonly logger = new Logger(NemoService.name);

  constructor(
    @Inject(NemoConfig.KEY)
    private readonly nemoConfig: ConfigType<typeof NemoConfig>,
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

      this.logger.log(response.data);

      if (response.data.code !== '1000') {
        throw new InternalServerErrorException(response.data.techMessage);
      }
      return response.data;
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }
}
