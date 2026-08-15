import { faker } from "@faker-js/faker";

export type ProgramInput = {
  name: string;
  description: string;
};

/**
 * Happy-path program payload with a unique name to avoid cross-test collisions.
 * Override fields when a scenario needs a specific shape.
 */
export function buildProgram(
  overrides: Partial<ProgramInput> = {},
): ProgramInput {
  const suffix = Date.now();
  return {
    name: overrides.name ?? `${faker.commerce.productName()} ${suffix}`,
    description: overrides.description ?? faker.lorem.sentence(),
  };
}
