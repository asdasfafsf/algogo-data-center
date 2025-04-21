import { registerAs } from '@nestjs/config';

export const NemoConfig = registerAs('nemo', () => ({
  url: process.env.NEMO_URL,
}));
