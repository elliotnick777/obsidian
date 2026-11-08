import { encoding } from "../operations/encoding";
import { hashing } from "../operations/hashing";
import { textOperations } from "../operations/text";
import { binary } from "../operations/binary";
import { data } from "../operations/data";
import { utilities } from "../operations/utilities";
import type { Operation, Params, Step } from "./types";
export const operations: Operation[] = [
  ...encoding,
  ...hashing,
  ...textOperations,
  ...binary,
  ...data,
  ...utilities,
];
export const registry = new Map(operations.map((o) => [o.id, o]));
export function defaults(op: Operation): Params {
  return Object.fromEntries(op.parameters.map((p) => [p.key, p.default]));
}
export function createStep(operationId: string): Step {
  const op = registry.get(operationId);
  if (!op) throw new Error("Unknown operation.");
  return {
    id: crypto.randomUUID(),
    operationId,
    enabled: true,
    params: defaults(op),
  };
}
