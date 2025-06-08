import { registerAs } from '@nestjs/config';

export const TodayProblemConfig = registerAs('todayProblem', () => ({
  maxDays: Number(process.env.TODAY_PROBLEM_MAX_DAYS),
}));
