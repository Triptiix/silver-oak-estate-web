import type { z } from "zod";

function environmentError(variableNames: readonly string[]): Error {
  const names = [...new Set(variableNames)].sort().join(", ");
  return new Error(`Environment validation failed for variables: ${names}`);
}

export function parseEnvironmentField(
  variableName: string,
  schema: z.ZodType,
  rawValue: unknown,
): unknown {
  const result = schema.safeParse(rawValue);
  if (!result.success) throw environmentError([variableName]);
  return result.data;
}

export function parseEnvironment<T>(
  schema: z.ZodType<T>,
  rawEnvironment: unknown,
): T {
  const result = schema.safeParse(rawEnvironment);
  if (!result.success) {
    const variableNames = result.error.issues.map((issue) => String(issue.path[0] ?? "environment"));
    throw environmentError(variableNames);
  }
  return result.data;
}
