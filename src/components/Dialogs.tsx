import { useEffect, useRef } from "react";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Clock3,
  FolderOpen,
  GitBranch,
  Play,
  Save,
  Trash2,
  X,
} from "lucide-react";
import type { Recipe } from "../core/types";
interface Props {
  mode: "save" | "saved" | "history" | "help";
  close: () => void;
  recipes: Recipe[];
  history: Recipe[];
  name: string;
  setName: (s: string) => void;
  onSave: () => void;
  onLoad: (r: Recipe) => void;
  onDelete: (index: number) => void;
  onImport: () => void;
  onExport: () => void;
}
export function Dialogs({
  mode,
  close,
  recipes,
  history,
  name,
  setName,
  onSave,
  onLoad,
  onDelete,
  onImport,
  onExport,
}: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    ref.current?.showModal();
    return () => ref.current?.close();
  }, []);
  const title =
    mode === "save"
      ? "Save this recipe"
      : mode === "saved"
        ? "Your recipe library"
        : mode === "history"
          ? "Recipe history"
          : "A few things to know";
  return (
    <dialog
      ref={ref}
      className="modal"
      onCancel={close}
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div className="modal-heading">
        <div>
          <span className="eyebrow">OBSIDIAN WORKSTATION</span>
          <h2>{title}</h2>
        </div>
        <button className="icon-btn" aria-label="Close dialog" onClick={close}>
          <X size={18} />
        </button>
      </div>
      {mode === "save" ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSave();
          }}
        >
          <p className="modal-description">
            Keep your operations and parameters for next time. Input and output
            data are never included.
          </p>
          <label className="param-field">
            <span>Recipe name</span>
            <input
              autoFocus
              required
              maxLength={120}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Name your workflow"
            />
          </label>
          <div className="modal-actions">
            <button type="button" className="secondary-btn" onClick={close}>
              Cancel
            </button>
            <button className="primary-btn" type="submit">
              <Save size={14} />
              Save recipe
            </button>
          </div>
        </form>
      ) : mode === "help" ? (
        <div className="help-content">
          <p>
            Compose operations from the toolbox. Data flows through enabled
            steps from top to bottom; each output becomes the next step’s input.
          </p>
          <h3>Keyboard shortcuts</h3>
          <div>
            <span>Run recipe</span>
            <kbd>Ctrl / ⌘ + Enter</kbd>
          </div>
          <div>
            <span>Search operations</span>
            <kbd>Ctrl / ⌘ + K</kbd>
          </div>
          <div>
            <span>Save recipe</span>
            <kbd>Ctrl / ⌘ + Shift + S</kbd>
          </div>
          <h3>Private by design</h3>
          <p>
            Transformations run in a browser worker. No processing APIs,
            analytics, or data uploads. Only recipes, favorites, history of
            recipe configurations, and theme preferences are stored locally.
          </p>
          <p>
            Files and intermediate data are limited to 8 MB. Runs stop after 10
            seconds. Text uses UTF-8; choose Hex or Base64 to inspect binary
            output. Generators replace their input.
          </p>
          <p>
            MD5 and SHA-1 are outdated for security-sensitive work. JWT decoding
            does not verify signatures. CSV output may contain spreadsheet
            formulas from your input; inspect untrusted CSV before opening it in
            spreadsheet software.
          </p>
          <p className="muted">NABONIDUS / OBSIDIAN v1.0.0</p>
        </div>
      ) : (
        <>
          <p className="modal-description">
            {mode === "saved"
              ? "Reusable workflows, stored on this device."
              : "Recent manually executed or saved recipe configurations. Your input and output are never stored."}
          </p>
          <div className="recipe-library">
            {(mode === "saved" ? recipes : history).length === 0 ? (
              <div className="empty-small">
                {mode === "saved" ? (
                  <FolderOpen size={28} />
                ) : (
                  <Clock3 size={28} />
                )}
                <h3>
                  {mode === "saved"
                    ? "No saved recipes yet"
                    : "No recipe history yet"}
                </h3>
                <p>
                  {mode === "saved"
                    ? "Save a recipe to build your library."
                    : "Run a recipe manually to see it here."}
                </p>
              </div>
            ) : (
              (mode === "saved" ? recipes : history).map((r, i) => (
                <div className="library-row" key={`${r.name}-${i}`}>
                  <span className="operation-icon">
                    <GitBranch size={18} />
                  </span>
                  <div>
                    <strong>{r.name}</strong>
                    <span>
                      {r.steps.length} operations ·{" "}
                      {r.steps.filter((s) => s.enabled).length} enabled
                    </span>
                  </div>
                  <button className="secondary-btn" onClick={() => onLoad(r)}>
                    <Play size={12} />
                    Load
                  </button>
                  {mode === "saved" && (
                    <button
                      className="icon-btn"
                      aria-label={`Delete ${r.name}`}
                      onClick={() => onDelete(i)}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
          {mode === "saved" && (
            <div className="modal-actions">
              <button className="secondary-btn" onClick={onImport}>
                <ArrowUpFromLine size={14} />
                Import JSON
              </button>
              <button className="secondary-btn" onClick={onExport}>
                <ArrowDownToLine size={14} />
                Export current recipe
              </button>
            </div>
          )}
        </>
      )}
    </dialog>
  );
}
