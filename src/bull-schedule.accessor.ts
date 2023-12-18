import { Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { BullScheduleType } from './enum/bull-schedule-type.enum';
import {
  BULL_SCHEDULE_CRON_OPTIONS,
  BULL_SCHEDULE_NAME,
  BULL_SCHEDULE_TYPE,
} from './bull-schedule.constants';
import { BullScheduleCronOptions } from './interfaces/bull-schedule-cron.options';

@Injectable()
export class BullScheduleAccessor {
  constructor(private readonly reflector: Reflector) {}

  // eslint-disable-next-line @typescript-eslint/ban-types
  getSchedulerType(target: Function): BullScheduleType | undefined {
    return this.reflector.get(BULL_SCHEDULE_TYPE, target);
  }

  // eslint-disable-next-line @typescript-eslint/ban-types
  getSchedulerName(target: Function): string | undefined {
    return this.reflector.get(BULL_SCHEDULE_NAME, target);
  }

  getCronMetadata(
    // eslint-disable-next-line @typescript-eslint/ban-types
    target: Function,
  ):
    | (BullScheduleCronOptions & Record<'cronTime', string | Date | any>)
    | undefined {
    return this.reflector.get(BULL_SCHEDULE_CRON_OPTIONS, target);
  }
}
