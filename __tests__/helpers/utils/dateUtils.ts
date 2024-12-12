export function createDateFromNow(daysOffset: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  return date;
}

export function createDateRange(
  startDaysOffset: number,
  endDaysOffset: number
) {
  return {
    start: createDateFromNow(startDaysOffset),
    end: createDateFromNow(endDaysOffset),
  };
}

export function mockCurrentDate(date: Date = new Date()) {
  jest.useFakeTimers();
  jest.setSystemTime(date);
}

export function restoreDate() {
  jest.useRealTimers();
}
