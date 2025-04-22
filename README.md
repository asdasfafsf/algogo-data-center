## 1. 개요

단일 워커 프로세스에서 NestJS Discovery 기반 Runner 자동 등록 구조로 배치 실행 설계를 정리한 문서입니다.

---

## 2. 요구사항

- **스케줄/요청 트리거**: `@Cron` 데코레이터를 통한 스케줄 실행 및 HTTP 엔드포인트(`/batch/run`) 제공
- **자동 Runner 등록**: `@JobHandler` 데코레이터와 `nestjs-discovery`를 사용해 Runner 클래스를 런타임에 자동 스캔·등록
- **단일 프로세스 통합**: Orchestrator 로직, Dispatcher, Runner 모두 하나의 NestJS 프로세스 내에서 수행
- **단계별 결과 영속화**: `batch_step_result` 테이블에 단계별 결과 저장 및 조회 지원
- **확장 대비**: 이후 QueueDispatcher 교체나 DAG 확장을 쉽게 도입 가능

---

## 3. 아키텍처 구성

### 3.1 Discovery 설정

```bash
npm install @golevelup/nestjs-discovery reflect-metadata
```

```ts
// AppModule
import 'reflect-metadata';
import { DiscoveryModule } from '@golevelup/nestjs-discovery';

@Module({
  imports: [DiscoveryModule /* 다른 모듈들 */],
})
export class AppModule {}
```

### 3.2 Runner 데코레이터

```ts
import 'reflect-metadata';
export const JOB_KEY = Symbol('JOB_KEY');
export function JobHandler(key: string): ClassDecorator {
  return (target) => Reflect.defineMetadata(JOB_KEY, key, target);
}
```

- 각 Runner 클래스에 `@JobHandler('collect')` 등으로 키를 메타데이터에 저장

### 3.3 Core 엔진

- **JobRegistry**: `DiscoveryService.providersWithMetaAtKey(JOB_KEY)` 를 통해 모든 `@JobHandler` 프로바이더를 스캔해 `Map<key, instance>`에 저장
- **JobDispatcher**: `dispatch<T,R>(key, data)` 호출 시 Registry에서 해당 Runner를 꺼내 `run(data)` 실행
- **BatchScheduler**: `@Cron` 애너테이션을 사용해 `BatchService.runAll()` 주기 실행
- **BatchController**: `/batch/run` POST 요청으로 `BatchService.runAll()` 수동 실행

```ts
@Injectable()
export class JobRegistry implements OnModuleInit {
  private runners = new Map<string, JobRunner<any, any>>();
  constructor(private discovery: DiscoveryService) {}

  async onModuleInit() {
    const entries = await this.discovery.providersWithMetaAtKey(JOB_KEY);
    for (const { instance, metaValue: key } of entries) {
      this.runners.set(key, instance as JobRunner<any, any>);
    }
  }

  get<T, R>(key: string): JobRunner<T, R> {
    const runner = this.runners.get(key);
    if (!runner) throw new Error(`Unknown job key: ${key}`);
    return runner as JobRunner<T, R>;
  }
}
```

---

## 4. 데이터베이스 테이블

- **batch_definition**: id, name, cron, steps(JSON)
- **batch_instance**: id, definition_id, status, params, started_at, finished_at
- **batch_step_result**
  > _예시 스키마_
  > | 컬럼 | 타입 | 설명 |
  > |-------------------|------------|---------------------------------------|
  > | id | BIGSERIAL | PK |
  > | batch_instance_id | BIGINT | `batch_instance.id` 참조 |
  > | step_key | VARCHAR | 단계 키(collect, process, load 등) |
  > | result_payload | JSONB | 단계별 결과 데이터 |
  > | created_at | TIMESTAMP | 생성 시각 |

---

## 5. 실행 흐름

1. **스케줄/HTTP 트리거**: `BatchScheduler.handleCron()` 또는 `BatchController.runAll()` 호출
2. **BatchService.runAll(params)**
   ```ts
   for (const key of ['collect', 'process', 'load']) {
     const result = await dispatcher.dispatch(key, params);
     await stepResultRepo.save({ batchInstanceId, stepKey: key, result });
   }
   ```
3. 각 단계별 Runner(`@JobHandler`)가 `run()` 메소드에서 실제 비즈니스 로직 수행
4. 결과는 `batch_step_result` 테이블에 저장

---

## 6. 확장 방안

- **Queue 기반 분산 처리**: `DirectDispatcher` → `QueueDispatcher` 교체, BullMQ Worker 도입
- **DAG 확장**: `batch_definition.steps`에 `nextSteps`, `condition` 메타데이터 추가
- **Leader Election**: Redis Redlock 등으로 Cron 단일 실행 보장
- **외부 브로커**: Redis Stream → Kafka/RabbitMQ 전환 용이

---

_문서 기준: Discovery 기반 자동 Runner 등록으로 통일. 다른 방식은 생략._
