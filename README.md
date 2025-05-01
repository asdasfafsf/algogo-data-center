## 1. 개요

소규모 환경에서 단일 NestJS 프로세스로 동작하는 linear 배치 워크플로우 설계 문서입니다. Runner 클래스에 `@JobHandler` 데코레이터만 붙이면, NestJS 공식 `DiscoveryService`가 런타임에 자동 스캔하여 등록하고, `BatchService.runAll`에서 순차 실행합니다.

---

## 2. 요구사항

- **스케줄/수동 트리거**: `@Cron` 애너테이션으로 정기 실행, HTTP API 호출(`/batch/run?definitionName=XXX`)로 수동 실행
- **Runner 등록**: Runner 클래스에 `@JobHandler` 데코레이터를 부착하고, `@Injectable()`로 선언하여 모듈의 `providers`에 포함하면 `DiscoveryService`가 런타임에 자동 스캔하여 등록
- **JobHandler 규칙**: `@JobHandler`를 단 클래스는 반드시 `JobRunner` 인터페이스를 구현해야 하고, 입력/출력 타입을 명확히 정의해야 합니다
- **단일 프로세스**: 별도 Orchestrator 없이 `BatchService`에서 순차 호출
- **결과 영속화**: `batch_step_result` 테이블에 단계별 결과 저장
- **확장 대비**: 후에 큐 기반 분산 처리 전환 및 조건 분기 추가 가능

---

## 3. 모듈 구성

### 3.1 DiscoveryModule import

최상위 모듈(`AppModule`)에 `DiscoveryModule`을 import해야 Runner 자동 탐색이 가능합니다.

```ts
@Module({
  imports: [DiscoveryModule /* 기타 모듈 */],
})
export class AppModule {}
```

### 3.2 Runner 포함 모듈 예시

각 도메인별 배치 모듈에서 Runner 클래스만 `providers` 목록에 등록하세요. 데코레이터 스캔이 자동으로 처리합니다.

```ts
@Module({
  providers: [CollectRunner, ProcessRunner, LoadRunner],
})
export class ProblemBatchModule {}
```

### 3.3 Core 엔진

- **JobRegistry**: `DiscoveryService`가 `onModuleInit` 라이프사이클 단계에서 `@JobHandler`가 붙은 모든 Runner를 런타임에 자동 스캔하여 key→인스턴스 매핑을 관리
- **JobDispatcher**: `dispatch(key, data)` 호출 시 Registry에서 Runner를 조회해 `run(data)` 실행
- **BatchService**: `runAll(params)` 메소드에서 순차적으로 Dispatcher를 호출하며, 결과를 DB에 저장 (현재 linear 방식으로 단계 배열은 코드 내 하드코딩)

---

## 4. 실행 흐름

1. **스케줄/HTTP 트리거**: `BatchService.runAll(params)` 호출 (`/batch/run?definitionName=XXX`)
2. **단계 순회**: 코드 내 하드코딩된 Runner 키 배열(`['collect','process','load']`)을 순차적으로 순회
3. **Runner 실행**: `dispatcher.dispatch(key, params)`로 각 Runner `run()` 호출
4. **결과 저장**: `batch_step_result` 테이블에 순차 저장
5. **종료**: 모든 단계 완료 후 프로세스 종료

---

## 5. 데이터베이스 테이블

- **batch_definition**: `id`, `name`, `cron`, `steps(JSON)`
- **batch_instance**: `id`, `definition_id`, `status`, `params`, `started_at`, `finished_at`
- **batch_step_result** (예시)
  | 컬럼 | 타입 | 설명 |
  |-------------------|------------|-----------------------------------|
  | id | BIGSERIAL | PK |
  | batch_instance_id | BIGINT | `batch_instance.id` 참조 |
  | step_key | VARCHAR | 단계 키 |
  | result_payload | JSONB | 단계별 결과 데이터 |
  | created_at | TIMESTAMP | 생성 시각 |

---

## 6. 확장 방안

- **큐 기반 분산 처리**: `QueueDispatcher`로 교체, BullMQ Worker 도입
- **조건 분기·병렬 처리**: DAG Orchestrator 구현을 통해 `batch_definition.steps`에 `nextSteps` 및 `condition` 지원
- **단일 실행 보장**: Redis Redlock 등 분산 락 활용
- **브로커 교체**: Redis Stream → Kafka/RabbitMQ 전환 용이

---

_문서 기준: `@nestjs/core`의 `DiscoveryService`를 활용해 Runner 자동 등록 및 순차적 linear 워크플로우를 구현하는 간결한 배치 시스템 설계_
