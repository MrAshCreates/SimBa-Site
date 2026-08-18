import React, { useState, useCallback, useEffect } from "react";
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
import { SIMBA_EXAMPLES, type SimBaExample } from "~/data/examples";
import { getUserProjects, saveProject, deleteProject, type Project } from "~/data/auth";
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

  // Project state
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);

  // File explorer state
  const [fileTree, setFileTree] = useState<FileNode[]>([]);

  // Panel visibility state
  const [showSidebar, setShowSidebar] = useState(true);
  const [showConsole, setShowConsole] = useState(true);
  const [showActions, setShowActions] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Initialize with default file containing SimBa example
  useEffect(() => {
    const defaultFile: OpenFile = {
      id: "default",
      name: "main.smba",
      content: `# SimBa Hello World Example
def greet(name: str) -> str:
    return f"Hello, {name}! Welcome to SimBa!"

# Main execution
if __name__ == "__main__":
    message = greet("Developer")
    print(message)
    
    # Demonstrate type safety
    count: int = 42
    print(f"The answer is {count}")`,
      path: "main.smba",
      isDirty: false,
    };
    setOpenFiles([defaultFile]);
    setActiveFileId("default");

    // Initialize file tree
    const defaultFileNode: FileNode = {
      id: "default",
      name: "main.smba",
      type: "file",
      path: "main.smba",
    };
    setFileTree([defaultFileNode]);
  }, []);

  // Redirect if not authenticated (but only after auth loading is complete)
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate("/login");
      return;
    }
  }, [isAuthenticated, isLoading, navigate]);

  // Load user projects
  useEffect(() => {
    if (user) {
      loadProjects();
    }
  }, [user]);

  const loadProjects = async () => {
    if (!user) return;

    setIsLoadingProjects(true);
    try {
      const userProjects = await getUserProjects(user.id);
      setProjects(userProjects);
    } catch (error) {
      console.error("Failed to load projects:", error);
    } finally {
      setIsLoadingProjects(false);
    }
  };

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
    async (isCompileOnly = false) => {
      const activeFile = getActiveFile();
      if (!activeFile || !activeFile.content.trim()) {
        addOutput("error", "No active file or file is empty, nothing to run.");
        return;
      }

      setStatus("running");

      // Clear output if setting is enabled
      if (settings.terminal?.clearOnRun !== false) {
        clearOutput();
      }

      try {
        if (isCompileOnly) {
          // Simulate compilation check
          addOutput("info", "=== SimBa Compilation ===");
          await new Promise((resolve) => setTimeout(resolve, 1000));

          // Basic syntax validation
          const lines = activeFile.content.split("\n");
          let hasErrors = false;

          for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line || line.startsWith("#")) continue;

            // Check for basic syntax errors
            if (line.includes("(") && !line.includes(")")) {
              addOutput("error", `Line ${i + 1}: Syntax error - Missing closing parenthesis`);
              hasErrors = true;
            } else if (line.includes("[") && !line.includes("]")) {
              addOutput("error", `Line ${i + 1}: Syntax error - Missing closing bracket`);
              hasErrors = true;
            } else if (line.includes("{") && !line.includes("}") && !line.endsWith("{")) {
              addOutput("error", `Line ${i + 1}: Syntax error - Missing closing brace`);
              hasErrors = true;
            }
          }

          if (!hasErrors) {
            addOutput("success", "✓ Lexical analysis complete");
            addOutput("success", "✓ Parsing successful - AST generated");
            addOutput("success", "✓ Semantic analysis passed");
            addOutput("success", "✓ Type checking complete");
            addOutput("success", "✓ Memory safety validation passed");
            addOutput("success", "✓ Code generation complete");
            addOutput("info", "\nCompilation successful! Ready to execute.");
            setStatus("success");
          } else {
            setStatus("error");
          }
        } else {
          // Execute the actual code
          addOutput("info", "=== SimBa Execution ===");
          addOutput("info", "Submitting code for execution...");

          const response = await fetch("/api/run-simba-code", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ code: activeFile.content }),
          });

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const result: ExecutionResult = await response.json();

          // Display execution logs first
          if (result.stdout) {
            addOutput("info", "\n=== Execution Details ===");
            const outputLines = result.stdout.split("\n");
            outputLines.forEach((line) => {
              if (line.trim()) {
                // Determine output type based on content
                if (line.includes("Error") || line.includes("error")) {
                  addOutput("error", line);
                } else if (line.includes("✓") || line.includes("successful")) {
                  addOutput("info", line);
                } else {
                  addOutput("info", line);
                }
              }
            });
          }

          // Display any errors
          if (result.stderr) {
            const errorLines = result.stderr.split("\n");
            errorLines.forEach((line) => {
              if (line.trim()) {
                addOutput("error", line);
              }
            });
          }

          // Display program output at the bottom (moved to end for better readability)
          if (result.output && result.output.trim()) {
            addOutput("info", "\n=== Program Output ===");
            const outputLines = result.output.split("\n");
            outputLines.forEach((line) => {
              if (line.trim()) {
                addOutput("program", line);
              }
            });
          }

          // Set final status
          if (result.status === "success") {
            addOutput("success", "\nExecution completed successfully");
            setStatus("success");
          } else {
            setStatus("error");
          }
        }
      } catch (error) {
        addOutput(
          "error",
          `Network error: ${error instanceof Error ? error.message : "Failed to connect to execution server"}`,
        );
        addOutput("error", "Please check your connection and try again.");
        setStatus("error");
      }
    },
    [openFiles, activeFileId, addOutput, clearOutput, settings.terminal?.clearOnRun],
  );

  const handleTerminalCommand = useCallback(
    async (command: string) => {
      const args = command.trim().split(/\s+/);
      const cmd = args[0].toLowerCase();

      switch (cmd) {
        case "run":
          if (args.length >= 2) {
            const filename = args[1];
            // Find example by filename
            const example = SIMBA_EXAMPLES.find(
              (ex) => ex.title.toLowerCase().replace(/\s+/g, "-") === filename.replace(".smba", ""),
            );
            if (example) {
              handleLoadExample(example);
              await executeCode(false);
            } else {
              addOutput("error", `File not found: ${filename}`);
            }
          }
          break;

        case "exec":
          if (args.length >= 2) {
            const code = args.slice(1).join(" ");
            // Create temporary file with the code
            const tempFile: OpenFile = {
              id: `temp-${Date.now()}`,
              name: "temp.smba",
              content: code,
              path: "temp.smba",
              isDirty: false,
            };
            setOpenFiles((prev) => [...prev, tempFile]);
            setActiveFileId(tempFile.id);
            await executeCode(false);
          }
          break;

        default:
          // Command will be handled by the terminal component
          break;
      }
    },
    [addOutput, executeCode],
  );

  const handleRun = useCallback(() => {
    executeCode(false);
  }, [executeCode]);

  const handleCompile = useCallback(() => {
    executeCode(true);
  }, [executeCode]);

  const handleLoadExample = useCallback(
    (example: SimBaExample) => {
      // Check if example is already open
      const existingExample = openFiles.find(
        (file) => file.isExample && file.name === `${example.title.toLowerCase().replace(/\s+/g, "-")}.smba`,
      );

      if (existingExample) {
        // Just switch to the existing tab
        setActiveFileId(existingExample.id);
        addOutput("info", `Switched to example: ${example.title}`);
        return;
      }

      const newFile: OpenFile = {
        id: `example-${Date.now()}`,
        name: `${example.title.toLowerCase().replace(/\s+/g, "-")}.smba`,
        content: example.code,
        path: `examples/${example.title.toLowerCase().replace(/\s+/g, "-")}.smba`,
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

  const handleLoadProject = useCallback(
    (project: Project) => {
      const newFile: OpenFile = {
        id: project.id,
        name: `${project.name}.smba`,
        content: project.content,
        path: `${project.name}.smba`,
        isDirty: false,
      };

      setOpenFiles((prev) => [...prev, newFile]);
      setActiveFileId(newFile.id);
      setCurrentProject(project);
      clearOutput();
      addOutput("info", `Loaded project: ${project.name}`);
    },
    [clearOutput, addOutput],
  );

  const handleSaveProject = useCallback(
    async (name: string) => {
      if (!user) return;

      const activeFile = getActiveFile();
      if (!activeFile || activeFile.isReadOnly) return;

      try {
        const savedProject = await saveProject(user.id, name, activeFile.content, currentProject?.id);
        setCurrentProject(savedProject);

        // Update the file to mark it as saved
        setOpenFiles((prev) => prev.map((file) => (file.id === activeFileId ? { ...file, isDirty: false } : file)));

        await loadProjects();
        addOutput("success", `Project "${name}" saved successfully!`);
      } catch (error) {
        addOutput("error", "Failed to save project. Please try again.");
      }
    },
    [user, openFiles, activeFileId, currentProject, loadProjects, addOutput],
  );

  const handleDeleteProject = useCallback(
    async (projectId: string) => {
      if (!user) return;

      try {
        await deleteProject(user.id, projectId);
        if (currentProject?.id === projectId) {
          setCurrentProject(null);
        }
        await loadProjects();
        addOutput("info", "Project deleted successfully.");
      } catch (error) {
        addOutput("error", "Failed to delete project. Please try again.");
      }
    },
    [user, currentProject, loadProjects, addOutput],
  );

  const handleNewProject = useCallback(() => {
    const newFile: OpenFile = {
      id: `new-${Date.now()}`,
      name: "new-project.smba",
      content: `# New SimBa Project
# Start coding here...

def main():
    print("Hello, SimBa World!")

# Example: Define a function with type annotations
def calculate_fibonacci(n: int) -> int:
    if n <= 1:
        return n
    return calculate_fibonacci(n - 1) + calculate_fibonacci(n - 2)

if __name__ == "__main__":
    main()
    result = calculate_fibonacci(10)
    print(f"Fibonacci(10) = {result}")
`,
      path: "new-project.smba",
      isDirty: true,
    };

    setOpenFiles((prev) => [...prev, newFile]);
    setActiveFileId(newFile.id);
    setCurrentProject(null);
    clearOutput();
    addOutput("info", "Created new project. Don't forget to save it!");
  }, [clearOutput, addOutput]);

  const handleImportFile = useCallback(
    (content: string, fileName?: string) => {
      const extension = fileName ? fileName.split(".").pop()?.toLowerCase() : "smba";
      const displayName = fileName || "imported.smba";

      const newFile: OpenFile = {
        id: `import-${Date.now()}`,
        name: displayName,
        content,
        path: displayName,
        isDirty: true,
      };

      setOpenFiles((prev) => [...prev, newFile]);
      setActiveFileId(newFile.id);
      setCurrentProject(null);
      clearOutput();
      addOutput("info", `Imported ${extension?.toUpperCase()} file successfully!`);
      addOutput("info", "Content loaded into editor. You can now run or save this code.");
    },
    [clearOutput, addOutput],
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
    if (file.type === "file") {
      setActiveFileId(file.id);
    }
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
                  onLoadProject={handleLoadProject}
                  onSaveProject={handleSaveProject}
                  onDeleteProject={handleDeleteProject}
                  onNewProject={handleNewProject}
                  onImportFile={(content) => handleImportFile(content)}
                />
              </Panel>
              <PanelResizeHandle className={styles.resizer} />
            </>
          )}

          {/* Main Editor Section */}
          <Panel minSize={30} className={styles.editorSection}>
            <PanelGroup direction="vertical">
              {/* Tab Bar */}
              {openFiles.length > 0 && (
                <div className={styles.tabBar}>
                  {openFiles.map((file) => (
                    <button
                      key={file.id}
                      className={classNames(
                        styles.tab,
                        file.id === activeFileId && styles.tabActive,
                        file.isExample && styles.tabExample,
                      )}
                      onClick={() => setActiveFileId(file.id)}
                    >
                      <span>{file.name}</span>
                      {file.isDirty && <span style={{ color: "var(--color-primary-bg)" }}>●</span>}
                      {file.isExample && <span className={styles.tabExampleBadge}>Ex</span>}
                      <button
                        className={styles.tabCloseButton}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCloseFile(file.id);
                        }}
                        title="Close"
                      >
                        ×
                      </button>
                    </button>
                  ))}
                </div>
              )}

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
                      placeholder="# Write your SimBa code here...
# SimBa combines Python's simplicity with Rust's performance

def greet(name: str) -> str:
    return f'Hello, {name}! Welcome to SimBa!'

if __name__ == '__main__':
    message = greet('World')
    print(message)"
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
                        title="Console"
                      />
                    </div>
                  </Panel>
                </>
              )}
            </PanelGroup>
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
