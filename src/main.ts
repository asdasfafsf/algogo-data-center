import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe());

  // Swagger 설정 추가
  const config = new DocumentBuilder()
    .setTitle('API 문서')
    .setDescription('algogo-data-center API Swagger 문서입니다.')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app as any, config);
  SwaggerModule.setup('swagger', app as any, document);

  await app.listen(parseInt(process.env.SERVER_PORT));
}
bootstrap();
