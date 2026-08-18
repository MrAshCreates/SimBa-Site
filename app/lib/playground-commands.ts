import type { ConsoleSource, OutputLine, OutputType } from "~/components/output-console/output-console";
import { exampleFileName, findExampleByFilename, type SimBaExample } from "~/data/examples";
import type { Project } from "~/data/auth";
import type { AccentStyle, ColorSchemePreference, UserSettings } from "~/hooks/use-user-settings";

export type { ConsoleSource };
export type TerminalMode = "output" | "terminal";

export interface CommandFile {
  id: string;
  name: string;
  content: string;
  path: string;
  isDirty: boolean;
  isReadOnly?: boolean;
  isExample?: boolean;
}

export interface CommandMeta {
  history: string[];
}

export interface PlaygroundCommandApi {
  print: (type: OutputType, content: string, source?: ConsoleSource) => void;
  clear: () => void;
  getActiveFile: () => CommandFile | undefined;
  openFiles: CommandFile[];
  projects: Project[];
  examples: SimBaExample[];
  userName?: string;
  userEmail?: string;
  settings: UserSettings;
  consoleMode: TerminalMode;
  showSidebar: boolean;
  showConsole: boolean;
  showExamples: boolean;
  isFullscreen: boolean;
  executeCode: (mode: "compile" | "run" | "debug", source?: string) => Promise<boolean>;
  loadExample: (example: SimBaExample) => void;
  openSavedFile: (project: Project) => void;
  focusFile: (fileId: string) => void;
  closeFile: (fileId: string) => void;
  createFile: (name?: string, content?: string) => Promise<void>;
  saveFile: (name: string) => Promise<void>;
  renameFile: (fileId: string, newName: string) => Promise<void>;
  deleteFile: (fileId: string) => Promise<void>;
  exportFile: () => void;
  setConsoleMode: (mode: TerminalMode) => void;
  setShowSidebar: (value: boolean) => void;
  setShowConsole: (value: boolean) => void;
  setShowExamples: (value: boolean) => void;
  setFullscreen: (value: boolean) => void;
  setColorScheme: (scheme: ColorSchemePreference) => void;
  updateSettings: <T extends keyof UserSettings, K extends keyof UserSettings[T]>(
    category: T,
    key: K,
    value: UserSettings[T][K],
  ) => void;
  navigate: (path: string) => void;
}

interface CommandSpec {
  name: string;
  aliases: string[];
  usage: string;
  summary: string;
  details: string[];
}

export const COMMAND_SPECS: CommandSpec[] = [
  {
    name: "help",
    aliases: ["?"],
    usage: "help [command]",
    summary: "List commands or explain one command",
    details: ["Use help <command> for usage and aliases."],
  },
  {
    name: "clear",
    aliases: ["cls"],
    usage: "clear",
    summary: "Clear the console (both output and terminal history)",
    details: ["The prompt stays. Scroll position resets to the top."],
  },
  {
    name: "ls",
    aliases: ["files"],
    usage: "ls",
    summary: "List saved files in your workspace",
    details: ["Use tabs for open editors, examples for sample programs."],
  },
  {
    name: "tabs",
    aliases: ["buffers"],
    usage: "tabs",
    summary: "List open editor tabs",
    details: ["The active file is marked with *."],
  },
  {
    name: "examples",
    aliases: ["ex"],
    usage: "examples",
    summary: "List built-in example programs",
    details: ["Open one with: open hello-world.smba"],
  },
  {
    name: "open",
    aliases: ["o"],
    usage: "open <file|example>",
    summary: "Open a saved file, tab, or example",
    details: ["Matches saved files first, then open tabs, then examples."],
  },
  {
    name: "close",
    aliases: [],
    usage: "close [file]",
    summary: "Close a tab (current file if omitted)",
    details: ["Does not delete saved files. Use rm to delete."],
  },
  {
    name: "new",
    aliases: ["touch"],
    usage: "new [name]",
    summary: "Create and open a new file",
    details: ["Default name uses your default extension from settings."],
  },
  {
    name: "save",
    aliases: ["w"],
    usage: "save [name]",
    summary: "Save the current file",
    details: ["Examples are read-only; copy them into a new file first."],
  },
  {
    name: "rename",
    aliases: ["mv"],
    usage: "rename <name>",
    summary: "Rename the current saved file",
    details: ["Cannot rename example tabs."],
  },
  {
    name: "rm",
    aliases: ["delete", "del"],
    usage: "rm [--force] <file>",
    summary: "Delete a saved file",
    details: ["Use --force to skip the confirmation prompt."],
  },
  {
    name: "cat",
    aliases: ["type"],
    usage: "cat [file]",
    summary: "Print file contents in the terminal",
    details: ["Long files are truncated. Omit a name to print the active file."],
  },
  {
    name: "run",
    aliases: [],
    usage: "run [file]",
    summary: "Compile and run SimBa",
    details: ["Runs the active editor if no file is given."],
  },
  {
    name: "compile",
    aliases: [],
    usage: "compile [file]",
    summary: "Compile SimBa without executing",
    details: ["Useful to check syntax before a full run."],
  },
  {
    name: "debug",
    aliases: [],
    usage: "debug [file]",
    summary: "Compile and run with debug tracing",
    details: ["Shows interpreter debug lines when available."],
  },
  {
    name: "exec",
    aliases: ["eval"],
    usage: "exec <code>",
    summary: "Compile and run inline SimBa",
    details: ['Example: exec print("hi")'],
  },
  {
    name: "pwd",
    aliases: ["current"],
    usage: "pwd",
    summary: "Show the active file path",
    details: [],
  },
  {
    name: "status",
    aliases: ["info"],
    usage: "status",
    summary: "Show playground state: file, panels, mode",
    details: [],
  },
  {
    name: "whoami",
    aliases: ["user"],
    usage: "whoami",
    summary: "Show the signed-in account",
    details: [],
  },
  {
    name: "sidebar",
    aliases: [],
    usage: "sidebar [on|off|toggle]",
    summary: "Show, hide, or toggle the files sidebar",
    details: [],
  },
  {
    name: "console",
    aliases: [],
    usage: "console [on|off|toggle]",
    summary: "Show, hide, or toggle this console panel",
    details: ["Hiding the console still leaves the editor usable from the toolbar."],
  },
  {
    name: "panel",
    aliases: ["examples-panel"],
    usage: "panel [on|off|toggle]",
    summary: "Show, hide, or toggle the examples panel",
    details: ["Same action as the toolbar examples button and the panel X."],
  },
  {
    name: "fullscreen",
    aliases: ["fs"],
    usage: "fullscreen [on|off|toggle]",
    summary: "Toggle editor fullscreen",
    details: [],
  },
  {
    name: "mode",
    aliases: ["view"],
    usage: "mode output|terminal",
    summary: "Switch between Output (limited) and Terminal (full)",
    details: ["Output shows run results only. Terminal is a full command session."],
  },
  {
    name: "theme",
    aliases: [],
    usage: "theme [dark|light|system]",
    summary: "Change the site color scheme",
    details: ["Omit a value to print the current scheme."],
  },
  {
    name: "accent",
    aliases: [],
    usage: "accent [violet|ocean|ember|forest|slate]",
    summary: "Change the site accent color",
    details: [],
  },
  {
    name: "settings",
    aliases: ["set"],
    usage: "settings [path] [value]",
    summary: "Print settings, change one, or open the settings page",
    details: [
      "settings                  Print a summary",
      "settings open             Open the settings page",
      "set editor.fontSize 16    Change a setting",
    ],
  },
  {
    name: "export",
    aliases: ["download"],
    usage: "export",
    summary: "Download the active file",
    details: [],
  },
  {
    name: "guide",
    aliases: ["tutorial"],
    usage: "guide",
    summary: "How to use the playground from this terminal",
    details: [],
  },
  {
    name: "history",
    aliases: [],
    usage: "history",
    summary: "Show recent commands typed in this session",
    details: [],
  },
];

const COMMAND_INDEX = new Map<string, CommandSpec>();
for (const spec of COMMAND_SPECS) {
  COMMAND_INDEX.set(spec.name, spec);
  for (const alias of spec.aliases) {
    COMMAND_INDEX.set(alias, spec);
  }
}

export const COMMAND_NAMES = Array.from(COMMAND_INDEX.keys()).sort();

export function createConsoleLine(
  type: OutputType,
  content: string,
  source: ConsoleSource = "session",
): OutputLine {
  return {
    id: `c-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`,
    type,
    content,
    timestamp: new Date(),
    source,
  };
}

function printLines(api: PlaygroundCommandApi, type: OutputType, lines: string[]) {
  for (const line of lines) {
    api.print(type, line, "session");
  }
}

function matchName(candidate: string, query: string) {
  return candidate.toLowerCase() === query.toLowerCase();
}

function findSavedFile(api: PlaygroundCommandApi, name: string) {
  return api.projects.find((file) => matchName(file.name, name) || matchName(file.id, name));
}

function findOpenFile(api: PlaygroundCommandApi, name: string) {
  const lower = name.toLowerCase();
  return api.openFiles.find(
    (file) =>
      file.name.toLowerCase() === lower ||
      file.path.toLowerCase() === lower ||
      file.path.toLowerCase().endsWith(lower) ||
      file.id.toLowerCase() === lower,
  );
}

function findRunnableSource(api: PlaygroundCommandApi, name: string) {
  const open = findOpenFile(api, name);
  if (open) return { kind: "open" as const, file: open };
  const saved = findSavedFile(api, name);
  if (saved) return { kind: "saved" as const, file: saved };
  const example = findExampleByFilename(name);
  if (example) return { kind: "example" as const, example };
  return null;
}

function parseToggle(value: string | undefined, current: boolean): boolean | null {
  if (!value || value === "toggle") return !current;
  if (["on", "show", "open", "true", "1"].includes(value)) return true;
  if (["off", "hide", "close", "false", "0"].includes(value)) return false;
  return null;
}

function parseBoolean(value: string): boolean | null {
  if (["true", "on", "yes", "1"].includes(value)) return true;
  if (["false", "off", "no", "0"].includes(value)) return false;
  return null;
}

export const SETTABLE_PATHS: Record<
  string,
  {
    category: keyof UserSettings;
    key: string;
    kind: "string" | "number" | "boolean";
    options?: string[];
  }
> = {
  "editor.theme": { category: "editor", key: "theme", kind: "string", options: ["vs-dark", "vs-light", "hc-black", "hc-light"] },
  "editor.fontSize": { category: "editor", key: "fontSize", kind: "number" },
  "editor.tabSize": { category: "editor", key: "tabSize", kind: "number" },
  "editor.wordWrap": { category: "editor", key: "wordWrap", kind: "boolean" },
  "editor.minimap": { category: "editor", key: "minimap", kind: "boolean" },
  "editor.lineNumbers": { category: "editor", key: "lineNumbers", kind: "boolean" },
  "editor.keybinds": { category: "editor", key: "keybinds", kind: "string", options: ["default", "vscode", "sublime", "vim"] },
  "editor.autoSaveDelay": { category: "editor", key: "autoSaveDelay", kind: "number" },
  "terminal.fontSize": { category: "terminal", key: "fontSize", kind: "number" },
  "terminal.showTimestamps": { category: "terminal", key: "showTimestamps", kind: "boolean" },
  "terminal.clearOnRun": { category: "terminal", key: "clearOnRun", kind: "boolean" },
  "terminal.cursorStyle": { category: "terminal", key: "cursorStyle", kind: "string", options: ["block", "underline", "bar"] },
  "terminal.scrollbackLimit": { category: "terminal", key: "scrollbackLimit", kind: "number" },
  "general.autoSave": { category: "general", key: "autoSave", kind: "boolean" },
  "general.confirmDelete": { category: "general", key: "confirmDelete", kind: "boolean" },
  "general.defaultExtension": { category: "general", key: "defaultExtension", kind: "string", options: [".smba", ".py", ".rs"] },
  "appearance.colorScheme": {
    category: "appearance",
    key: "colorScheme",
    kind: "string",
    options: ["system", "light", "dark"],
  },
  "appearance.accent": {
    category: "appearance",
    key: "accent",
    kind: "string",
    options: ["violet", "ocean", "ember", "forest", "slate"],
  },
  "appearance.density": { category: "appearance", key: "density", kind: "string", options: ["comfortable", "compact"] },
  "appearance.siteStyle": { category: "appearance", key: "siteStyle", kind: "string", options: ["default", "high-contrast"] },
  "playground.defaultConsoleMode": {
    category: "playground",
    key: "defaultConsoleMode",
    kind: "string",
    options: ["output", "terminal"],
  },
  "playground.showSidebar": { category: "playground", key: "showSidebar", kind: "boolean" },
  "playground.showConsole": { category: "playground", key: "showConsole", kind: "boolean" },
  "playground.showExamples": { category: "playground", key: "showExamples", kind: "boolean" },
};

function helpFor(spec: CommandSpec) {
  const lines = [`${spec.usage}`, `  ${spec.summary}`];
  if (spec.aliases.length > 0) {
    lines.push(`  Aliases: ${spec.aliases.join(", ")}`);
  }
  for (const detail of spec.details) {
    lines.push(`  ${detail}`);
  }
  return lines;
}

function applySetting(api: PlaygroundCommandApi, path: string, rawValue: string) {
  const spec = SETTABLE_PATHS[path];
  if (!spec) {
    api.print("error", `Unknown setting: ${path}. Try \`settings\` for a summary.`, "session");
    return;
  }

  let value: unknown = rawValue;
  if (spec.kind === "number") {
    const parsed = Number(rawValue);
    if (!Number.isFinite(parsed)) {
      api.print("error", `Expected a number for ${path}.`, "session");
      return;
    }
    value = parsed;
  } else if (spec.kind === "boolean") {
    const parsed = parseBoolean(rawValue.toLowerCase());
    if (parsed === null) {
      api.print("error", `Expected on/off for ${path}.`, "session");
      return;
    }
    value = parsed;
  } else if (spec.options && !spec.options.includes(rawValue)) {
    api.print("error", `Invalid value for ${path}. Options: ${spec.options.join(", ")}`, "session");
    return;
  }

  if (path === "appearance.colorScheme") {
    api.setColorScheme(value as ColorSchemePreference);
  }

  api.updateSettings(spec.category, spec.key as never, value as never);
  api.print("success", `${path} = ${String(value)}`, "session");
}

function defaultFileName(api: PlaygroundCommandApi, name?: string) {
  if (!name) {
    return `untitled${api.settings.general.defaultExtension || ".smba"}`;
  }
  if (name.includes(".")) {
    return name;
  }
  return `${name}${api.settings.general.defaultExtension || ".smba"}`;
}

async function runNamed(api: PlaygroundCommandApi, mode: "compile" | "run" | "debug", filename?: string) {
  if (!filename) {
    await api.executeCode(mode);
    return;
  }

  const resolved = findRunnableSource(api, filename);
  if (!resolved) {
    api.print(
      "error",
      `File not found: ${filename}. Try \`ls\`, \`tabs\`, or \`examples\`.`,
      "session",
    );
    return;
  }

  if (resolved.kind === "open") {
    await api.executeCode(mode, resolved.file.content);
    return;
  }
  if (resolved.kind === "saved") {
    api.openSavedFile(resolved.file);
    await api.executeCode(mode, resolved.file.content);
    return;
  }
  api.loadExample(resolved.example);
  await api.executeCode(mode, resolved.example.code);
}

export async function executePlaygroundCommand(
  raw: string,
  api: PlaygroundCommandApi,
  meta: CommandMeta,
): Promise<void> {
  const parts = raw.trim().split(/\s+/);
  const invoked = parts[0]?.toLowerCase() ?? "";
  const args = parts.slice(1);
  const spec = COMMAND_INDEX.get(invoked);

  if (!spec) {
    api.print("error", `Unknown command: ${invoked}. Type \`help\` for available commands.`, "session");
    return;
  }

  switch (spec.name) {
    case "help": {
      const query = args[0]?.toLowerCase();
      if (query) {
        const target = COMMAND_INDEX.get(query);
        if (!target) {
          api.print("error", `No help for '${query}'. Type \`help\` for a list.`, "session");
          return;
        }
        printLines(api, "info", helpFor(target));
        return;
      }
      api.print("info", "SimBa playground commands. Use help <command> for details.", "session");
      for (const command of COMMAND_SPECS) {
        api.print("info", `  ${command.usage.padEnd(28)} ${command.summary}`, "session");
      }
      return;
    }
    case "clear":
      api.clear();
      return;
    case "ls": {
      if (api.projects.length === 0) {
        api.print("info", "No saved files. Use `new` to create one.", "session");
        return;
      }
      api.print("info", "Saved files:", "session");
      for (const file of api.projects) {
        api.print("info", `  ${file.name}`, "session");
      }
      return;
    }
    case "tabs": {
      if (api.openFiles.length === 0) {
        api.print("info", "No open tabs.", "session");
        return;
      }
      const active = api.getActiveFile();
      api.print("info", "Open tabs:", "session");
      for (const file of api.openFiles) {
        const mark = file.id === active?.id ? "*" : " ";
        const flags = [
          file.isDirty ? "modified" : null,
          file.isExample ? "example" : null,
          file.isReadOnly ? "read-only" : null,
        ]
          .filter(Boolean)
          .join(", ");
        api.print("info", ` ${mark} ${file.name}${flags ? `  (${flags})` : ""}`, "session");
      }
      return;
    }
    case "examples": {
      api.print("info", "Example programs:", "session");
      for (const example of api.examples) {
        api.print("info", `  ${exampleFileName(example).padEnd(22)} ${example.title} — ${example.description}`, "session");
      }
      api.print("info", "Open with: open hello-world.smba", "session");
      return;
    }
    case "open": {
      const name = args[0];
      if (!name) {
        api.print("error", "Usage: open <file|example>", "session");
        return;
      }
      const saved = findSavedFile(api, name);
      if (saved) {
        api.openSavedFile(saved);
        api.print("success", `Opened ${saved.name}`, "session");
        return;
      }
      const open = findOpenFile(api, name);
      if (open) {
        api.focusFile(open.id);
        api.print("success", `Switched to ${open.name}`, "session");
        return;
      }
      const example = findExampleByFilename(name);
      if (example) {
        api.loadExample(example);
        return;
      }
      api.print("error", `Nothing named '${name}'. Try ls, tabs, or examples.`, "session");
      return;
    }
    case "close": {
      const name = args[0];
      const target = name ? findOpenFile(api, name) : api.getActiveFile();
      if (!target) {
        api.print("error", name ? `No open tab named ${name}.` : "No file is open.", "session");
        return;
      }
      api.closeFile(target.id);
      api.print("info", `Closed ${target.name}`, "session");
      return;
    }
    case "new": {
      await api.createFile(defaultFileName(api, args[0]));
      return;
    }
    case "save": {
      const active = api.getActiveFile();
      if (!active) {
        api.print("error", "No file is open.", "session");
        return;
      }
      if (active.isReadOnly || active.isExample) {
        api.print("error", "This tab is read-only. Use `new` then paste, or `save` a regular file.", "session");
        return;
      }
      await api.saveFile(args[0] || active.name);
      return;
    }
    case "rename": {
      const active = api.getActiveFile();
      const newName = args[0];
      if (!active) {
        api.print("error", "No file is open.", "session");
        return;
      }
      if (!newName) {
        api.print("error", "Usage: rename <name>", "session");
        return;
      }
      if (active.isExample || active.isReadOnly) {
        api.print("error", "Cannot rename an example tab.", "session");
        return;
      }
      await api.renameFile(active.id, defaultFileName(api, newName));
      return;
    }
    case "rm": {
      const force = args[0] === "--force" || args[0] === "-f";
      const name = force ? args[1] : args[0];
      if (!name) {
        api.print("error", "Usage: rm [--force] <file>", "session");
        return;
      }
      const saved = findSavedFile(api, name);
      if (!saved) {
        api.print("error", `Saved file not found: ${name}`, "session");
        return;
      }
      if (api.settings.general.confirmDelete && !force) {
        const ok = window.confirm(`Delete ${saved.name}? This cannot be undone.`);
        if (!ok) {
          api.print("info", "Delete cancelled. Use `rm --force name` to skip this prompt.", "session");
          return;
        }
      }
      await api.deleteFile(saved.id);
      return;
    }
    case "cat": {
      const name = args[0];
      const target = name ? findOpenFile(api, name) || findSavedFile(api, name) : api.getActiveFile();
      const example = !target && name ? findExampleByFilename(name) : undefined;
      const content = target && "content" in target ? target.content : example?.code;
      const label = target && "name" in target ? target.name : example ? exampleFileName(example) : undefined;
      if (!content || !label) {
        api.print("error", name ? `File not found: ${name}` : "No file is open.", "session");
        return;
      }
      const lines = content.replace(/\n$/, "").split("\n");
      const limit = 80;
      api.print("info", `--- ${label} ---`, "session");
      for (const line of lines.slice(0, limit)) {
        api.print("program", line.length === 0 ? " " : line, "session");
      }
      if (lines.length > limit) {
        api.print("info", `... ${lines.length - limit} more lines. Open the file in the editor to see the rest.`, "session");
      }
      return;
    }
    case "run":
      await runNamed(api, "run", args[0]);
      return;
    case "compile":
      await runNamed(api, "compile", args[0]);
      return;
    case "debug":
      await runNamed(api, "debug", args[0]);
      return;
    case "exec": {
      const code = args.join(" ");
      if (!code.trim()) {
        api.print("error", "Usage: exec <code>", "session");
        return;
      }
      await api.executeCode("run", code);
      return;
    }
    case "pwd": {
      const active = api.getActiveFile();
      api.print("info", active ? active.path : "(no file open)", "session");
      return;
    }
    case "status": {
      const active = api.getActiveFile();
      printLines(api, "info", [
        `file: ${active ? `${active.name}${active.isDirty ? " (modified)" : ""}` : "(none)"}`,
        `mode: ${api.consoleMode === "terminal" ? "terminal (full)" : "output (limited)"}`,
        `sidebar: ${api.showSidebar ? "on" : "off"}`,
        `console: ${api.showConsole ? "on" : "off"}`,
        `examples panel: ${api.showExamples ? "on" : "off"}`,
        `fullscreen: ${api.isFullscreen ? "on" : "off"}`,
        `theme: ${api.settings.appearance.colorScheme} / ${api.settings.appearance.accent}`,
      ]);
      return;
    }
    case "whoami":
      api.print("info", api.userEmail || api.userName || "signed in", "session");
      return;
    case "sidebar": {
      const next = parseToggle(args[0]?.toLowerCase(), api.showSidebar);
      if (next === null) {
        api.print("error", "Usage: sidebar [on|off|toggle]", "session");
        return;
      }
      api.setShowSidebar(next);
      api.print("info", `Sidebar ${next ? "shown" : "hidden"}`, "session");
      return;
    }
    case "console": {
      const next = parseToggle(args[0]?.toLowerCase(), api.showConsole);
      if (next === null) {
        api.print("error", "Usage: console [on|off|toggle]", "session");
        return;
      }
      api.setShowConsole(next);
      if (next) {
        api.print("info", "Console shown", "session");
      }
      return;
    }
    case "panel": {
      const next = parseToggle(args[0]?.toLowerCase(), api.showExamples);
      if (next === null) {
        api.print("error", "Usage: panel [on|off|toggle]", "session");
        return;
      }
      api.setShowExamples(next);
      api.print("info", `Examples panel ${next ? "shown" : "hidden"}`, "session");
      return;
    }
    case "fullscreen": {
      const next = parseToggle(args[0]?.toLowerCase(), api.isFullscreen);
      if (next === null) {
        api.print("error", "Usage: fullscreen [on|off|toggle]", "session");
        return;
      }
      api.setFullscreen(next);
      api.print("info", `Fullscreen ${next ? "on" : "off"}`, "session");
      return;
    }
    case "mode": {
      const value = args[0]?.toLowerCase();
      if (value !== "output" && value !== "terminal") {
        api.print("error", "Usage: mode output|terminal", "session");
        return;
      }
      api.setConsoleMode(value);
      api.print(
        "info",
        value === "terminal"
          ? "Terminal (full mode): commands and program output share this view."
          : "Output (limited mode): run results only.",
        "session",
      );
      return;
    }
    case "theme": {
      const value = args[0]?.toLowerCase();
      if (!value) {
        api.print("info", `Color scheme: ${api.settings.appearance.colorScheme}`, "session");
        return;
      }
      if (value !== "dark" && value !== "light" && value !== "system") {
        api.print("error", "Usage: theme dark|light|system", "session");
        return;
      }
      api.setColorScheme(value);
      api.updateSettings("appearance", "colorScheme", value);
      api.print("success", `Color scheme set to ${value}`, "session");
      return;
    }
    case "accent": {
      const value = args[0]?.toLowerCase() as AccentStyle | undefined;
      const options: AccentStyle[] = ["violet", "ocean", "ember", "forest", "slate"];
      if (!value) {
        api.print("info", `Accent: ${api.settings.appearance.accent}`, "session");
        return;
      }
      if (!options.includes(value)) {
        api.print("error", `Usage: accent ${options.join("|")}`, "session");
        return;
      }
      api.updateSettings("appearance", "accent", value);
      api.print("success", `Accent set to ${value}`, "session");
      return;
    }
    case "settings": {
      if (args[0] === "open") {
        api.navigate("/settings");
        api.print("info", "Opening settings…", "session");
        return;
      }
      if (args.length >= 2) {
        applySetting(api, args[0], args.slice(1).join(" "));
        return;
      }
      if (args.length === 1 && SETTABLE_PATHS[args[0]]) {
        const specPath = SETTABLE_PATHS[args[0]];
        const current = (api.settings[specPath.category] as Record<string, unknown>)[specPath.key];
        api.print("info", `${args[0]} = ${String(current)}`, "session");
        return;
      }
      printLines(api, "info", [
        `editor.theme=${api.settings.editor.theme}  fontSize=${api.settings.editor.fontSize}  tabSize=${api.settings.editor.tabSize}`,
        `terminal.fontSize=${api.settings.terminal.fontSize}  clearOnRun=${api.settings.terminal.clearOnRun}  cursor=${api.settings.terminal.cursorStyle}`,
        `appearance=${api.settings.appearance.colorScheme}/${api.settings.appearance.accent}  style=${api.settings.appearance.siteStyle}  density=${api.settings.appearance.density}`,
        `playground mode default=${api.settings.playground.defaultConsoleMode}`,
        "Change a value with: set editor.fontSize 16",
        "Open the settings page with: settings open",
      ]);
      return;
    }
    case "export":
      api.exportFile();
      return;
    case "guide":
      printLines(api, "info", [
        "This terminal can drive the playground.",
        "  ls / examples / open <name>     browse and open files",
        "  new / save / rename / rm        manage files",
        "  run / compile / debug / exec    execute SimBa",
        "  sidebar / panel / mode          change the layout",
        "  theme / accent / settings       change appearance",
        "Output mode is results-only. Terminal mode is this full session.",
        "Type help for every command.",
      ]);
      return;
    case "history": {
      if (meta.history.length === 0) {
        api.print("info", "No commands in this session yet.", "session");
        return;
      }
      meta.history.slice(-30).forEach((command, index) => {
        api.print("info", `  ${String(index + 1).padStart(3)}  ${command}`, "session");
      });
      return;
    }
    default:
      api.print("error", `Command '${spec.name}' is not implemented.`, "session");
  }
}

export function completeTerminalInput(
  value: string,
  extras: string[],
): { next: string; matches: string[] } | null {
  const parts = value.split(/\s+/);
  const completingArg = value.endsWith(" ") || parts.length > 1;
  const prefix = (completingArg ? parts[parts.length - 1] : parts[0] || "").toLowerCase();
  const pool = completingArg ? extras : COMMAND_NAMES;
  const matches = pool.filter((item) => item.toLowerCase().startsWith(prefix));
  if (matches.length === 0) {
    return null;
  }
  const completed = matches[0];
  if (!completingArg) {
    return { next: completed, matches };
  }
  const head = parts.slice(0, -1).join(" ");
  return { next: `${head} ${completed}`.trim(), matches };
}
