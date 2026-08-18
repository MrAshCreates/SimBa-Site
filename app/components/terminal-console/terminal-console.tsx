import { useState, useRef, useEffect, useCallback, type KeyboardEvent } from "react";
import classNames from "classnames";
import { Circle, CheckCircle, XCircle, Loader2, Trash2 } from "lucide-react";
import type { OutputStatus, OutputLine } from "../output-console/output-console";
import { useUserSettings } from "~/hooks/use-user-settings";
import styles from "./terminal-console.module.css";

export type TerminalMode = "output" | "terminal";

interface TerminalLine {
  id: string;
  type: "command" | "output" | "error" | "success" | "info";
  content: string;
  timestamp: Date;
}

interface TerminalConsoleProps {
  status: OutputStatus;
  output: OutputLine[];
  mode: TerminalMode;
  onClear: () => void;
  onModeChange: (mode: TerminalMode) => void;
  onExecuteCommand: (command: string) => Promise<void>;
  title?: string;
  className?: string;
  exampleFiles?: string[];
}

const STATUS_CONFIG = {
  ready: {
    icon: Circle,
    label: "Ready",
    className: styles.statusReady,
  },
  running: {
    icon: Loader2,
    label: "Running",
    className: styles.statusRunning,
  },
  success: {
    icon: CheckCircle,
    label: "Success",
    className: styles.statusSuccess,
  },
  error: {
    icon: XCircle,
    label: "Error",
    className: styles.statusError,
  },
};

export function TerminalConsole({
  status,
  output,
  mode,
  onClear,
  onModeChange,
  onExecuteCommand,
  title = "Console",
  className,
  exampleFiles = [],
}: TerminalConsoleProps) {
  const { settings } = useUserSettings();
  const [terminalHistory, setTerminalHistory] = useState<TerminalLine[]>([]);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [currentCommand, setCurrentCommand] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const terminalOutputRef = useRef<HTMLDivElement>(null);
  const outputAreaRef = useRef<HTMLDivElement>(null);

  const statusConfig = STATUS_CONFIG[status];
  const StatusIcon = statusConfig.icon;

  // Initialize terminal with welcome message
  useEffect(() => {
    if (mode === "terminal" && terminalHistory.length === 0) {
      setTerminalHistory([
        {
          id: "welcome",
          type: "info",
          content: "Welcome to SimBa Interactive Terminal! Type 'help' for available commands.",
          timestamp: new Date(),
        },
      ]);
    }
  }, [mode, terminalHistory.length]);

  // Auto-scroll to bottom when new content is added
  useEffect(() => {
    if (mode === "terminal" && terminalOutputRef.current) {
      terminalOutputRef.current.scrollTop = terminalOutputRef.current.scrollHeight;
    } else if (mode === "output" && outputAreaRef.current) {
      outputAreaRef.current.scrollTop = outputAreaRef.current.scrollHeight;
    }
  }, [terminalHistory, output, mode]);

  // Focus input when switching to terminal mode
  useEffect(() => {
    if (mode === "terminal" && inputRef.current) {
      inputRef.current.focus();
    }
  }, [mode]);

  const addTerminalLine = useCallback((type: TerminalLine["type"], content: string) => {
    const newLine: TerminalLine = {
      id: Date.now().toString() + Math.random(),
      type,
      content,
      timestamp: new Date(),
    };
    setTerminalHistory((prev) => [...prev, newLine]);
  }, []);

  const handleCommand = async (command: string) => {
    if (!command.trim()) return;

    // Add command to history
    setCommandHistory((prev) => [...prev, command]);
    setHistoryIndex(-1);

    // Display the command in terminal
    addTerminalLine("command", `simba> ${command}`);

    const args = command.trim().split(/\s+/);
    const cmd = args[0].toLowerCase();

    try {
      switch (cmd) {
        case "help":
          addTerminalLine("info", "Available commands:");
          addTerminalLine("info", "  help                 Show this help");
          addTerminalLine("info", "  ls | examples        List example programs");
          addTerminalLine("info", "  run [file]           Compile and run a file, or the open editor");
          addTerminalLine("info", "  compile [file]       Compile without running");
          addTerminalLine("info", "  debug [file]         Run with debug tracing");
          addTerminalLine("info", "  exec <code>          Compile and run inline SimBa");
          addTerminalLine("info", "  clear                Clear this console");
          break;

        case "clear":
          setTerminalHistory([]);
          onClear();
          break;

        case "ls":
        case "examples":
          addTerminalLine("info", "Example programs (also in the Examples sidebar):");
          if (exampleFiles.length === 0) {
            addTerminalLine("error", "No examples loaded.");
          } else {
            exampleFiles.forEach((file) => addTerminalLine("info", `  ${file}`));
            addTerminalLine("info", "Use: run hello-world.smba");
          }
          break;

        case "run":
        case "compile":
        case "debug":
        case "exec":
          await onExecuteCommand(command);
          break;

        default:
          addTerminalLine("error", `Unknown command: ${cmd}. Type 'help' for available commands.`);
          break;
      }
    } catch (error) {
      addTerminalLine("error", `Command failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleCommand(currentCommand);
      setCurrentCommand("");
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const newIndex = historyIndex === -1 ? commandHistory.length - 1 : Math.max(0, historyIndex - 1);
        setHistoryIndex(newIndex);
        setCurrentCommand(commandHistory[newIndex]);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIndex !== -1) {
        const newIndex = historyIndex + 1;
        if (newIndex >= commandHistory.length) {
          setHistoryIndex(-1);
          setCurrentCommand("");
        } else {
          setHistoryIndex(newIndex);
          setCurrentCommand(commandHistory[newIndex]);
        }
      }
    }
  };

  const getOutputClassName = (type: OutputLine["type"]) => {
    switch (type) {
      case "success":
        return styles.outputSuccess;
      case "error":
        return styles.outputError;
      case "info":
        return styles.outputInfo;
      case "program":
        return styles.outputProgram;
      default:
        return styles.outputSuccess;
    }
  };

  const getTerminalLineClassName = (type: TerminalLine["type"]) => {
    switch (type) {
      case "command":
        return styles.terminalLineCommand;
      case "output":
        return styles.terminalLineOutput;
      case "error":
        return styles.terminalLineError;
      case "success":
        return styles.terminalLineSuccess;
      case "info":
        return styles.terminalLineInfo;
      default:
        return styles.terminalLineOutput;
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    if (!settings.terminal?.showTimestamps) return "";
    return `[${timestamp.toLocaleTimeString()}] `;
  };

  const renderOutputMode = () => {
    if (output.length === 0) {
      return (
        <pre
          className={classNames(styles.output, styles.outputEmpty)}
          style={{ fontSize: `${settings.terminal?.fontSize || 13}px` }}
        >
          Console output will appear here...
        </pre>
      );
    }

    return output.map((line) => (
      <pre
        key={line.id}
        className={classNames(styles.output, getOutputClassName(line.type))}
        style={{ fontSize: `${settings.terminal?.fontSize || 13}px` }}
      >
        {formatTimestamp(line.timestamp)}
        {line.content}
      </pre>
    ));
  };

  const renderTerminalMode = () => {
    return (
      <div className={styles.terminalArea}>
        <div
          ref={terminalOutputRef}
          className={styles.terminalOutput}
          style={{ fontSize: `${settings.terminal?.fontSize || 13}px` }}
        >
          {terminalHistory.map((line) => (
            <pre key={line.id} className={classNames(styles.terminalLine, getTerminalLineClassName(line.type))}>
              {formatTimestamp(line.timestamp)}
              {line.content}
            </pre>
          ))}
          {output.map((line) => (
            <pre key={`out-${line.id}`} className={classNames(styles.terminalLine, getOutputClassName(line.type))}>
              {formatTimestamp(line.timestamp)}
              {line.content}
            </pre>
          ))}
        </div>
        <div className={styles.terminalInputArea}>
          <span className={styles.terminalPrompt} style={{ fontSize: `${settings.terminal?.fontSize || 13}px` }}>
            simba&gt;
          </span>
          <input
            ref={inputRef}
            type="text"
            value={currentCommand}
            onChange={(e) => setCurrentCommand(e.target.value)}
            onKeyDown={handleKeyDown}
            className={styles.terminalInput}
            style={{ fontSize: `${settings.terminal?.fontSize || 13}px` }}
            placeholder="Type a command..."
            disabled={status === "running"}
          />
        </div>
      </div>
    );
  };

  return (
    <div className={classNames(styles.container, className)}>
      <div className={styles.header}>
        <h3 className={styles.title}>{title}</h3>
        <div className={styles.controls}>
          <div className={styles.modeToggle}>
            <button
              className={classNames(styles.modeButton, mode === "output" && styles.active)}
              onClick={() => onModeChange("output")}
            >
              Output
            </button>
            <button
              className={classNames(styles.modeButton, mode === "terminal" && styles.active)}
              onClick={() => onModeChange("terminal")}
            >
              Terminal
            </button>
          </div>
          <div className={styles.status}>
            <StatusIcon
              className={classNames(styles.statusIcon, statusConfig.className, status === "running" && "animate-spin")}
            />
            <span className={statusConfig.className}>{statusConfig.label}</span>
            <button
              className={styles.clearButton}
              onClick={() => {
                setTerminalHistory([]);
                onClear();
              }}
              title="Clear console"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </div>
      {mode === "output" ? (
        <div ref={outputAreaRef} className={styles.outputArea}>
          {renderOutputMode()}
        </div>
      ) : (
        renderTerminalMode()
      )}
    </div>
  );
}
