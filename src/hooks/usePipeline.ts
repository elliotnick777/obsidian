import { useCallback, useEffect, useRef, useState } from "react";
import { parseInput } from "../core/bytes";
import type {
  PipelineRequest,
  PipelineResponse,
  RunResult,
  Step,
} from "../core/types";

export function usePipeline(
  input: string,
  format: string,
  steps: Step[],
  live: boolean,
) {
  const [result, setResult] = useState<RunResult | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const workerRef = useRef<Worker | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const runId = useRef(0);

  const cancel = useCallback(() => {
    runId.current++;
    workerRef.current?.terminate();
    workerRef.current = null;
    clearTimeout(timeoutRef.current);
    setBusy(false);
  }, []);

  const run = useCallback(() => {
    cancel();
    setError("");
    setResult(null);

    let bytes: Uint8Array;
    try {
      bytes = parseInput(input, format);
    } catch (error) {
      setError((error as Error).message);
      return;
    }

    const id = runId.current;
    setBusy(true);
    const worker = new Worker(new URL("../core/worker.ts", import.meta.url), {
      type: "module",
    });
    workerRef.current = worker;

    const finish = () => {
      worker.terminate();
      clearTimeout(timeoutRef.current);
      setBusy(false);
    };

    worker.onmessage = ({ data }: MessageEvent<PipelineResponse>) => {
      if (id !== runId.current) return;
      if (data.ok) setResult(data.result);
      else setError(data.error);
      finish();
    };
    worker.onerror = () => {
      if (id !== runId.current) return;
      setError("Processing worker failed. Try a smaller input.");
      finish();
    };

    worker.postMessage({ input: bytes, steps } satisfies PipelineRequest);
    timeoutRef.current = setTimeout(() => {
      if (id !== runId.current) return;
      setError(
        "Processing stopped after 10 seconds. Simplify the recipe or regular expression.",
      );
      finish();
    }, 10000);
  }, [input, format, steps, cancel]);

  useEffect(() => {
    cancel();
    setResult(null);
    setError("");
    if (!live) return cancel;

    const debounce = setTimeout(run, 350);
    return () => {
      clearTimeout(debounce);
      cancel();
    };
  }, [run, live, cancel]);

  return { result, error, busy, run, cancel };
}
