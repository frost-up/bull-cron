import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { DiscoveryService, MetadataScanner } from '@nestjs/core';
import { InstanceWrapper } from '@nestjs/core/injector/instance-wrapper';
import { BullScheduleOrchestrator } from './bull-schedule.orchestrator';
import { BullScheduleAccessor } from './bull-schedule.accessor';
import { BullScheduleType } from './enum/bull-schedule-type.enum';

@Injectable()
export class BullScheduleExplorer implements OnModuleInit {
  private readonly logger = new Logger('BullCronExplorer');

  constructor(
    private readonly schedulerOrchestrator: BullScheduleOrchestrator,
    private readonly metadataAccessor: BullScheduleAccessor,
    private readonly discoveryService: DiscoveryService,
    private readonly metadataScanner: MetadataScanner,
  ) {}

  async onModuleInit() {
    await this.explore();
  }

  async explore() {
    const instanceWrappers: InstanceWrapper[] = [
      ...this.discoveryService.getControllers(),
      ...this.discoveryService.getProviders(),
    ];

    await Promise.all(
      instanceWrappers.map((wrapper: InstanceWrapper) => {
        const { instance } = wrapper;
        if (!instance || !Object.getPrototypeOf(instance)) {
          return;
        }
        return this.metadataScanner.scanFromPrototype(
          instance,
          Object.getPrototypeOf(instance),
          (key: string) =>
            wrapper.isDependencyTreeStatic()
              ? this.lookupSchedulers(instance, key)
              : this.warnForNonStaticProviders(wrapper, instance, key),
        );
      }),
    );
  }

  // eslint-disable-next-line @typescript-eslint/ban-types
  lookupSchedulers(instance: Record<string, Function>, key: string) {
    const methodRef = instance[key];
    const metadata = this.metadataAccessor.getSchedulerType(methodRef);

    switch (metadata) {
      case BullScheduleType.CRON: {
        const cronMetadata = this.metadataAccessor.getCronMetadata(methodRef);
        const cronFn = this.wrapFunctionInTryCatchBlocks(methodRef, instance);

        return this.schedulerOrchestrator.addCron(cronFn, cronMetadata!);
      }
    }
  }

  async warnForNonStaticProviders(
    wrapper: InstanceWrapper<any>,
    // eslint-disable-next-line @typescript-eslint/ban-types
    instance: Record<string, Function>,
    key: string,
  ) {
    const methodRef = instance[key];
    const metadata = this.metadataAccessor.getSchedulerType(methodRef);

    switch (metadata) {
      case BullScheduleType.CRON: {
        this.logger.warn(
          `Cannot register bull cron job "${wrapper.name}@${key}" because it is defined in a non static provider.`,
        );
        break;
      }
    }
  }

  // eslint-disable-next-line @typescript-eslint/ban-types
  private wrapFunctionInTryCatchBlocks(methodRef: Function, instance: object) {
    return async (...args: unknown[]) => {
      try {
        await methodRef.call(instance, ...args);
      } catch (error) {
        this.logger.error(error);
      }
    };
  }
}
