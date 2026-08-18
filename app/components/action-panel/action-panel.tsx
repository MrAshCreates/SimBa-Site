import { FileText, X } from "lucide-react";
import classNames from "classnames";
import type { SimBaExample } from "~/data/examples";
import styles from "./action-panel.module.css";

interface ActionPanelProps {
  /**
   * Callback to load an example
   * @important
   */
  onLoadExample: (example: SimBaExample) => void;
  /**
   * Available examples to load
   * @important
   */
  examples: SimBaExample[];
  /**
   * Hide the examples panel, matching the toolbar toggle
   * @important
   */
  onClose: () => void;
  /**
   * Additional CSS class name
   */
  className?: string;
}

export function ActionPanel({ onLoadExample, examples, onClose, className }: ActionPanelProps) {
  return (
    <div className={classNames(styles.container, className)}>
      <div className={styles.header}>
        <div className={styles.headerTitle}>
          <FileText className={styles.headerIcon} size={16} />
          Examples
        </div>
        <button className={styles.closeButton} onClick={onClose} title="Close Examples Panel">
          <X size={14} />
        </button>
      </div>

      <div className={styles.exampleSection}>
        <p className={styles.description}>Load SimBa examples to explore language features and best practices.</p>
        <div className={styles.exampleGrid}>
          {examples.map((example) => (
            <button key={example.id} className={styles.exampleButton} onClick={() => onLoadExample(example)}>
              <h5 className={styles.exampleTitle}>{example.title}</h5>
              <p className={styles.exampleDescription}>{example.description}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
