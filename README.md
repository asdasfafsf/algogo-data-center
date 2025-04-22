## 1. 개요

지금까지 논의된 배치 설계를 현 상황(단일 워커 자체 실행) 기준으로 정리한 문서

---

## 2. 요구사항

- **스케줄/요청 트리거**: Cron 스케줄(`@Cron`)과 HTTP 수동 호출 지원
- **유연한 단계 정의**: 실행 순서(collect→process→load 등)를 코드나 설정으로 관리
- **단일 프로세스 통합**: 별도 Orchestrator 서비스 없이 워커 하나에서 모든 로직 수행
- **단계별 결과 영속화**: 중간 결과를 테이블(`batch_step_result`)에 저장·조회
- **확장 대비**: 후에 Queue 기반 분산 처리나 DAG 확장이 가능하도록 구조화

---

## 3. 아키텍처 구성

### 3.1 단일 워커 + 통합 오케스트레이션

- NestJS 프로세스 하나 안에서:
  1. 스케줄러(`@Cron`)로 실행 시점 트리거
  2. Orchestrator가 배치 정의(`batch_definition`) 로드 후 재귀 실행
  3. JobDispatcher(DirectDispatcher)가 Runner 실행
  4. Runner는 Collect/Process/Load 등의 비즈니스 로직 수행
  5. `batch_step_result` 테이블에 단계별 결과 저장
- HTTP 컨트롤러로 수동 호출 지원 (`BatchController.runAll`)

---

## 4. 데이터베이스 테이블

- **batch_definition**
  - id, name, cron, steps(JSON 배열 of { key, nextSteps?: string[] })
- **batch_instance**
  - id, definition_id, status, params, started_at, finished_at
- **batch_step_result**
  > **참고**: 아래 테이블 스키마는 예시이며, 실제 프로젝트 요구사항에 따라 수정 필요

| 컬럼              | 타입      | 설명                               |
| ----------------- | --------- | ---------------------------------- |
| id                | BIGSERIAL | PK                                 |
| batch_instance_id | BIGINT    | `batch_instance.id` 참조           |
| step_key          | VARCHAR   | 단계 키(collect, process, load 등) |
| result_payload    | JSONB     | 단계별 결과 데이터                 |
| created_at        | TIMESTAMP | 생성 시각                          |

---

## 5. 실행 흐름

1. **Cron/HTTP 트리거**: `BatchScheduler.handleCron()` 또는 `BatchController.runAll()` 호출
2. **Orchestrator.execute()**
   - `batch_definition` 로드
   - `runStep(definition, rootSteps, initialContext)` 시작
3. **runStep 함수**
   - 각 `step`에 대해:
     - `dispatcher.dispatch(step.key, context)` 호출
     - 반환값을 `batch_step_result`에 저장
     - `nextSteps` 조회 후 재귀 호출
4. **Runner 실행**: `CollectRunner`, `ProcessRunner`, `LoadRunner` 등에서 비즈니스 로직 수행
5. **중간 결과 저장**: `batch_step_result` 테이블로 복구·디버깅 지원

---

## 6. 확장 방안

- **Queue 기반 분산 처리**: `DirectDispatcher` → `QueueDispatcher` 교체, BullMQ Worker 도입
- **DAG 확장**: `batch_definition.steps`에 `condition`, `parallel`, `fanIn` 메타데이터 추가
- **Leader Election**: 여러 인스턴스 중 하나만 Cron/Orchestrator 실행
- **외부 브로커**: Redis Stream → Kafka/RabbitMQ 교체

---

## 7. 초기 구현 vs 향후 확장

### 7.1 초기 구현 (단일 워커 + Cron 통합)

- `@Cron('0 0 * * *')` 스케줄러로 Orchestrator 호출
- `BatchService.runAll()` 내부에서 `dispatcher.dispatch('collect') → dispatch('process') → dispatch('load')` 순차 실행
- Orchestrator 재귀적 `runStep` 로직으로 동적 단계 실행
- HTTP 트리거 `/batch/run` 지원

### 7.2 향후 확장

- Orchestrator를 별도 모듈로 분리하여 배치 정의 중심 FlowProducer 사용
- JobDispatcher를 QueueDispatcher로 교체하여 분산 Worker 처리
- 모듈별 독립 배포 및 수평 확장 지원
- 복잡한 DAG, 조건 분기, 병렬 처리 도입 가능

---

_문서 작성: 통합 오케스트레이션 구조 기준으로, 필요 시 부분 적용 및 상세 보강 가능_
