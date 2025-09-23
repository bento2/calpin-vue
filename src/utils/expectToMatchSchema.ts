import { expect } from 'vitest';
import { ZodSchema } from 'zod/v3'


export function expectToMatchSchema<T>(data: unknown, schema: ZodSchema<T>) {
  expect(() => schema.parse(data)).not.toThrow();
}
