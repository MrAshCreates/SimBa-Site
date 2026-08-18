import React, { useState } from "react";
import classNames from "classnames";
import { Plus, Save, Folder, Edit3, Trash2, Loader2, Upload, FileText } from "lucide-react";
import type { Project } from "~/data/auth";
import styles from "./projects-panel.module.css";

interface ProjectsPanelProps {
  /**
   * List of user projects
   * @important
   */
  projects: Project[];
  /**
   * Currently active project
   * @important
   */
  currentProject: Project | null;
  /**
   * Whether projects are loading
   * @important
   */
  isLoading: boolean;
  /**
   * Callback to load a project
   * @important
   */
  onLoadProject: (project: Project) => void;
  /**
   * Callback to save current code as a project
   * @important
   */
  onSaveProject: (name: string) => void;
  /**
   * Callback to delete a project
   * @important
   */
  onDeleteProject: (projectId: string) => void;
  /**
   * Callback to create a new project
   * @important
   */
  onNewProject: () => void;
  /**
   * Callback to import file content
   * @important
   */
  onImportFile: (content: string) => void;
  /**
   * Additional CSS class name
   */
  className?: string;
}

export function ProjectsPanel({
  projects,
  currentProject,
  isLoading,
  onLoadProject,
  onSaveProject,
  onDeleteProject,
  onNewProject,
  onImportFile,
  className,
}: ProjectsPanelProps) {
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [importContent, setImportContent] = useState("");

  const handleSave = () => {
    if (currentProject) {
      // Update existing project
      onSaveProject(currentProject.name);
    } else {
      // Save as new project
      setSaveDialogOpen(true);
      setProjectName("");
    }
  };

  const handleSaveConfirm = () => {
    if (projectName.trim()) {
      onSaveProject(projectName.trim());
      setSaveDialogOpen(false);
      setProjectName("");
    }
  };

  const handleImport = () => {
    if (importContent.trim()) {
      onImportFile(importContent.trim());
      setImportContent("");
    }
  };

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
      <div className={styles.header}>
        <h3 className={styles.title}>Projects</h3>
        <div className={styles.actions}>
          <button onClick={onNewProject} className={styles.actionButton} title="New Project">
            <Plus className={styles.buttonIcon} />
            New
          </button>
          <button
            onClick={handleSave}
            className={styles.actionButton}
            title={currentProject ? "Save Project" : "Save As..."}
          >
            <Save className={styles.buttonIcon} />
            Save
          </button>
        </div>
      </div>

      <div className={styles.content}>
        {isLoading ? (
          <div className={styles.loading}>
            <Loader2 className="animate-spin" size={16} />
            Loading projects...
          </div>
        ) : projects.length === 0 ? (
          <div className={styles.emptyState}>
            <Folder className={styles.emptyIcon} />
            <h4 className={styles.emptyTitle}>No Projects Yet</h4>
            <p className={styles.emptyDescription}>Create your first project or import a .smba file to get started.</p>
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
                      className={styles.projectActionButton}
                      onClick={(e) => {
                        e.stopPropagation();
                        // TODO: Implement rename functionality
                      }}
                      title="Rename Project"
                    >
                      <Edit3 size={12} />
                    </button>
                    <button
                      className={classNames(styles.projectActionButton, styles.deleteButton)}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Delete project "${project.name}"?`)) {
                          onDeleteProject(project.id);
                        }
                      }}
                      title="Delete Project"
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
          <h4 className={styles.importTitle}>Import .smba File</h4>
          <textarea
            className={styles.importTextarea}
            value={importContent}
            onChange={(e) => setImportContent(e.target.value)}
            placeholder="Paste your .smba file content here..."
          />
          <button className={styles.importButton} onClick={handleImport} disabled={!importContent.trim()}>
            <Upload className={styles.buttonIcon} />
            Import Code
          </button>
        </div>
      </div>

      {/* Save Dialog */}
      {saveDialogOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => setSaveDialogOpen(false)}
        >
          <div
            style={{
              backgroundColor: "var(--color-base-bg-subtle)",
              border: "1px solid var(--color-base-border)",
              borderRadius: "var(--radius-2)",
              padding: "var(--space-6)",
              minWidth: "300px",
              maxWidth: "400px",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: "0 0 var(--space-4) 0" }}>Save Project</h3>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="Enter project name"
              style={{
                width: "100%",
                padding: "var(--space-2)",
                marginBottom: "var(--space-4)",
                border: "1px solid var(--color-base-border)",
                borderRadius: "var(--radius-1)",
                backgroundColor: "var(--color-base-bg)",
                color: "var(--color-base-text)",
              }}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSaveConfirm();
                } else if (e.key === "Escape") {
                  setSaveDialogOpen(false);
                }
              }}
            />
            <div style={{ display: "flex", gap: "var(--space-2)" }}>
              <button
                onClick={handleSaveConfirm}
                disabled={!projectName.trim()}
                className={styles.actionButton}
                style={{ flex: 1 }}
              >
                Save
              </button>
              <button
                onClick={() => setSaveDialogOpen(false)}
                className={classNames(styles.actionButton, styles.secondaryButton)}
                style={{ flex: 1 }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
