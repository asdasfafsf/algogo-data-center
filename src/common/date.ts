import * as dayjs from 'dayjs';

/**
 * 시작 시간과 끝난 시간(Date 객체)을 받아
 * 경과 시간을 ms 또는 s 단위로 반환합니다.
 */
export function getElapsedTime(
  start: Date,
  end: Date,
  unit: 'ms' | 's' = 'ms',
): number {
  if (unit === 's') {
    return Math.floor(dayjs(end).diff(dayjs(start), 'second', true));
  }
  return dayjs(end).diff(dayjs(start));
}
