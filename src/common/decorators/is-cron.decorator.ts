import { registerDecorator, ValidationOptions } from 'class-validator';
import * as cron from 'node-cron';

export function IsCron(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isCron',
      target: object.constructor,
      propertyName: propertyName,
      options: {
        message: '올바른 Cron 표현식이 아닙니다. 예: "0 0 * * *"',
        ...validationOptions,
      },
      validator: {
        validate(value: any) {
          return typeof value === 'string' && cron.validate(value);
        },
      },
    });
  };
}
