import { Inject, Injectable, Logger } from '@nestjs/common';
import { Job, Queue, Worker } from 'bullmq';
import { BullScheduleCronOptions } from './interfaces/bull-schedule-cron.options';
import { ConnectionOptions } from 'bullmq/dist/esm/interfaces/redis-options';
import { REDIS_OPTIONS } from './bull-schedule.symbols';

@Injectable()
export class BullScheduleOrchestrator {
  constructor(
    @Inject(REDIS_OPTIONS)
    private readonly redisOptions: ConnectionOptions | null,
  ) {}
  async addCron(
    cronFn: (...args: unknown[]) => Promise<void>,
    { cronTime, queueName }: BullScheduleCronOptions & Record<'cronTime', any>,
  ) {
    const queue: Queue = new Queue(queueName, {
      connection: this.redisOptions ? this.redisOptions : undefined,
      defaultJobOptions: {},
    });

    const repeatableJobs = await queue.getRepeatableJobs();

    if (repeatableJobs.length > 0) {
      for (const repeatableJob of repeatableJobs) {
        await queue.removeRepeatableByKey(repeatableJob.key);
      }

      Logger.log(
        `Removed ${repeatableJobs.length} repeatable jobs, for queue ${queueName}`,
        'BullScheduleOrchestrator',
      );
    }

    await queue.add(
      'cron',
      {},
      {
        repeat: { pattern: cronTime },
        removeOnComplete: {
          count: 1,
        },
      },
    );

    const worker = new Worker(queueName, cronFn, {
      connection: this.redisOptions ? this.redisOptions : undefined,
    });

    worker.on('completed', (job: Job) => {
      Logger.log(
        `Job ${job.id} of queue ${queueName} completed`,
        'BullScheduleOrchestrator',
      );
    });
  }
}
