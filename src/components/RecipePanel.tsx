import { useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  GitBranch,
  GripVertical,
  Play,
  Plus,
  Power,
  Save,
  Trash2,
  X,
  Zap,
} from "lucide-react";
import { registry } from "../core/registry";
import type { Params, RunResult, Step } from "../core/types";
import { categoryIcons } from "./Icons";
interface Props {
  steps: Step[];
  setSteps: React.Dispatch<React.SetStateAction<Step[]>>;
  live: boolean;
  setLive: (v: boolean) => void;
  run: () => void;
  busy: boolean;
  result: RunResult | null;
  onSave: () => void;
  onPreset: (id: string) => void;
  onBrowse: () => void;
}
export function RecipePanel({
  steps,
  setSteps,
  live,
  setLive,
  run,
  busy,
  result,
  onSave,
  onPreset,
  onBrowse,
}: Props) {
  const [dragged, setDragged] = useState<string | null>(null);
  const [over, setOver] = useState<string | null>(null);
  const [folded, setFolded] = useState<string[]>([]);
  function move(from: number, to: number) {
    if (to < 0 || to >= steps.length || from === to) return;
    setSteps((steps) => {
      const reordered = [...steps];
      const [step] = reordered.splice(from, 1);
      reordered.splice(to, 0, step);
      return reordered;
    });
  }
  function setParam(stepId: string, key: string, value: Params[string]) {
    setSteps((steps) =>
      steps.map((step) =>
        step.id === stepId
          ? { ...step, params: { ...step.params, [key]: value } }
          : step,
      ),
    );
  }

  return (
    <section className="recipe-panel panel">
      <div className="panel-title">
        <div>
          <span className="eyebrow">TRANSFORMATION PIPELINE</span>
          <h2>
            Recipe <span className="count">{steps.length}</span>
          </h2>
        </div>
        <div className="button-group">
          <button
            className="icon-btn"
            title="Save recipe"
            aria-label="Save recipe"
            onClick={onSave}
          >
            <Save size={15} />
          </button>
          <button
            className="icon-btn"
            title="Clear recipe"
            aria-label="Clear recipe"
            disabled={!steps.length}
            onClick={() => setSteps([])}
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>
      <div className="recipe-tools">
        <GitBranch size={13} />
        <span>Execute from top to bottom</span>
        <span className="step-count">
          {steps.filter((s) => s.enabled).length} active
        </span>
      </div>
      <div className="recipe-scroll">
        {!steps.length ? (
          <div className="recipe-empty">
            <div className="empty-symbol">
              <GitBranch size={26} />
            </div>
            <h3>Start with an operation</h3>
            <p>
              Add operations from the toolbox to build your transformation
              pipeline.
            </p>
            <button className="secondary-btn" onClick={onBrowse}>
              <Plus size={14} /> Browse operations
            </button>
          </div>
        ) : (
          steps.map((step, index) => {
            const op = registry.get(step.operationId)!;
            const Icon = categoryIcons[op.category];
            const time = result?.timings.find((t) => t.id === step.id);
            const closed = folded.includes(step.id);
            return (
              <div
                key={step.id}
                className={`step-wrapper ${over === step.id ? "drag-over" : ""}`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setOver(step.id);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  if (dragged)
                    move(
                      steps.findIndex((s) => s.id === dragged),
                      index,
                    );
                  setDragged(null);
                  setOver(null);
                }}
              >
                <div className="pipeline-connector">
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  {index > 0 && <i />}
                </div>
                <article
                  className={`recipe-card ${!step.enabled ? "disabled" : ""} ${dragged === step.id ? "dragging" : ""}`}
                >
                  <div className="recipe-card-heading">
                    <span
                      className="drag-handle"
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.effectAllowed = "move";
                        e.dataTransfer.setData("text/plain", step.id);
                        setDragged(step.id);
                      }}
                      onDragEnd={() => {
                        setDragged(null);
                        setOver(null);
                      }}
                      title="Drag to reorder"
                    >
                      <GripVertical size={15} />
                    </span>
                    <span className="operation-icon">
                      <Icon size={15} />
                    </span>
                    <button
                      className="step-name"
                      onClick={() =>
                        setFolded((a) =>
                          a.includes(step.id)
                            ? a.filter((x) => x !== step.id)
                            : [...a, step.id],
                        )
                      }
                    >
                      {op.name}
                      <ChevronDown
                        size={12}
                        className={closed ? "closed" : ""}
                      />
                    </button>
                    <button
                      className={`icon-btn small ${step.enabled ? "enabled" : ""}`}
                      aria-label={`${step.enabled ? "Disable" : "Enable"} ${op.name}`}
                      title={
                        step.enabled ? "Disable operation" : "Enable operation"
                      }
                      onClick={() =>
                        setSteps((a) =>
                          a.map((s) =>
                            s.id === step.id
                              ? { ...s, enabled: !s.enabled }
                              : s,
                          ),
                        )
                      }
                    >
                      <Power size={12} />
                    </button>
                    <button
                      className="icon-btn small"
                      title="Remove operation"
                      aria-label={`Remove ${op.name}`}
                      onClick={() =>
                        setSteps((a) => a.filter((s) => s.id !== step.id))
                      }
                    >
                      <X size={13} />
                    </button>
                  </div>
                  {!closed && (
                    <div className="recipe-card-body">
                      <p className="step-description">{op.description}</p>
                      {op.warning && (
                        <p className="operation-warning">{op.warning}</p>
                      )}
                      {op.parameters.map((parameter) => (
                        <label
                          key={parameter.key}
                          className={`param-field ${parameter.type === "checkbox" ? "checkbox-field" : ""}`}
                        >
                          <span>{parameter.label}</span>
                          {parameter.type === "checkbox" ? (
                            <input
                              type="checkbox"
                              checked={Boolean(step.params[parameter.key])}
                              onChange={(event) =>
                                setParam(
                                  step.id,
                                  parameter.key,
                                  event.target.checked,
                                )
                              }
                            />
                          ) : parameter.type === "select" ? (
                            <select
                              value={String(step.params[parameter.key])}
                              onChange={(event) =>
                                setParam(
                                  step.id,
                                  parameter.key,
                                  event.target.value,
                                )
                              }
                            >
                              {parameter.options?.map((option) => (
                                <option key={option}>{option}</option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type={
                                parameter.type === "number" ? "number" : "text"
                              }
                              min={parameter.min}
                              max={parameter.max}
                              spellCheck={false}
                              value={String(step.params[parameter.key])}
                              onChange={(event) =>
                                setParam(
                                  step.id,
                                  parameter.key,
                                  parameter.type === "number"
                                    ? Number(event.target.value)
                                    : event.target.value,
                                )
                              }
                            />
                          )}
                        </label>
                      ))}
                      {!op.parameters.length && (
                        <div className="no-params">
                          <span className="mini-dot" />
                          No configuration needed
                        </div>
                      )}
                    </div>
                  )}
                  <div className="recipe-card-footer">
                    <span>
                      {!step.enabled
                        ? "Bypassed"
                        : time
                          ? `${time.ms.toFixed(1)} ms · ${time.bytes.toLocaleString()} B`
                          : "Ready to process"}
                    </span>
                    <div className="button-group">
                      <button
                        className="icon-btn tiny"
                        disabled={index === 0}
                        onClick={() => move(index, index - 1)}
                        title="Move up"
                        aria-label={`Move ${op.name} up`}
                      >
                        <ArrowUp size={11} />
                      </button>
                      <button
                        className="icon-btn tiny"
                        disabled={index === steps.length - 1}
                        onClick={() => move(index, index + 1)}
                        title="Move down"
                        aria-label={`Move ${op.name} down`}
                      >
                        <ArrowDown size={11} />
                      </button>
                    </div>
                  </div>
                </article>
              </div>
            );
          })
        )}
        {!!steps.length && (
          <button className="add-step" onClick={onBrowse}>
            <Plus size={14} />
            Add another operation
          </button>
        )}
        <div className="recipe-tip">
          <Zap size={14} />
          <p>
            Build once. Transform anything.
            <br />
            <span>Save recipes to reuse your workflow.</span>
          </p>
        </div>
      </div>
      <div className="recipe-bottom">
        <div className="live-row">
          <label className="toggle-label">
            <input
              type="checkbox"
              checked={live}
              onChange={(e) => setLive(e.target.checked)}
            />
            <span className="switch" />
            <span>Auto-run</span>
          </label>
          <span className="muted">
            {live ? "Processes as you type" : "Manual execution"}
          </span>
        </div>
        <button className="run-btn" onClick={run} disabled={busy}>
          <Play size={15} fill="currentColor" />
          {busy ? "Processing…" : "Run recipe"}
          <kbd>⌘ ↵</kbd>
        </button>
        <div className="preset-line">
          <span>Need a starting point?</span>
          <select
            aria-label="Load a sample recipe"
            value=""
            onChange={(e) => onPreset(e.target.value)}
          >
            <option value="" disabled>
              Try a recipe
            </option>
            <option value="decode">Decode & inspect</option>
            <option value="hash">Hash a message</option>
            <option value="clean">Clean up text</option>
          </select>
        </div>
      </div>
    </section>
  );
}
