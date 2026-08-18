import { useState, useRef, useEffect, useCallback, type KeyboardEvent } from "react";
import classNames from "classnames";
import { Circle, CheckCircle, XCircle, Loader2, Trash2 } from "lucide-react";
import type { OutputStatus, OutputLine } from "../output-console/output-console";
import { useUserSettings } from "~/hooks/use-user-settings";
import { completeTerminalInput, type TerminalMode } from "~/lib/playground-commands";
import styles from "./terminal-console.module.css";

export type { TerminalMode };

interface TerminalConsoleProps {
  status: OutputStatus;
  output: OutputLine[];
  mode: TerminalMode;
  onClear: () => void;
  onModeChange: (mode: TerminalMode) => void;
  onExecuteCommand: (command: string, meta: { history: string[] }) => Promise<void>;
  title?: string;
  className?: string;
  completions?: string[];
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
  completions = [],
}: TerminalConsoleProps) {
  const { settings } = useUserSettings();
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [currentCommand, setCurrentCommand] = useState("");
  const [hint, setHint] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const stickToBottomRef = useRef(true);

  const statusConfig = STATUS_CONFIG[status];
  const StatusIcon = statusConfig.icon;
  const fontSize = settings.terminal?.fontSize || 13;
  const visibleOutput = mode === "output" ? output.filter((line) => line.source === "run") : output;

  const scrollToBottom = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const observer = new ResizeObserver(() => {
      if (stickToBottomRef.current) {
        el.scrollTop = el.scrollHeight;
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (visibleOutput.length === 0) {
      el.scrollTop = 0;
      stickToBottomRef.current = true;
      return;
    }
    if (stickToBottomRef.current) {
      scrollToBottom();
    }
  }, [visibleOutput, mode, scrollToBottom]);

  useEffect(() => {
    if (mode === "terminal") {
      inputRef.current?.focus();
    }
  }, [mode]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    stickToBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 48;
  };

  const handleCommand = async (command: string) => {
    if (!command.trim()) return;

    const nextHistory = [...commandHistory, command];
    setCommandHistory(nextHistory);
    setHistoryIndex(-1);
    setHint(null);
    stickToBottomRef.current = true;

    try {
      await onExecuteCommand(command, { history: nextHistory });
    } catch (error) {
      console.error("Terminal command failed:", error);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      void handleCommand(currentCommand);
      setCurrentCommand("");
      return;
    }

    if (e.key === "Tab") {
      e.preventDefault();
      const result = completeTerminalInput(currentCommand, completions);
      if (!result) return;
      setCurrentCommand(result.next);
      setHint(result.matches.length > 1 ? result.matches.slice(0, 8).join("  ") : null);
      return;
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (commandHistory.length === 0) return;
      const newIndex = historyIndex === -1 ? commandHistory.length - 1 : Math.max(0, historyIndex - 1);
      setHistoryIndex(newIndex);
      setCurrentCommand(commandHistory[newIndex]);
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIndex === -1) return;
      const newIndex = historyIndex + 1;
      if (newIndex >= commandHistory.length) {
        setHistoryIndex(-1);
        setCurrentCommand("");
      } else {
        setHistoryIndex(newIndex);
        setCurrentCommand(commandHistory[newIndex]);
      }
    }
  };

  const getLineClassName = (type: OutputLine["type"]) => {
    switch (type) {
      case "command":
        return styles.lineCommand;
      case "success":
        return styles.lineSuccess;
      case "error":
        return styles.lineError;
      case "info":
        return styles.lineInfo;
      case "program":
        return styles.lineProgram;
      default:
        return styles.lineOutput;
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    if (!settings.terminal?.showTimestamps) return "";
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    return `[${date.toLocaleTimeString()}] `;
  };

  const emptyMessage =
    mode === "output"
      ? "Output (limited mode): run, compile, and debug results appear here."
      : "Terminal (full mode): type a command. Try help or guide.";

  return (
    <div
      className={classNames(styles.container, className)}
      data-mode={mode}
      data-density={settings.appearance?.density}
    >
      <div className={styles.header}>
        <h3 className={styles.title}>{title}</h3>
        <div className={styles.controls}>
          <div className={styles.modeToggle} role="tablist" aria-label="Console mode">
            <button
              type="button"
              className={classNames(styles.modeButton, mode === "output" && styles.active)}
              onClick={() => onModeChange("output")}
              title="Show program output only"
            >
              Output
              <span className={styles.modeHint}>limited</span>
            </button>
            <button
              type="button"
              className={classNames(styles.modeButton, mode === "terminal" && styles.active)}
              onClick={() => onModeChange("terminal")}
              title="Full terminal: commands and output together"
            >
              Terminal
              <span className={styles.modeHint}>full</span>
            </button>
          </div>
          <div className={styles.status}>
            <StatusIcon
              className={classNames(styles.statusIcon, statusConfig.className, status === "running" && "animate-spin")}
            />
            <span className={statusConfig.className}>{statusConfig.label}</span>
            <button
              type="button"
              className={styles.clearButton}
              onClick={() => {
                stickToBottomRef.current = true;
                onClear();
              }}
              title="Clear console"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </div>

      <div className={styles.body}>
        <div
          ref={scrollRef}
          className={styles.scrollArea}
          onScroll={handleScroll}
          onClick={() => {
            if (mode === "terminal") {
              inputRef.current?.focus();
            }
          }}
        >
          {visibleOutput.length === 0 ? (
            <pre className={classNames(styles.line, styles.lineEmpty)} style={{ fontSize: `${fontSize}px` }}>
              {emptyMessage}
            </pre>
          ) : (
            visibleOutput.map((line) => (
              <pre
                key={line.id}
                className={classNames(styles.line, getLineClassName(line.type))}
                style={{ fontSize: `${fontSize}px` }}
              >
                {formatTimestamp(line.timestamp)}
                {line.content}
              </pre>
            ))
          )}
        </div>

        {mode === "terminal" && (
          <div className={styles.inputDock}>
            {hint && <div className={styles.completionHint}>{hint}</div>}
            <div className={styles.inputRow}>
              <span className={styles.prompt} style={{ fontSize: `${fontSize}px` }}>
                simba&gt;
              </span>
              <input
                ref={inputRef}
                type="text"
                value={currentCommand}
                onChange={(e) => {
                  setCurrentCommand(e.target.value);
                  setHint(null);
                }}
                onKeyDown={handleKeyDown}
                className={styles.input}
                style={{ fontSize: `${fontSize}px` }}
                data-cursor={settings.terminal?.cursorStyle || "block"}
                placeholder="Type a command..."
                disabled={status === "running"}
                spellCheck={false}
                autoCapitalize="off"
                autoComplete="off"
                autoCorrect="off"
                aria-label="Terminal command"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
