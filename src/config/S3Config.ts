import { registerAs } from '@nestjs/config';

export const S3Config = registerAs('s3', () => ({
  secretKey: process.env.S3_SECRET_KEY,
  accessKey: process.env.S3_ACCESS_KEY,
  bucketName: process.env.S3_BUCKET_NAME,
  region: process.env.S3_REGION,
  endpoint: process.env.S3_ENDPOINT,
}));
