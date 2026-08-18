import { useState } from "react";
import classNames from "classnames";
import { FileText, X } from "lucide-react";
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
   * Additional CSS class name
   */
  className?: string;
}

export function ActionPanel({ onLoadExample, examples, className }: ActionPanelProps) {
  const [isExamplesOpen, setIsExamplesOpen] = useState(true);

  const handleExampleSelect = (example: SimBaExample) => {
    onLoadExample(example);
  };

  if (!isExamplesOpen) {
    return (
      <div className={classNames(styles.container, styles.collapsed, className)}>
        <button className={styles.expandButton} onClick={() => setIsExamplesOpen(true)} title="Show Examples">
          <FileText size={16} />
          Examples
        </button>
      </div>
    );
  }

  return (
    <div className={classNames(styles.container, className)}>
      <div className={styles.header}>
        <div className={styles.headerTitle}>
          <FileText className={styles.headerIcon} size={16} />
          Examples
        </div>
        <button className={styles.closeButton} onClick={() => setIsExamplesOpen(false)} title="Close Examples Panel">
          <X size={14} />
        </button>
      </div>

      <div className={styles.exampleSection}>
        <p className={styles.description}>Load SimBa examples to explore language features and best practices.</p>
        <div className={styles.exampleGrid}>
          {examples.map((example) => (
            <button key={example.id} className={styles.exampleButton} onClick={() => handleExampleSelect(example)}>
              <h5 className={styles.exampleTitle}>{example.title}</h5>
              <p className={styles.exampleDescription}>{example.description}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
