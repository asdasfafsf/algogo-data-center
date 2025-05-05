import { getElapsedTime } from './date';

describe('getElapsedTime', () => {
  it('ms 단위로 정상 동작', () => {
    expect(
      getElapsedTime(
        new Date('2024-06-01T00:00:00Z'),
        new Date('2024-06-01T00:00:01Z'),
      ),
    ).toBe(1000);
  });

  it('초 단위로 정상 동작', () => {
    expect(
      getElapsedTime(
        new Date('2024-06-01T00:00:00Z'),
        new Date('2024-06-01T00:00:05Z'),
        's',
      ),
    ).toBe(5);
  });

  it('음수 결과도 정상', () => {
    expect(
      getElapsedTime(
        new Date('2024-06-01T00:00:05Z'),
        new Date('2024-06-01T00:00:00Z'),
        's',
      ),
    ).toBe(-5);
  });

  it('동일한 시간 입력 시 0 반환', () => {
    expect(
      getElapsedTime(
        new Date('2024-06-01T00:00:00Z'),
        new Date('2024-06-01T00:00:00Z'),
      ),
    ).toBe(0);
  });

  it('ms 단위와 s 단위가 일치하는지 확인', () => {
    const start = new Date('2024-06-01T00:00:00Z');
    const end = new Date('2024-06-01T00:00:03Z');
    expect(getElapsedTime(start, end, 's')).toBe(
      getElapsedTime(start, end) / 1000,
    );
  });
});
