import type { Category, Operation, Parameter, Params } from "../core/types";
import { text, utf8 } from "../core/bytes";
export const field = (
  key: string,
  label: string,
  value = "",
  type: Parameter["type"] = "text",
  options?: string[],
): Parameter => ({ key, label, default: value, type, options });
export const number = (
  key: string,
  label: string,
  value: number,
  min: number,
  max: number,
): Parameter => ({ key, label, default: value, type: "number", min, max });
export const check = (
  key: string,
  label: string,
  value = false,
): Parameter => ({ key, label, default: value, type: "checkbox" });
export const str = (p: Params, k: string): string => String(p[k] ?? "");
export function integer(
  p: Params,
  k: string,
  min: number,
  max: number,
): number {
  const n = Number(p[k]);
  if (!Number.isSafeInteger(n) || n < min || n > max)
    throw new Error(`${k} must be an integer between ${min} and ${max}.`);
  return n;
}
export function op(
  id: string,
  name: string,
  category: Category,
  description: string,
  run: Operation["run"],
  parameters: Parameter[] = [],
  warning?: string,
): Operation {
  return { id, name, category, description, run, parameters, warning };
}
export function textOp(
  id: string,
  name: string,
  category: Category,
  description: string,
  run: (s: string, p: Params) => string,
  parameters: Parameter[] = [],
  warning?: string,
): Operation {
  return op(
    id,
    name,
    category,
    description,
    (b, p) => utf8(run(text(b), p)),
    parameters,
    warning,
  );
}
