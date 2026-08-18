import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router";
import classNames from "classnames";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import type { Route } from "./+types/playground";
import { Navigation } from "~/components/navigation/navigation";
import { CodeEditor } from "~/components/code-editor/code-editor";
import { TerminalConsole, type TerminalMode } from "~/components/terminal-console/terminal-console";
import type { OutputLine, OutputStatus } from "~/components/output-console/output-console";
import { ActionPanel } from "~/components/action-panel/action-panel";
import { Sidebar } from "~/components/sidebar/sidebar";
import type { FileNode } from "~/components/file-explorer/file-explorer";
import { useAuth } from "~/hooks/use-auth";
import { useUserSettings } from "~/hooks/use-user-settings";
import { exampleFileName, findExampleByFilename, SIMBA_EXAMPLES, type SimBaExample } from "~/data/examples";
import type { Project } from "~/data/auth";
import {
  PanelLeftClose,
  PanelLeftOpen,
  PanelBottomClose,
  PanelBottomOpen,
  PanelRightClose,
  PanelRightOpen,
  Maximize2,
  Minimize2,
  Download,
  Upload,
  X,
} from "lucide-react";
import styles from "./playground.module.css";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Playground - SimBa" },
    {
      name: "description",
      content: "Interactive SimBa playground for writing, testing, and managing your hybrid Python/Rust code.",
    },
  ];
}

interface ExecutionResult {
  status: "success" | "error";
  stdout: string;
  stderr: string;
  output?: string;
  mode?: "compile" | "run" | "debug";
}

interface OpenFile {
  id: string;
  name: string;
  content: string;
  path: string;
  isDirty: boolean;
  isReadOnly?: boolean;
  isExample?: boolean;
}

function parseProject(value: unknown): Project | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as Record<string, unknown>;
  if (typeof record.id !== "string" || typeof record.name !== "string" || typeof record.content !== "string") {
    return null;
  }

  return {
    id: record.id,
    userId: typeof record.userId === "string" ? record.userId : "",
    name: record.name,
    content: record.content,
    createdAt: new Date(String(record.createdAt)),
    updatedAt: new Date(String(record.updatedAt)),
  };
}

export default function Playground() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { settings } = useUserSettings();
  const navigate = useNavigate();

  // Editor state
  const [openFiles, setOpenFiles] = useState<OpenFile[]>([]);
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [output, setOutput] = useState<OutputLine[]>([]);
  const [status, setStatus] = useState<OutputStatus>("ready");
  const [consoleMode, setConsoleMode] = useState<TerminalMode>("output");
  const [compiledSource, setCompiledSource] = useState<string | null>(null);

  // Project state
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);

  // Panel visibility state
  const [showSidebar, setShowSidebar] = useState(true);
  const [showConsole, setShowConsole] = useState(true);
  const [showActions, setShowActions] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const fileTree: FileNode[] = projects.map((file) => ({
    id: file.id,
    name: file.name,
    type: "file" as const,
    path: file.name,
  }));

  const loadFiles = useCallback(async (): Promise<Project[]> => {
    const response = await fetch("/api/files");
    if (!response.ok) {
      throw new Error("Failed to load files");
    }
    const data = (await response.json()) as { files?: unknown[] };
    return (data.files ?? []).map(parseProject).filter((file): file is Project => file !== null);
  }, []);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, isLoading, navigate]);

  useEffect(() => {
    if (!user) return;

    let cancelled = false;
    setIsLoadingProjects(true);
    loadFiles()
      .then((files) => {
        if (cancelled) return;
        setProjects(files);
        setOpenFiles((current) => {
          if (current.length > 0) {
            return current;
          }
          const first = files[0];
          return first
            ? [{ id: first.id, name: first.name, content: first.content, path: first.name, isDirty: false }]
            : [];
        });
        setActiveFileId((current) => current ?? files[0]?.id ?? null);
        setCurrentProject((current) => current ?? files[0] ?? null);
      })
      .catch((error) => {
        console.error("Failed to load files:", error);
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoadingProjects(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [user, loadFiles]);

  const persistFile = useCallback(async (fileId: string, updates: { name?: string; content?: string }) => {
    const response = await fetch(`/api/files/${fileId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    if (!response.ok) {
      throw new Error("Failed to save file");
    }
    const data = (await response.json()) as { file?: unknown };
    const saved = parseProject(data.file);
    if (!saved) {
      throw new Error("Invalid file response");
    }

    setProjects((prev) => prev.map((file) => (file.id === saved.id ? saved : file)));
    setOpenFiles((prev) =>
      prev.map((file) =>
        file.id === saved.id
          ? { ...file, name: saved.name, content: saved.content, path: saved.name, isDirty: false }
          : file,
      ),
    );
    setCurrentProject((prev) => (prev?.id === saved.id ? saved : prev));
    return saved;
  }, []);

  useEffect(() => {
    if (!settings.general?.autoSave) {
      return;
    }

    const active = openFiles.find((file) => file.id === activeFileId);
    if (!active?.isDirty || active.isReadOnly || active.isExample) {
      return;
    }

    const delay = Math.max(1, settings.editor?.autoSaveDelay || 2) * 1000;
    const timer = window.setTimeout(() => {
      void persistFile(active.id, { content: active.content }).catch((error) => {
        console.error("Auto-save failed:", error);
      });
    }, delay);

    return () => window.clearTimeout(timer);
  }, [openFiles, activeFileId, persistFile, settings.general?.autoSave, settings.editor?.autoSaveDelay]);

  const addOutput = useCallback((type: "success" | "error" | "info" | "program", content: string) => {
    const newLine: OutputLine = {
      id: Date.now().toString(),
      type,
      content,
      timestamp: new Date(),
    };
    setOutput((prev) => [...prev, newLine]);
  }, []);

  const clearOutput = useCallback(() => {
    setOutput([]);
    setStatus("ready");
  }, []);

  const getActiveFile = () => {
    return openFiles.find((file) => file.id === activeFileId);
  };

  const updateFileContent = (fileId: string, content: string) => {
    setOpenFiles((prev) =>
      prev.map((file) => (file.id === fileId && !file.isReadOnly ? { ...file, content, isDirty: true } : file)),
    );
  };

  const executeCode = useCallback(
    async (mode: "compile" | "run" | "debug" = "run", source?: string) => {
      const activeFile = getActiveFile();
      const code = source ?? activeFile?.content ?? "";
      if (!code.trim()) {
        addOutput("error", "No active file or file is empty, nothing to run.");
        return false;
      }

      setStatus("running");
      if (settings.terminal?.clearOnRun !== false) {
        clearOutput();
      }

      const runRequest = async (requestMode: "compile" | "run" | "debug") => {
        const response = await fetch("/api/run-simba-code", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code, mode: requestMode }),
        });
        const result = (await response.json()) as ExecutionResult & { error?: string };
        if (!response.ok) {
          throw new Error(result.error || `HTTP error! status: ${response.status}`);
        }
        return result;
      };

      const printResult = (result: ExecutionResult, label: string) => {
        if (result.stderr) {
          result.stderr.split("\n").forEach((line) => {
            if (line.trim()) addOutput("error", line);
          });
        }
        const text = result.output || result.stdout || "";
        if (text.trim()) {
          addOutput("info", `\n=== ${label} ===`);
          text.split("\n").forEach((line) => {
            if (!line.trim()) return;
            if (line.startsWith("[debug]")) {
              addOutput("info", line);
            } else {
              addOutput(line.toLowerCase().includes("error") ? "error" : "program", line);
            }
          });
        }
      };

      try {
        addOutput("info", "=== SimBa Compile ===");
        const compiled = await runRequest("compile");
        printResult(compiled, "Compiler");
        if (compiled.status !== "success") {
          addOutput("error", "Compile failed. Fix the errors above before running.");
          setStatus("error");
          setCompiledSource(null);
          return false;
        }
        addOutput("success", "Compile succeeded.");
        setCompiledSource(code);

        if (mode === "compile") {
          setStatus("success");
          return true;
        }

        addOutput("info", mode === "debug" ? "=== SimBa Debug ===" : "=== SimBa Execution ===");
        const executed = await runRequest(mode);
        printResult(executed, mode === "debug" ? "Debug output" : "Program output");
        if (executed.status === "success") {
          addOutput("success", mode === "debug" ? "Debug run finished." : "Execution completed successfully.");
          setStatus("success");
          return true;
        }
        setStatus("error");
        return false;
      } catch (error) {
        addOutput(
          "error",
          `Network error: ${error instanceof Error ? error.message : "Failed to connect to execution server"}`,
        );
        setStatus("error");
        return false;
      }
    },
    [openFiles, activeFileId, addOutput, clearOutput, settings.terminal?.clearOnRun],
  );

  const handleTerminalCommand = useCallback(
    async (command: string) => {
      const args = command.trim().split(/\s+/);
      const cmd = args[0]?.toLowerCase();
      const filename = args[1];

      const loadExampleCode = (name: string) => {
        const example = findExampleByFilename(name);
        if (!example) return null;
        handleLoadExample(example);
        return example.code;
      };

      if (cmd === "run" || cmd === "compile" || cmd === "debug") {
        const mode = cmd;
        if (filename) {
          const exampleCode = loadExampleCode(filename);
          if (!exampleCode) {
            const open = openFiles.find(
              (file) => file.name.toLowerCase() === filename.toLowerCase() || file.path.toLowerCase().endsWith(filename.toLowerCase()),
            );
            if (!open) {
              addOutput("error", `File not found: ${filename}. Try \`ls\` or pick a program from the Examples sidebar.`);
              return;
            }
            await executeCode(mode, open.content);
            return;
          }
          await executeCode(mode, exampleCode);
          return;
        }
        await executeCode(mode);
        return;
      }

      if (cmd === "exec") {
        const code = args.slice(1).join(" ");
        if (!code.trim()) {
          addOutput("error", "Usage: exec <code>");
          return;
        }
        await executeCode("run", code);
      }
    },
    [addOutput, executeCode, openFiles],
  );

  const handleRun = useCallback(() => {
    void executeCode("run");
  }, [executeCode]);

  const handleCompile = useCallback(() => {
    void executeCode("compile");
  }, [executeCode]);

  const handleDebug = useCallback(() => {
    void executeCode("debug");
  }, [executeCode]);

  const handleLoadExample = useCallback(
    (example: SimBaExample) => {
      // Check if example is already open
      const existingExample = openFiles.find(
        (file) => file.isExample && (file.name === exampleFileName(example) || file.id.startsWith(`example-${example.id}`)),
      );

      if (existingExample) {
        // Just switch to the existing tab
        setActiveFileId(existingExample.id);
        addOutput("info", `Switched to example: ${example.title}`);
        return;
      }

      const newFile: OpenFile = {
        id: `example-${example.id}`,
        name: exampleFileName(example),
        content: example.code,
        path: `examples/${exampleFileName(example)}`,
        isDirty: false,
        isReadOnly: true,
        isExample: true,
      };

      setOpenFiles((prev) => [...prev, newFile]);
      setActiveFileId(newFile.id);
      clearOutput();
      addOutput("info", `Loaded example: ${example.title}`);
      addOutput("info", example.description);
    },
    [openFiles, clearOutput, addOutput],
  );

  const openSavedFile = useCallback(
    (project: Project) => {
      setOpenFiles((prev) => {
        if (prev.some((file) => file.id === project.id)) {
          return prev;
        }
        return [
          ...prev,
          {
            id: project.id,
            name: project.name,
            content: project.content,
            path: project.name,
            isDirty: false,
          },
        ];
      });
      setActiveFileId(project.id);
      setCurrentProject(project);
    },
    [],
  );

  const handleLoadProject = useCallback(
    (project: Project) => {
      openSavedFile(project);
      addOutput("info", `Opened ${project.name}`);
    },
    [openSavedFile, addOutput],
  );

  const handleSaveProject = useCallback(
    async (name: string) => {
      const activeFile = getActiveFile();
      if (!activeFile || activeFile.isReadOnly || activeFile.isExample) return;

      try {
        if (projects.some((file) => file.id === activeFile.id)) {
          await persistFile(activeFile.id, { name, content: activeFile.content });
        } else {
          const response = await fetch("/api/files", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, content: activeFile.content }),
          });
          const data = (await response.json()) as { file?: unknown };
          const saved = parseProject(data.file);
          if (!saved) throw new Error("Invalid file response");
          setProjects((prev) => [saved, ...prev.filter((file) => file.id !== saved.id)]);
          setOpenFiles((prev) =>
            prev.map((file) =>
              file.id === activeFile.id
                ? { id: saved.id, name: saved.name, content: saved.content, path: saved.name, isDirty: false }
                : file,
            ),
          );
          setActiveFileId(saved.id);
          setCurrentProject(saved);
        }
        addOutput("success", `Saved ${name}`);
      } catch {
        addOutput("error", "Failed to save file. Please try again.");
      }
    },
    [openFiles, activeFileId, persistFile, projects, addOutput],
  );

  const handleDeleteFile = useCallback(
    async (fileId: string) => {
      try {
        const response = await fetch(`/api/files/${fileId}`, { method: "DELETE" });
        if (!response.ok) {
          throw new Error("Failed to delete file");
        }

        setProjects((prev) => prev.filter((file) => file.id !== fileId));
        setOpenFiles((prev) => {
          const next = prev.filter((file) => file.id !== fileId);
          if (activeFileId === fileId) {
            setActiveFileId(next[0]?.id ?? null);
          }
          return next;
        });
        setCurrentProject((prev) => (prev?.id === fileId ? null : prev));
        addOutput("info", "File deleted.");
      } catch {
        addOutput("error", "Failed to delete file. Please try again.");
      }
    },
    [activeFileId, addOutput],
  );

  const handleCreateFile = useCallback(
    async (name = "untitled.smba", content?: string) => {
      try {
        const response = await fetch("/api/files", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, content }),
        });
        const data = (await response.json()) as { file?: unknown; error?: string };
        const saved = parseProject(data.file);
        if (!response.ok || !saved) {
          throw new Error(data.error || "Failed to create file");
        }

        setProjects((prev) => [saved, ...prev]);
        openSavedFile(saved);
        addOutput("info", `Created ${saved.name}`);
      } catch {
        addOutput("error", "Failed to create file.");
      }
    },
    [openSavedFile, addOutput],
  );

  const handleRenameFile = useCallback(
    async (fileId: string, newName: string) => {
      try {
        await persistFile(fileId, { name: newName });
        addOutput("info", `Renamed to ${newName}`);
      } catch {
        addOutput("error", "Failed to rename file.");
      }
    },
    [persistFile, addOutput],
  );

  const handleNewProject = useCallback(() => {
    void handleCreateFile("untitled.smba");
  }, [handleCreateFile]);

  const handleImportFile = useCallback(
    (content: string, fileName?: string) => {
      void handleCreateFile(fileName || "imported.smba", content);
    },
    [handleCreateFile],
  );

  const handleExportFile = useCallback(() => {
    const activeFile = getActiveFile();
    if (!activeFile) return;

    const blob = new Blob([activeFile.content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = activeFile.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    addOutput("info", `Exported ${activeFile.name} successfully!`);
  }, [openFiles, activeFileId, addOutput]);

  const handleFileSelect = (file: FileNode) => {
    if (file.type !== "file") return;

    const saved = projects.find((item) => item.id === file.id);
    if (saved) {
      openSavedFile(saved);
      return;
    }

    setActiveFileId(file.id);
  };

  const handleCloseFile = (fileId: string) => {
    setOpenFiles((prev) => prev.filter((file) => file.id !== fileId));
    if (activeFileId === fileId) {
      const remainingFiles = openFiles.filter((file) => file.id !== fileId);
      setActiveFileId(remainingFiles.length > 0 ? remainingFiles[0].id : null);
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Show loading state while authentication is being restored
  if (isLoading) {
    return (
      <div className={styles.container}>
        <Navigation />
        <main className={styles.main}>
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "50vh" }}>
            <div>Loading...</div>
          </div>
        </main>
      </div>
    );
  }

  // Don't render if not authenticated (will redirect)
  if (!isAuthenticated) {
    return null;
  }

  const activeFile = getActiveFile();

  return (
    <div className={styles.container}>
      <Navigation />

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          <button
            className={classNames(styles.toolbarButton, showSidebar && styles.toolbarButtonActive)}
            onClick={() => setShowSidebar(!showSidebar)}
            title="Toggle Sidebar"
          >
            {showSidebar ? <PanelLeftClose size={16} /> : <PanelLeftOpen size={16} />}
          </button>
          <button
            className={classNames(styles.toolbarButton, showConsole && styles.toolbarButtonActive)}
            onClick={() => setShowConsole(!showConsole)}
            title="Toggle Console"
          >
            {showConsole ? <PanelBottomClose size={16} /> : <PanelBottomOpen size={16} />}
          </button>
          <button
            className={classNames(styles.toolbarButton, showActions && styles.toolbarButtonActive)}
            onClick={() => setShowActions(!showActions)}
            title="Toggle Examples Panel"
          >
            {showActions ? <PanelRightClose size={16} /> : <PanelRightOpen size={16} />}
          </button>
        </div>

        <div className={styles.breadcrumb}>
          {activeFile && (
            <>
              <span className={styles.breadcrumbItem}>SimBa Playground</span>
              <span className={styles.breadcrumbSeparator}>/</span>
              <span className={styles.breadcrumbItem}>{activeFile.name}</span>
              {activeFile.isExample && <span className={styles.exampleBadge}>Example</span>}
            </>
          )}
        </div>

        <div className={styles.toolbarRight}>
          {activeFile && (
            <>
              <button className={styles.toolbarButton} onClick={handleExportFile} title="Export File">
                <Download size={16} />
              </button>
              <input
                type="file"
                accept=".smba,.py,.rs"
                style={{ display: "none" }}
                id="file-import"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                      const content = event.target?.result as string;
                      handleImportFile(content, file.name);
                    };
                    reader.readAsText(file);
                  }
                  e.target.value = "";
                }}
              />
              <button
                className={styles.toolbarButton}
                onClick={() => document.getElementById("file-import")?.click()}
                title="Import File"
              >
                <Upload size={16} />
              </button>
            </>
          )}
          <button
            className={classNames(styles.toolbarButton, isFullscreen && styles.toolbarButtonActive)}
            onClick={toggleFullscreen}
            title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
        </div>
      </div>

      <main className={styles.main}>
        <PanelGroup direction="horizontal" className={styles.playgroundGrid}>
          {/* Sidebar */}
          {showSidebar && (
            <>
              <Panel defaultSize={20} minSize={15} maxSize={35}>
                <Sidebar
                  files={fileTree}
                  activeFileId={activeFileId || undefined}
                  projects={projects}
                  currentProject={currentProject}
                  isLoadingProjects={isLoadingProjects}
                  onFileSelect={handleFileSelect}
                  onFileCreate={() => void handleCreateFile()}
                  onFileRename={(fileId, newName) => void handleRenameFile(fileId, newName)}
                  onFileDelete={(fileId) => void handleDeleteFile(fileId)}
                  onLoadProject={handleLoadProject}
                  onSaveProject={handleSaveProject}
                  onDeleteProject={handleDeleteFile}
                  onNewProject={handleNewProject}
                  onImportFile={handleImportFile}
                />
              </Panel>
              <PanelResizeHandle className={styles.resizer} />
            </>
          )}

          {/* Main Editor Section */}
          <Panel minSize={30} className={styles.editorSection}>
            <div className={styles.editorColumn}>
              {openFiles.length > 0 && (
                <div className={styles.tabBar} role="tablist" aria-label="Open files">
                  <div className={styles.tabBarInner}>
                  {openFiles.map((file) => (
                    <div
                      key={file.id}
                      className={classNames(
                        styles.tab,
                        file.id === activeFileId && styles.tabActive,
                        file.isExample && styles.tabExample,
                      )}
                    >
                      <button
                        type="button"
                        role="tab"
                        aria-selected={file.id === activeFileId}
                        className={styles.tabButton}
                        title={file.name}
                        onClick={() => setActiveFileId(file.id)}
                      >
                        <span className={styles.tabName}>{file.name}</span>
                        {file.isDirty && <span className={styles.tabDirty}>●</span>}
                        {file.isExample && <span className={styles.tabExampleBadge}>Ex</span>}
                      </button>
                      <button
                        type="button"
                        className={styles.tabCloseButton}
                        aria-label={`Close ${file.name}`}
                        title={`Close ${file.name}`}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleCloseFile(file.id);
                        }}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                  <div className={styles.tabBarEnd} aria-hidden="true" />
                  </div>
                </div>
              )}

              <PanelGroup direction="vertical" className={styles.editorPanels}>
              {/* Editor Container */}
              <Panel defaultSize={showConsole ? 70 : 100} minSize={30}>
                <div className={styles.editorContainer}>
                  {activeFile ? (
                    <CodeEditor
                      value={activeFile.content}
                      onChange={(content) => updateFileContent(activeFile.id, content)}
                      title={activeFile.name}
                      language="SimBa"
                      filePath={activeFile.path}
                      isFullscreen={isFullscreen}
                      onToggleFullscreen={toggleFullscreen}
                      isReadOnly={activeFile.isReadOnly}
                      isRunning={status === "running"}
                      onRun={handleRun}
                      onCompile={handleCompile}
                      onDebug={handleDebug}
                      isCompiled={compiledSource === activeFile.content}
                    />
                  ) : (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        height: "100%",
                        color: "var(--color-base-text-muted)",
                      }}
                    >
                      No file open. Create a new file or open an existing one.
                    </div>
                  )}
                </div>
              </Panel>

              {/* Console Container */}
              {showConsole && (
                <>
                  <PanelResizeHandle className={classNames(styles.resizer, styles.resizerVertical)} />
                  <Panel defaultSize={30} minSize={15} maxSize={60}>
                    <div className={styles.consoleContainer}>
                      <TerminalConsole
                        status={status}
                        output={output}
                        mode={consoleMode}
                        onClear={clearOutput}
                        onModeChange={setConsoleMode}
                        onExecuteCommand={handleTerminalCommand}
                        exampleFiles={SIMBA_EXAMPLES.map(exampleFileName)}
                        title="Console"
                      />
                    </div>
                  </Panel>
                </>
              )}
              </PanelGroup>
            </div>
          </Panel>

          {/* Examples Panel */}
          {showActions && (
            <>
              <PanelResizeHandle className={styles.resizer} />
              <Panel defaultSize={25} minSize={20} maxSize={40} className={styles.actionContainer}>
                <ActionPanel onLoadExample={handleLoadExample} examples={SIMBA_EXAMPLES} />
              </Panel>
            </>
          )}
        </PanelGroup>
      </main>

      {/* Status Bar */}
      <div className={styles.statusBar}>
        <div className={styles.statusLeft}>
          <div className={styles.statusItem}>SimBa Playground</div>
          {activeFile && (
            <div className={styles.statusItem}>
              {activeFile.name} {activeFile.isDirty ? "(modified)" : "(saved)"}
              {activeFile.isReadOnly && " (read-only)"}
            </div>
          )}
        </div>
        <div className={styles.statusRight}>
          <div className={styles.statusItem}>
            {openFiles.length} file{openFiles.length !== 1 ? "s" : ""} open
          </div>
          <div className={styles.statusItem}>Ready</div>
        </div>
      </div>
    </div>
  );
}
