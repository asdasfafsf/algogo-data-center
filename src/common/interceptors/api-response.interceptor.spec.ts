import { ApiResponseInterceptor } from './api-response.interceptor';
import { CallHandler, ExecutionContext } from '@nestjs/common';
import { of } from 'rxjs';

describe('ApiResponseInterceptor', () => {
  let interceptor: ApiResponseInterceptor;

  beforeEach(() => {
    interceptor = new ApiResponseInterceptor();
  });

  it('컨트롤러 반환값을 { code, message, data }로 감싼다', (done) => {
    const mockContext = {} as ExecutionContext;
    const mockData = { foo: 'bar' };
    const callHandler: CallHandler = {
      handle: () => of(mockData),
    };

    const result$ = interceptor.intercept(mockContext, callHandler);

    result$.subscribe((result) => {
      expect(result).toEqual({
        code: 'SUCCESS',
        message: '성공',
        data: { foo: 'bar' },
      });
      done();
    });
  });
});
