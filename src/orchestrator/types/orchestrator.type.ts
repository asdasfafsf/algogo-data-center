import { ORCHESTRATOR_MAP } from '../constants/orchestrator.constant';

export type OrchestratorKey =
  (typeof ORCHESTRATOR_MAP)[keyof typeof ORCHESTRATOR_MAP];
