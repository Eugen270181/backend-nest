import { add } from 'date-fns/add';

function durationMapper(duration: string) {
  const units: { [key: string]: string } = {
    s: 'seconds',
    m: 'minutes',
    h: 'hours',
    d: 'days',
    M: 'months',
    y: 'years',
  };

  const durationObject: { [key: string]: number } = {
    seconds: 0,
    minutes: 0,
    hours: 0,
    days: 0,
    months: 0,
    years: 0,
  };

  const regex = /(\d+)([smhdMy])/g;

  let match: RegExpExecArray | null;
  while ((match = regex.exec(duration)) !== null) {
    const value = parseInt(match[1], 10);
    const unit = units[match[2]];

    if (unit) {
      durationObject[unit] += value;
    }
  }

  return durationObject;
}

/**
 * @description хелпер для прибавления времени к дате
 * @param operationalDate дата к которой прибавится
 * @param timeFormatForAdd то что прибавится к дате ('17s 30m 2h 2d 3M 1Y')
 * @return Date
 */
export const dateService = {
  genAddDate(operationalDate: Date, timeFormatForAdd: string) {
    //проверяем входную строку, д.б например '1s 30m 2h 2d 3M 1Y' - 1 сек 30 мин 2 часа 2 дня 3 мес 1 год
    const regex = /^(?:\d+\s*[smhdMy])+$/;
    if (!regex.test(timeFormatForAdd)) {
      throw new Error('Invalid duration format');
    }

    return add(operationalDate, durationMapper(timeFormatForAdd));
  },
};
