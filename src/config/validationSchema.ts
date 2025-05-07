import * as Joi from 'joi';

export const validationSchema = Joi.object({
  NEMO_URL: Joi.string().required(),
  NODE_ENV: Joi.string().valid('local', 'development', 'production').required(),
  SERVER_PORT: Joi.number().required(),

  BULLMQ_HOST: Joi.string().required(),
  BULLMQ_PORT: Joi.number().required(),
  BULLMQ_PASSWORD: Joi.string().required(),
  BULLMQ_QUEUE_NAME: Joi.string().required(),

  S3_SECRET_KEY: Joi.string().required(),
  S3_ACCESS_KEY: Joi.string().required(),
  S3_BUCKET_NAME: Joi.string().required(),
  S3_REGION: Joi.string().required(),
  S3_ENDPOINT: Joi.string().required(),
});
