import React, { useState } from "react";
import classNames from "classnames";
import { Files, FolderOpen, Plus, MoreHorizontal } from "lucide-react";
import { FileExplorer, type FileNode } from "../file-explorer/file-explorer";
import { ProjectsPanel } from "../projects-panel/projects-panel";
import type { Project } from "~/data/auth";
import styles from "./sidebar.module.css";

type SidebarView = "explorer" | "projects";

interface SidebarProps {
  /**
   * Array of file nodes for the file explorer
   * @important
   */
  files: FileNode[];
  /**
   * ID of the currently active file
   */
  activeFileId?: string;
  /**
   * Array of user projects
   * @important
   */
  projects: Project[];
  /**
   * Currently selected project
   */
  currentProject: Project | null;
  /**
   * Whether projects are loading
   */
  isLoadingProjects: boolean;
  /**
   * Callback when a file is selected
   * @important
   */
  onFileSelect: (file: FileNode) => void;
  /**
   * Callback when a project is loaded
   * @important
   */
  onLoadProject: (project: Project) => void;
  /**
   * Callback when a project is saved
   * @important
   */
  onSaveProject: (name: string) => Promise<void>;
  /**
   * Callback when a project is deleted
   * @important
   */
  onDeleteProject: (projectId: string) => Promise<void>;
  /**
   * Callback when creating a new project
   * @important
   */
  onNewProject: () => void;
  /**
   * Callback when importing a file
   * @important
   */
  onImportFile: (content: string) => void;
  /**
   * Additional CSS class name
   */
  className?: string;
}

export function Sidebar({
  files,
  activeFileId,
  projects,
  currentProject,
  isLoadingProjects,
  onFileSelect,
  onLoadProject,
  onSaveProject,
  onDeleteProject,
  onNewProject,
  onImportFile,
  className,
}: SidebarProps) {
  const [activeView, setActiveView] = useState<SidebarView>("explorer");

  const activityItems = [
    {
      id: "explorer" as const,
      icon: Files,
      label: "Explorer",
      title: "Explorer",
    },
    {
      id: "projects" as const,
      icon: FolderOpen,
      label: "Projects",
      title: "Projects",
    },
  ];

  const renderPanelContent = () => {
    switch (activeView) {
      case "explorer":
        return <FileExplorer files={files} activeFileId={activeFileId} onFileSelect={onFileSelect} />;
      case "projects":
        return (
          <ProjectsPanel
            projects={projects}
            currentProject={currentProject}
            isLoading={isLoadingProjects}
            onLoadProject={onLoadProject}
            onSaveProject={onSaveProject}
            onDeleteProject={onDeleteProject}
            onNewProject={onNewProject}
            onImportFile={onImportFile}
          />
        );
      default:
        return null;
    }
  };

  const getCurrentPanelTitle = () => {
    const item = activityItems.find((item) => item.id === activeView);
    return item?.title || "Explorer";
  };

  return (
    <div className={classNames(styles.container, className)}>
      {/* Activity Bar */}
      <div className={styles.activityBar}>
        {activityItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              className={classNames(styles.activityButton, activeView === item.id && styles.active)}
              onClick={() => setActiveView(item.id)}
              title={item.label}
            >
              <Icon className={styles.activityIcon} />
            </button>
          );
        })}
      </div>

      {/* Sidebar Content */}
      <div className={styles.sidebarContent}>
        <div className={styles.panelContainer}>
          <div className={styles.panelHeader}>
            <h3 className={styles.panelTitle}>{getCurrentPanelTitle()}</h3>
            <div className={styles.panelActions}>
              {activeView === "projects" && (
                <button className={styles.panelActionButton} onClick={onNewProject} title="New Project">
                  <Plus size={14} />
                </button>
              )}
              <button className={styles.panelActionButton} title="More Actions">
                <MoreHorizontal size={14} />
              </button>
            </div>
          </div>
          <div className={styles.panelContent}>{renderPanelContent()}</div>
        </div>
      </div>
    </div>
  );
}
