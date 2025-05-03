import { registerAs } from '@nestjs/config';

export const BullMQConfig = registerAs('bullmq', () => ({
  host: process.env.BULLMQ_HOST,
  port: parseInt(process.env.BULLMQ_PORT),
  password: process.env.BULLMQ_PASSWORD,
  queueName: process.env.BULLMQ_QUEUE_NAME,
}));
