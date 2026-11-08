export type Params = Record<string, string | boolean | number>;
export interface Parameter {
  key: string;
  label: string;
  type: "text" | "number" | "select" | "checkbox";
  default: string | boolean | number;
  options?: string[];
  min?: number;
  max?: number;
}
export type Category =
  | "Encoding / Decoding"
  | "Hashing"
  | "Text"
  | "Binary / Hex / ASCII"
  | "Data / Web"
  | "Security / Utilities";
export interface Operation {
  id: string;
  name: string;
  category: Category;
  description: string;
  parameters: Parameter[];
  warning?: string;
  run: (input: Uint8Array, params: Params) => Uint8Array | Promise<Uint8Array>;
}
export interface Step {
  id: string;
  operationId: string;
  enabled: boolean;
  params: Params;
}
export interface Recipe {
  version: 1;
  name: string;
  steps: Step[];
}
export interface RunResult {
  output: Uint8Array;
  timings: { id: string; ms: number; bytes: number }[];
  elapsed: number;
}

export interface PipelineRequest {
  input: Uint8Array;
  steps: Step[];
}

export type PipelineResponse =
  | { ok: true; result: RunResult }
  | { ok: false; error: string };
