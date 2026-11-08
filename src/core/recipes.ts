import { registry } from "./registry";
import type { Operation, Params, Recipe, Step } from "./types";

function readParams(
  operation: Operation,
  values: Record<string, unknown>,
): Params {
  const params: Params = {};

  for (const key of Object.keys(values)) {
    if (!operation.parameters.some((parameter) => parameter.key === key)) {
      throw new Error(`Unknown parameter: ${key}`);
    }
  }

  for (const parameter of operation.parameters) {
    const { key, label, type } = parameter;
    const value = values[key] ?? parameter.default;

    if (typeof value !== typeof parameter.default) {
      throw new Error(`Invalid type for ${label}.`);
    }
    if (typeof value === "string" && value.length > 100000) {
      throw new Error("Parameter exceeds size limit.");
    }
    if (type === "select" && !parameter.options?.includes(String(value))) {
      throw new Error(`Invalid option for ${label}.`);
    }
    if (type === "number") {
      const number = Number(value);
      if (
        !Number.isSafeInteger(value) ||
        number < (parameter.min ?? -Infinity) ||
        number > (parameter.max ?? Infinity)
      ) {
        throw new Error(`Invalid number for ${label}.`);
      }
    }

    params[key] = value as Params[string];
  }

  return params;
}

function readStep(value: unknown, seenIds: Set<string>): Step {
  if (!value || typeof value !== "object") {
    throw new Error("Invalid recipe step.");
  }

  const step = value as Record<string, unknown>;
  if (
    typeof step.id !== "string" ||
    !step.id ||
    step.id.length > 100 ||
    seenIds.has(step.id) ||
    typeof step.operationId !== "string" ||
    typeof step.enabled !== "boolean" ||
    !step.params ||
    typeof step.params !== "object" ||
    Array.isArray(step.params)
  ) {
    throw new Error("Invalid or duplicate step.");
  }

  seenIds.add(step.id);
  const operation = registry.get(step.operationId);
  if (!operation) throw new Error(`Unknown operation: ${step.operationId}`);

  return {
    id: step.id,
    operationId: step.operationId,
    enabled: step.enabled,
    params: readParams(operation, step.params as Record<string, unknown>),
  };
}

export function importRecipe(raw: string): Recipe {
  if (raw.length > 1024 * 1024)
    throw new Error("Recipe exceeds the 1 MB limit.");

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("Recipe is not valid JSON.");
  }
  if (!parsed || typeof parsed !== "object") {
    throw new Error("Expected a recipe object.");
  }

  const recipe = parsed as Record<string, unknown>;
  if (
    recipe.version !== 1 ||
    typeof recipe.name !== "string" ||
    recipe.name.length > 120 ||
    !Array.isArray(recipe.steps) ||
    recipe.steps.length > 100
  ) {
    throw new Error(
      "Invalid recipe format. Expected version 1, a name, and up to 100 steps.",
    );
  }

  const seenIds = new Set<string>();
  return {
    version: 1,
    name: recipe.name,
    steps: recipe.steps.map((step) => readStep(step, seenIds)),
  };
}

export function exportRecipe(recipe: Recipe): string {
  return JSON.stringify(importRecipe(JSON.stringify(recipe)), null, 2);
}
