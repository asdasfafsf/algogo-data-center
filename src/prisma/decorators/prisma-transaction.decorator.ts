import 'reflect-metadata';
import { SetMetadata } from '@nestjs/common';

export const PRISMA_TRANSACTION_KEY = Symbol('PRISMA_TRASACTION_KEY');
export const PrismaTransaction = () =>
  SetMetadata(PRISMA_TRANSACTION_KEY, true);
