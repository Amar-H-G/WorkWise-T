import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';

type ValidateTarget = 'body' | 'query' | 'params';

export function validate(schema: AnyZodObject, target: ValidateTarget = 'body') {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await schema.parseAsync(req[target]);
      req[target] = data;
      next();
    } catch (err) {
      next(err as ZodError);
    }
  };
}

export function validateMultiple(schemas: { schema: AnyZodObject; target: ValidateTarget }[]) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      for (const { schema, target } of schemas) {
        req[target] = await schema.parseAsync(req[target]);
      }
      next();
    } catch (err) {
      next(err);
    }
  };
}
