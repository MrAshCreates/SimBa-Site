import { useRef } from "react";
import classNames from "classnames";
import { Folder, Trash2, Loader2, Upload } from "lucide-react";
import type { Project } from "~/data/auth";
import styles from "./projects-panel.module.css";

interface ProjectsPanelProps {
  projects: Project[];
  currentProject: Project | null;
  isLoading: boolean;
  onLoadProject: (project: Project) => void;
  onSaveProject: (name: string) => void;
  onDeleteProject: (projectId: string) => void;
  onNewProject: () => void;
  onImportFile: (content: string, fileName?: string) => void;
  className?: string;
}

export function ProjectsPanel({
  projects,
  currentProject,
  isLoading,
  onLoadProject,
  onDeleteProject,
  onImportFile,
  className,
}: ProjectsPanelProps) {
  const importInputRef = useRef<HTMLInputElement>(null);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date));
  };

  return (
    <div className={classNames(styles.container, className)}>
      <div className={styles.content}>
        {isLoading ? (
          <div className={styles.loading}>
            <Loader2 className="animate-spin" size={16} />
            Loading files...
          </div>
        ) : projects.length === 0 ? (
          <div className={styles.emptyState}>
            <Folder className={styles.emptyIcon} />
            <h4 className={styles.emptyTitle}>No Files Yet</h4>
            <p className={styles.emptyDescription}>Create a file or import a .smba script to get started.</p>
          </div>
        ) : (
          <div className={styles.projectsList}>
            {projects.map((project) => (
              <div
                key={project.id}
                className={classNames(
                  styles.projectItem,
                  currentProject?.id === project.id && styles.projectItemActive,
                )}
                onClick={() => onLoadProject(project)}
              >
                <h4 className={styles.projectName}>{project.name}</h4>
                <div className={styles.projectMeta}>
                  <span className={styles.projectDate}>{formatDate(project.updatedAt)}</span>
                  <div className={styles.projectActions}>
                    <button
                      className={classNames(styles.projectActionButton, styles.deleteButton)}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Delete file "${project.name}"?`)) {
                          onDeleteProject(project.id);
                        }
                      }}
                      title="Delete File"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className={styles.importSection}>
          <h4 className={styles.importTitle}>Import a .smba file</h4>
          <p className={styles.emptyDescription}>Choose a SimBa script from your computer. It will be saved to your account.</p>
          <input
            ref={importInputRef}
            type="file"
            accept=".smba,.txt"
            hidden
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = () => {
                onImportFile(String(reader.result ?? ""), file.name);
              };
              reader.readAsText(file);
              event.target.value = "";
            }}
          />
          <button className={styles.importButton} onClick={() => importInputRef.current?.click()}>
            <Upload className={styles.buttonIcon} />
            Choose File
          </button>
        </div>
      </div>
    </div>
  );
}
