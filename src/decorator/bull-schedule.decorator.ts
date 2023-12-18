import { applyDecorators, SetMetadata } from '@nestjs/common';
import { BullScheduleType } from '../enum/bull-schedule-type.enum';
import { BullScheduleCronOptions } from '../interfaces/bull-schedule-cron.options';
import {
  BULL_SCHEDULE_CRON_OPTIONS,
  BULL_SCHEDULE_NAME,
  BULL_SCHEDULE_TYPE,
} from '../bull-schedule.constants';

/**
 * Creates a scheduled job.
 * @param cronTime The time to fire off your job.
 * @param options Job execution options.
 */
export function BullCron(
  cronTime: string,
  options: BullScheduleCronOptions | string,
): MethodDecorator {
  const name =
    options && typeof options === 'object' ? options.queueName : options;
  return applyDecorators(
    SetMetadata(BULL_SCHEDULE_CRON_OPTIONS, {
      ...(options && typeof options === 'object'
        ? options
        : {
            queueName: options,
          }),
      cronTime,
    }),
    SetMetadata(BULL_SCHEDULE_NAME, name),
    SetMetadata(BULL_SCHEDULE_TYPE, BullScheduleType.CRON),
  );
}
