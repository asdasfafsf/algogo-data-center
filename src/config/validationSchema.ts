import * as Joi from 'joi';

export const validationSchema = Joi.object({
  NEMO_URL: Joi.string().required(),
  NODE_ENV: Joi.string().valid('local', 'development', 'production').required(),
  SERVER_PORT: Joi.number().required(),
});
