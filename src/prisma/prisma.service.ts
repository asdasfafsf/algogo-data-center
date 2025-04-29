import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { DiscoveryService } from '@nestjs/core';
import { PrismaTransaction } from './decorators/prisma-transaction.decorator';
import { MetadataScanner } from '@nestjs/core/metadata-scanner';
import { Reflector } from '@nestjs/core';
import { AsyncLocalStorage } from 'async_hooks';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly asyncLocalStorage = new AsyncLocalStorage<{
    tx: any;
  }>();
  constructor(
    private readonly discoveryService: DiscoveryService,
    private readonly metadataScanner: MetadataScanner,
    private readonly reflector: Reflector,
  ) {
    super();
  }

  async onModuleInit() {
    await this.$connect();

    const extendedPrisma = this.$extends({
      query: {
        $allOperations: async ({ args, query, model, operation }) => {
          const store = this.asyncLocalStorage.getStore();
          if (store?.tx) {
            return store.tx[model][operation](args);
          }
          return query(args);
        },
      },
    });

    Object.assign(this, extendedPrisma);

    const providers = this.discoveryService
      .getProviders()
      .filter((wrapper) => wrapper.isDependencyTreeStatic())
      .filter(({ instance }) => instance && Object.getPrototypeOf(instance))
      .map(({ instance }) => instance);

    providers.forEach((instance) => {
      const prototype = Object.getPrototypeOf(instance);
      const methodNames = this.metadataScanner.getAllMethodNames(prototype);

      methodNames.forEach((name) => {
        const method = instance[name];
        if (this.reflector.get(PrismaTransaction, method)) {
          instance[name] = async function (...args) {
            const prismaService = this.prisma;

            return await prismaService.asyncLocalStorage.run(
              { tx: null },
              async () => {
                return await prismaService.$transaction(async (tx) => {
                  prismaService.asyncLocalStorage.getStore().tx = tx;
                  try {
                    return await method.apply(this, args);
                  } finally {
                  }
                });
              },
            );
          };
        }
      });
    });
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
