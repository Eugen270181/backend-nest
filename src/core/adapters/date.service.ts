import { add } from 'date-fns/add';
import { Injectable } from '@nestjs/common';
import { Duration } from 'date-fns';

const unitsMap: { [key: string]: keyof Duration } = {
  s: 'seconds',
  m: 'minutes',
  h: 'hours',
  d: 'days',
  w: 'weeks',
  M: 'months',
  y: 'years',
};

@Injectable()
export class DateService {
  private parseDuration(duration: string): Duration {
    const result: Duration = {};
    const regex = /(\d+)\s*([smhdwMy])/g;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(duration)) !== null) {
      const value = parseInt(match[1], 10);
      const unit = unitsMap[match[2]];
      if (unit) {
        result[unit] = (result[unit] || 0) + value;
      }
    }

    return result;
  }

  addDuration(baseDate: Date, durationStr: string): Date {
    const duration = this.parseDuration(durationStr);
    return add(baseDate, duration);
  }
}
