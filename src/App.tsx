import { useCallback, useEffect, useRef, useState } from "react";
import {
  Activity,
  ArrowDownToLine,
  ArrowUpFromLine,
  BookOpen,
  ChevronRight,
  CircleHelp,
  Clock3,
  Command,
  FolderOpen,
  GitBranch,
  LockKeyhole,
  Moon,
  RotateCcw,
  ShieldCheck,
  Sun,
  X,
} from "lucide-react";
import { Catalog } from "./components/Catalog";
import { RecipePanel } from "./components/RecipePanel";
import { Editors, download } from "./components/Editors";
import { Dialogs } from "./components/Dialogs";
import { ObsidianMark } from "./components/Icons";
import { createStep, registry } from "./core/registry";
import { exportRecipe, importRecipe } from "./core/recipes";
import { base64, utf8 } from "./core/bytes";
import { useLocalStorage } from "./hooks/useLocalStorage";
import { usePipeline } from "./hooks/usePipeline";
import type { Recipe } from "./core/types";
const demoData = JSON.stringify({
  message: "Hello, world!",
  project: "NABONIDUS",
  status: "ready",
  local: true,
});
const exampleInput = encodeURIComponent(base64(utf8(demoData)));
function validateRecipes(v: unknown): Recipe[] {
  if (!Array.isArray(v)) return [];
  return v.slice(0, 50).flatMap((x) => {
    try {
      return [importRecipe(JSON.stringify(x))];
    } catch {
      return [];
    }
  });
}
const initialRecipe: Recipe = {
  version: 1,
  name: "Decode & inspect",
  steps: ["url-decode", "base64-decode", "json-beautify"].map(createStep),
};
export default function App() {
  const [recipe, setRecipe] = useLocalStorage<Recipe>(
    "obsidian.recipe.v1",
    initialRecipe,
    (v) => importRecipe(JSON.stringify(v)),
  );
  const [saved, setSaved] = useLocalStorage<Recipe[]>(
    "obsidian.saved.v1",
    [],
    validateRecipes,
  );
  const [history, setHistory] = useLocalStorage<Recipe[]>(
    "obsidian.history.v1",
    [],
    validateRecipes,
  );
  const [favorites, setFavorites] = useLocalStorage<string[]>(
    "obsidian.favorites.v1",
    [],
    (v) =>
      Array.isArray(v)
        ? v.filter((x): x is string => typeof x === "string" && registry.has(x))
        : [],
  );
  const [theme, setTheme] = useLocalStorage<"dark" | "light">(
    "obsidian.theme.v1",
    "dark",
    (v) => (v === "light" ? "light" : "dark"),
  );
  const [input, setInput] = useState(() => {
    try {
      return localStorage.getItem("obsidian.recipe.v1") ? "" : exampleInput;
    } catch {
      return exampleInput;
    }
  });
  const [inputFormat, setInputFormat] = useState("Text");
  const [live, setLive] = useState(true);
  const [dialog, setDialog] = useState<
    "save" | "saved" | "history" | "help" | null
  >(null);
  const [saveName, setSaveName] = useState(recipe.name);
  const [toast, setToast] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const importRef = useRef<HTMLInputElement>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const { result, error, busy, run } = usePipeline(
    input,
    inputFormat,
    recipe.steps,
    live,
  );
  const notice = useCallback((s: string) => {
    clearTimeout(toastTimer.current);
    setToast(s);
    toastTimer.current = setTimeout(() => setToast(""), 4500);
  }, []);
  const setSteps: React.Dispatch<React.SetStateAction<Recipe["steps"]>> =
    useCallback(
      (update) =>
        setRecipe((r) => ({
          ...r,
          steps: typeof update === "function" ? update(r.steps) : update,
        })),
      [setRecipe],
    );
  const remember = useCallback(
    (recipe: Recipe) => {
      const steps = JSON.stringify(recipe.steps);
      setHistory((history) =>
        [
          structuredClone(recipe),
          ...history.filter((item) => JSON.stringify(item.steps) !== steps),
        ].slice(0, 20),
      );
    },
    [setHistory],
  );
  const manualRun = useCallback(() => {
    remember(recipe);
    run();
  }, [recipe, remember, run]);
  const showSave = useCallback(() => {
    setSaveName(recipe.name);
    setDialog("save");
  }, [recipe.name]);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (!event.ctrlKey && !event.metaKey) return;

      const key = event.key.toLowerCase();
      if (key === "enter") {
        event.preventDefault();
        manualRun();
      }
      if (key === "k") {
        event.preventDefault();
        searchRef.current?.focus();
      }
      if (event.shiftKey && key === "s") {
        event.preventDefault();
        showSave();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [manualRun, showSave]);
  function load(r: Recipe) {
    setRecipe(structuredClone(r));
    setDialog(null);
    notice(`Loaded “${r.name}”. Your input is unchanged.`);
  }
  function save() {
    const r = { ...recipe, name: saveName.trim() || "Untitled recipe" };
    setRecipe(r);
    setSaved((a) =>
      [structuredClone(r), ...a.filter((x) => x.name !== r.name)].slice(0, 50),
    );
    remember(r);
    setDialog(null);
    notice(`Saved “${r.name}” on this device.`);
  }
  function preset(id: string) {
    const samples: Record<
      string,
      { name: string; input: string; operations: string[] }
    > = {
      decode: {
        name: initialRecipe.name,
        input: exampleInput,
        operations: ["url-decode", "base64-decode", "json-beautify"],
      },
      hash: {
        name: "Hash a message",
        input: "Hello World",
        operations: ["sha-256"],
      },
      clean: {
        name: "Clean up text",
        input: "  emerald  \n obsidian\n emerald\n  graphite  ",
        operations: ["trim-lines", "sort-lines", "unique-lines"],
      },
    };
    const sample = Object.hasOwn(samples, id) ? samples[id] : undefined;
    if (sample) {
      setInput(sample.input);
      setRecipe({
        version: 1,
        name: sample.name,
        steps: sample.operations.map(createStep),
      });
    }
    setInputFormat("Text");
    notice("Sample recipe loaded.");
  }

  function downloadRecipe() {
    download(exportRecipe(recipe), "obsidian-recipe.json", "application/json");
  }

  function clearWorkspace() {
    setInput("");
    setInputFormat("Text");
    setRecipe({ version: 1, name: "Untitled recipe", steps: [] });
    notice("Workspace cleared. Saved recipes are available in your library.");
  }

  function addOperation(id: string) {
    if (recipe.steps.length >= 100) {
      notice("Recipes support up to 100 operations.");
      return;
    }
    setSteps((steps) => [...steps, createStep(id)]);
  }

  function toggleFavorite(id: string) {
    setFavorites((favorites) =>
      favorites.includes(id)
        ? favorites.filter((item) => item !== id)
        : [...favorites, id],
    );
  }

  async function importFile(file: File) {
    try {
      if (file.size > 1024 * 1024)
        throw new Error("Recipe exceeds the 1 MB limit.");
      const r = importRecipe(await file.text());
      load(r);
    } catch (e) {
      notice((e as Error).message);
    }
  }
  return (
    <div className="app-shell">
      <header className="app-header">
        <a
          className="brand"
          href="#"
          aria-label="OBSIDIAN home"
          onClick={(event) => event.preventDefault()}
        >
          <span className="brand-mark">
            <ObsidianMark />
          </span>
          <div>
            <strong>
              OBSIDIAN<span className="brand-version">v1.0</span>
            </strong>
            <span>DATA TRANSFORMATION WORKSTATION</span>
          </div>
        </a>
        <nav className="main-nav" aria-label="Main navigation">
          <button className="active" onClick={() => setDialog(null)}>
            <Command size={15} />
            Workspace
          </button>
          <button onClick={() => setDialog("saved")}>
            <BookOpen size={15} />
            Recipes<span className="nav-count">{saved.length}</span>
          </button>
          <button onClick={() => setDialog("history")}>
            <Clock3 size={15} />
            History
          </button>
        </nav>
        <div className="header-right">
          <span className="local-badge">
            <span className="status-dot" />
            All systems local
          </span>
          <span className="header-divider" />
          <button
            className="icon-btn"
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
            title={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
            onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
          >
            {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
          </button>
          <button
            className="icon-btn"
            title="Help & keyboard shortcuts"
            aria-label="Help and keyboard shortcuts"
            onClick={() => setDialog("help")}
          >
            <CircleHelp size={17} />
          </button>
          <span className="avatar">N</span>
        </div>
      </header>
      <div className="workspace-toolbar">
        <div className="workspace-breadcrumb">
          <FolderOpen size={14} />
          <span>Workspace</span>
          <ChevronRight size={12} />
          <strong>{recipe.name}</strong>
          <span className="local-tag">LOCAL</span>
        </div>
        <div className="workspace-actions">
          <button
            className="quiet-btn"
            onClick={() => importRef.current?.click()}
          >
            <ArrowUpFromLine size={13} />
            Import recipe
          </button>
          <button
            className="quiet-btn"
            onClick={() => {
              downloadRecipe();
              notice("Recipe exported.");
            }}
          >
            <ArrowDownToLine size={13} />
            Export
          </button>
          <span className="toolbar-separator" />
          <button className="quiet-btn" onClick={clearWorkspace}>
            <RotateCcw size={13} />
            Clear workspace
          </button>
        </div>
        <input
          type="file"
          className="hidden"
          ref={importRef}
          accept=".json,application/json"
          aria-label="Import recipe JSON"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void importFile(f);
            e.target.value = "";
          }}
        />
      </div>
      <main className="workstation">
        <Catalog
          onAdd={addOperation}
          favorites={favorites}
          onFavorite={toggleFavorite}
          searchRef={searchRef}
        />
        <RecipePanel
          steps={recipe.steps}
          setSteps={setSteps}
          live={live}
          setLive={setLive}
          run={manualRun}
          busy={busy}
          result={result}
          onSave={showSave}
          onPreset={preset}
          onBrowse={() => searchRef.current?.focus()}
        />
        <Editors
          input={input}
          setInput={setInput}
          inputFormat={inputFormat}
          setInputFormat={setInputFormat}
          result={result}
          error={error}
          busy={busy}
          notice={notice}
          hasSteps={!!recipe.steps.length}
          stale={!live && !result && !error && !busy}
        />
      </main>
      <footer className="app-status">
        <div>
          <span className={`status-dot ${error ? "status-error" : ""}`} />
          <span>
            {busy ? "Processing" : error ? "Recipe needs attention" : "Ready"}
          </span>
          <span className="status-divider" />
          <GitBranch size={12} />
          <span>{recipe.steps.length} operations in recipe</span>
          {result && (
            <>
              <span className="status-divider" />
              <Activity size={12} />
              <span>{result.elapsed.toFixed(1)} ms</span>
            </>
          )}
        </div>
        <div>
          <LockKeyhole size={11} />
          <span>Client-side processing</span>
          <span className="status-divider" />
          <span>PROJECT NABONIDUS</span>
          <ShieldCheck size={12} />
        </div>
      </footer>
      {dialog && (
        <Dialogs
          mode={dialog}
          close={() => setDialog(null)}
          recipes={saved}
          history={history}
          name={saveName}
          setName={setSaveName}
          onSave={save}
          onLoad={load}
          onDelete={(i) => setSaved((a) => a.filter((_, index) => index !== i))}
          onImport={() => importRef.current?.click()}
          onExport={downloadRecipe}
        />
      )}{" "}
      {toast && (
        <div className="toast" role="status">
          <ShieldCheck size={16} />
          <span>{toast}</span>
          <button
            className="icon-btn small"
            aria-label="Dismiss notification"
            onClick={() => setToast("")}
          >
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
