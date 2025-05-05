import { PROBLEM_SOURCE_MAP } from '../constants/problem.constant';
import { AcmicpcResponse } from './acmicpc.type';

export type ProblemSource =
  (typeof PROBLEM_SOURCE_MAP)[keyof typeof PROBLEM_SOURCE_MAP];

export type ProblemCollectRequest = {
  source: ProblemSource;
  sourceId: string;
};

export type ProblemCollectResponse = AcmicpcResponse;
