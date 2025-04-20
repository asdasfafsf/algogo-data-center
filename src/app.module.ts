import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { NemoModule } from './nemo/nemo.module';

@Module({
  imports: [NemoModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
