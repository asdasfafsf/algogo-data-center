import { Module } from '@nestjs/common';
import { NemoService } from './nemo.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  providers: [NemoService],
  imports: [HttpModule],
  exports: [NemoService],
})
export class NemoModule {}
