import { useRef, useState } from "react";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Check,
  CheckCheck,
  Clipboard,
  Copy,
  FileCode2,
  FileInput,
  Maximize2,
  Minimize2,
  ShieldCheck,
  Trash2,
  TriangleAlert,
  WrapText,
} from "lucide-react";
import {
  detectFormat,
  displayBytes,
  hex,
  parseInput,
  text,
  utf8,
} from "../core/bytes";
import { MAX_BYTES } from "../core/pipeline";
import type { RunResult } from "../core/types";
export function download(content: BlobPart, name: string, type = "text/plain") {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
interface Props {
  input: string;
  setInput: (s: string) => void;
  inputFormat: string;
  setInputFormat: (s: string) => void;
  result: RunResult | null;
  error: string;
  busy: boolean;
  notice: (s: string) => void;
  hasSteps: boolean;
  stale: boolean;
}
export function Editors({
  input,
  setInput,
  inputFormat,
  setInputFormat,
  result,
  error,
  busy,
  notice,
  hasSteps,
  stale,
}: Props) {
  const [outputFormat, setOutputFormat] = useState("Text");
  const [wrap, setWrap] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [fileName, setFileName] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const output = result ? displayBytes(result.output, outputFormat) : "";
  let inputBytes = 0;
  try {
    inputBytes = parseInput(input, inputFormat).byteLength;
  } catch {
    inputBytes = utf8(input).length;
  }
  async function paste() {
    try {
      setInput(await navigator.clipboard.readText());
      setFileName("");
    } catch {
      notice(
        "Clipboard access was denied. Paste directly into the input with Ctrl/Cmd+V.",
      );
    }
  }
  async function loadFile(file: File) {
    try {
      if (file.size > MAX_BYTES)
        throw new Error("File exceeds the 8 MB limit.");
      const bytes = new Uint8Array(await file.arrayBuffer());
      try {
        setInput(text(bytes));
        setInputFormat("Text");
      } catch {
        setInput(hex(bytes));
        setInputFormat("Hex");
      }
      setFileName(file.name);
      notice(`Imported ${file.name} locally.`);
    } catch (e) {
      notice((e as Error).message);
    }
  }
  async function copy() {
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      notice(
        "Clipboard access was denied. Select and copy the output directly.",
      );
    }
  }
  return (
    <section className={`data-panel ${expanded ? "output-expanded" : ""}`}>
      <section
        className="input-panel panel"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const f = e.dataTransfer.files[0];
          if (f) void loadFile(f);
        }}
      >
        <div className="editor-heading">
          <div className="editor-label">
            <span className="editor-icon">
              <FileInput size={15} />
            </span>
            <h2>Input</h2>
            <span className="format-chip">{detectFormat(input)}</span>
          </div>
          <div className="button-group">
            <button
              className="icon-btn"
              title="Paste from clipboard"
              aria-label="Paste from clipboard"
              onClick={() => void paste()}
            >
              <Clipboard size={14} />
            </button>
            <button
              className="icon-btn"
              title="Import file"
              aria-label="Import input file"
              onClick={() => fileRef.current?.click()}
            >
              <ArrowUpFromLine size={14} />
            </button>
            <span className="toolbar-separator" />
            <button
              className="icon-btn"
              title="Clear input"
              aria-label="Clear input"
              disabled={!input}
              onClick={() => {
                setInput("");
                setFileName("");
              }}
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
        <div className="editor-format-bar">
          <label>
            Format{" "}
            <select
              value={inputFormat}
              onChange={(e) => setInputFormat(e.target.value)}
              aria-label="Input format"
            >
              <option>Text</option>
              <option>Hex</option>
              <option>Base64</option>
            </select>
          </label>
          <span>{fileName || "Enter text or drop a file"}</span>
          <input
            ref={fileRef}
            type="file"
            className="hidden"
            aria-label="Import input"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void loadFile(f);
              e.target.value = "";
            }}
          />
        </div>
        <div className="editor-content input-content">
          <div className="line-numbers" aria-hidden="true">
            {Array.from(
              { length: Math.max(1, Math.min(200, input.split("\n").length)) },
              (_, i) => (
                <span key={i}>{i + 1}</span>
              ),
            )}
          </div>
          <textarea
            aria-label="Input data"
            spellCheck={false}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setFileName("");
            }}
            placeholder="Enter data to begin, or drop a file here…"
          />
        </div>
        <div className="editor-footer">
          <span>
            {Array.from(input).length.toLocaleString()} characters
            <span className="footer-divider">/</span>
            {inputBytes.toLocaleString()} bytes
          </span>
          <span>
            UTF-8 <span className="footer-divider">·</span> LF
          </span>
        </div>
      </section>
      <div className="flow-divider">
        <span />
        <span className="flow-icon">↓</span>
        <span />
        <span className="flow-caption">LOCAL TRANSFORMATION</span>
        <span />
      </div>
      <section className="output-panel panel">
        <div className="editor-heading">
          <div className="editor-label">
            <span className="editor-icon output-icon">
              <FileCode2 size={15} />
            </span>
            <h2>Output</h2>
            {result && !stale && (
              <span className="success-chip">
                <Check size={11} /> Complete
              </span>
            )}
            {stale && <span className="format-chip">Run to update</span>}
          </div>
          <div className="button-group">
            <button
              className={`icon-btn ${wrap ? "active-icon" : ""}`}
              title="Toggle line wrap"
              aria-label="Toggle output line wrap"
              aria-pressed={wrap}
              onClick={() => setWrap((v) => !v)}
            >
              <WrapText size={15} />
            </button>
            <button
              className="icon-btn"
              title={expanded ? "Restore panels" : "Expand output"}
              aria-label={expanded ? "Restore panels" : "Expand output"}
              onClick={() => setExpanded((v) => !v)}
            >
              {expanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </button>
            <span className="toolbar-separator" />
            <button
              className="icon-btn"
              title="Copy output"
              aria-label="Copy output"
              disabled={!result}
              onClick={() => void copy()}
            >
              {copied ? <CheckCheck size={14} /> : <Copy size={14} />}
            </button>
            <button
              className="icon-btn"
              title="Download output as TXT"
              aria-label="Download output as TXT"
              disabled={!result}
              onClick={() => download(output, "obsidian-output.txt")}
            >
              <ArrowDownToLine size={14} />
            </button>
          </div>
        </div>
        <div className="editor-format-bar">
          <label>
            View as{" "}
            <select
              value={outputFormat}
              onChange={(e) => setOutputFormat(e.target.value)}
              aria-label="Output format"
            >
              <option>Text</option>
              <option>Hex</option>
              <option>Base64</option>
            </select>
          </label>
          <span>
            {result
              ? detectFormat(displayBytes(result.output, "Text"))
              : busy
                ? "Processing…"
                : "Awaiting transformation"}
          </span>
        </div>
        <div className="editor-content output-content" aria-live="polite">
          {error ? (
            <div className="processing-error">
              <TriangleAlert size={21} />
              <h3>Transformation stopped</h3>
              <p>{error}</p>
              <span>
                Your input is unchanged. Update the operation or input to
                continue.
              </span>
            </div>
          ) : busy ? (
            <div className="output-empty">
              <span className="processing-spinner" />
              <p>Processing locally…</p>
            </div>
          ) : result ? (
            <>
              <div className="line-numbers" aria-hidden="true">
                {Array.from(
                  {
                    length: Math.max(
                      1,
                      Math.min(500, output.split("\n").length),
                    ),
                  },
                  (_, i) => (
                    <span key={i}>{i + 1}</span>
                  ),
                )}
              </div>
              <pre
                className={wrap ? "wrap" : ""}
                tabIndex={0}
                aria-label="Output data"
              >
                <ColoredOutput value={output} />
              </pre>
            </>
          ) : (
            <div className="output-empty">
              <FileCode2 size={28} />
              <h3>Your result appears here</h3>
              <p>
                {hasSteps
                  ? "Run your recipe to transform the input."
                  : "Add an operation or run to pass input through."}
              </p>
            </div>
          )}
        </div>
        <div className="editor-footer">
          <span>
            {result
              ? `${result.output.length.toLocaleString()} bytes`
              : "0 bytes"}
            {result && (
              <>
                <span className="footer-divider">/</span>
                {result.elapsed.toFixed(1)} ms
              </>
            )}
          </span>
          <span className={error ? "error-text" : result ? "success-text" : ""}>
            {error ? (
              "Processing error"
            ) : result ? (
              <>
                <Check size={11} /> {result.timings.length} operations executed
              </>
            ) : (
              "Ready"
            )}
          </span>
        </div>
      </section>
      <div className="privacy-note">
        <ShieldCheck size={13} />
        <span>Your data stays in your browser. Always.</span>
        <span className="privacy-local">NO UPLOADS. NO TRACKING.</span>
      </div>
    </section>
  );
}
function ColoredOutput({ value }: { value: string }) {
  if (value.length > 100000 || !/^\s*[\[{]/.test(value)) return <>{value}</>;
  const parts = value.split(
    /("(?:[^"\\]|\\.)*"\s*:|"(?:[^"\\]|\\.)*"|\b(?:true|false|null)\b|\b-?\d+(?:\.\d+)?\b)/g,
  );
  return (
    <>
      {parts.map((s, i) => (
        <span
          key={i}
          className={
            /^".*:\s*$/.test(s)
              ? "code-key"
              : s.startsWith('"')
                ? "code-string"
                : /^(true|false|null)$/.test(s)
                  ? "code-bool"
                  : /^-?\d/.test(s)
                    ? "code-number"
                    : ""
          }
        >
          {s}
        </span>
      ))}
    </>
  );
}
