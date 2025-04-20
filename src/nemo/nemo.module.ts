import { Module } from '@nestjs/common';
import { NemoService } from './nemo.service';

@Module({
  providers: [NemoService]
})
export class NemoModule {}
