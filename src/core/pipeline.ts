import { registry } from "./registry";
import { importRecipe } from "./recipes";
import type { RunResult, Step } from "./types";
export const MAX_BYTES = 8 * 1024 * 1024;
export async function executePipeline(
  input: Uint8Array,
  rawSteps: Step[],
): Promise<RunResult> {
  const steps = importRecipe(
    JSON.stringify({ version: 1, name: "Pipeline", steps: rawSteps }),
  ).steps;
  const startedAt = performance.now();
  if (input.byteLength > MAX_BYTES)
    throw new Error("Input exceeds the 8 MB processing limit.");
  let output = new Uint8Array(input);
  const timings: RunResult["timings"] = [];
  for (const step of steps) {
    if (!step.enabled) continue;
    const op = registry.get(step.operationId)!;
    const stepStartedAt = performance.now();
    try {
      output = new Uint8Array(await op.run(output, step.params));
      if (output.byteLength > MAX_BYTES)
        throw new Error("Output exceeds the 8 MB processing limit.");
    } catch (e) {
      throw new Error(
        `${op.name}: ${e instanceof Error ? e.message : "Transformation failed."}`,
      );
    }
    timings.push({
      id: step.id,
      ms: performance.now() - stepStartedAt,
      bytes: output.byteLength,
    });
  }
  return { output, timings, elapsed: performance.now() - startedAt };
}
