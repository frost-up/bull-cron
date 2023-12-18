import { DynamicModule, Module } from '@nestjs/common';
import { DiscoveryModule } from '@nestjs/core';
import { BullScheduleAccessor } from './bull-schedule.accessor';
import { BullScheduleOrchestrator } from './bull-schedule.orchestrator';
import { BullScheduleExplorer } from './bull-schedule.explorer';
import { ConnectionOptions } from 'bullmq/dist/esm/interfaces/redis-options';
import { REDIS_OPTIONS } from './bull-schedule.symbols';

@Module({
  imports: [DiscoveryModule],
  providers: [BullScheduleAccessor, BullScheduleOrchestrator],
})
export class BullScheduleModule {
  static forRoot(redisOptions?: ConnectionOptions): DynamicModule {
    return {
      global: true,
      module: BullScheduleModule,
      providers: [
        BullScheduleExplorer,
        {
          provide: REDIS_OPTIONS,
          useValue: redisOptions ?? null,
        },
      ],
      exports: [],
    };
  }
}
