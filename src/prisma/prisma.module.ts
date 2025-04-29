import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { DiscoveryModule } from '@nestjs/core';

@Module({
  imports: [DiscoveryModule],
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
