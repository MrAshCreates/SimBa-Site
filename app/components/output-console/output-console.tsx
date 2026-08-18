import classNames from "classnames";
import { Circle, CheckCircle, XCircle, Loader2, Trash2 } from "lucide-react";
import styles from "./output-console.module.css";

export type OutputStatus = "ready" | "running" | "success" | "error";
export type OutputType = "success" | "error" | "info" | "program" | "command";
export type ConsoleSource = "run" | "session";

export interface OutputLine {
  id: string;
  type: OutputType;
  content: string;
  timestamp: Date;
  source?: ConsoleSource;
}

interface OutputConsoleProps {
  /**
   * Current status of the console
   * @important
   * @enum ready,running,success,error
   */
  status: OutputStatus;
  /**
   * Array of output lines to display
   * @important
   */
  output: OutputLine[];
  /**
   * Callback to clear the console output
   * @important
   */
  onClear: () => void;
  /**
   * Title displayed in the console header
   * @important
   */
  title?: string;
  /**
   * Additional CSS class name
   */
  className?: string;
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

export function OutputConsole({ status, output, onClear, title = "Output Console", className }: OutputConsoleProps) {
  const statusConfig = STATUS_CONFIG[status];
  const StatusIcon = statusConfig.icon;

  const getOutputClassName = (type: OutputType) => {
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

  const formatOutput = () => {
    if (output.length === 0) {
      return <pre className={classNames(styles.output, styles.outputEmpty)}>Console output will appear here...</pre>;
    }

    return output.map((line) => (
      <pre key={line.id} className={classNames(styles.output, getOutputClassName(line.type))}>
        {line.content}
      </pre>
    ));
  };

  return (
    <div className={classNames(styles.container, className)}>
      <div className={styles.header}>
        <h3 className={styles.title}>{title}</h3>
        <div className={styles.status}>
          <StatusIcon
            className={classNames(styles.statusIcon, statusConfig.className, status === "running" && "animate-spin")}
          />
          <span className={statusConfig.className}>{statusConfig.label}</span>
          <button className={styles.clearButton} onClick={onClear} title="Clear console">
            <Trash2 size={14} />
          </button>
        </div>
      </div>
      <div className={styles.outputArea}>{formatOutput()}</div>
    </div>
  );
}
