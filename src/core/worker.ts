import { executePipeline } from "./pipeline";
import type { PipelineRequest, PipelineResponse } from "./types";

self.onmessage = async ({ data }: MessageEvent<PipelineRequest>) => {
  let response: PipelineResponse;
  try {
    response = {
      ok: true,
      result: await executePipeline(data.input, data.steps),
    };
  } catch (error) {
    response = {
      ok: false,
      error: error instanceof Error ? error.message : "Processing failed.",
    };
  }
  self.postMessage(response);
};
