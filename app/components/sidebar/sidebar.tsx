import { useState, useRef, useEffect, type ChangeEvent } from "react";
import classNames from "classnames";
import { Files, FolderOpen, Plus, MoreHorizontal, Upload, Save } from "lucide-react";
import { FileExplorer, type FileNode } from "../file-explorer/file-explorer";
import { ProjectsPanel } from "../projects-panel/projects-panel";
import type { Project } from "~/data/auth";
import styles from "./sidebar.module.css";

type SidebarView = "explorer" | "projects";

interface SidebarProps {
  files: FileNode[];
  activeFileId?: string;
  projects: Project[];
  currentProject: Project | null;
  isLoadingProjects: boolean;
  onFileSelect: (file: FileNode) => void;
  onFileCreate: () => void;
  onFileRename: (fileId: string, newName: string) => void;
  onFileDelete: (fileId: string) => void;
  onLoadProject: (project: Project) => void;
  onSaveProject: (name: string) => Promise<void>;
  onDeleteProject: (projectId: string) => Promise<void>;
  onNewProject: () => void;
  onImportFile: (content: string, fileName?: string) => void;
  className?: string;
}

export function Sidebar({
  files,
  activeFileId,
  projects,
  currentProject,
  isLoadingProjects,
  onFileSelect,
  onFileCreate,
  onFileRename,
  onFileDelete,
  onLoadProject,
  onSaveProject,
  onDeleteProject,
  onNewProject,
  onImportFile,
  className,
}: SidebarProps) {
  const [activeView, setActiveView] = useState<SidebarView>("explorer");
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

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

  const handleImportPick = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      onImportFile(String(reader.result ?? ""), file.name);
      setMenuOpen(false);
    };
    reader.readAsText(file);
    event.target.value = "";
  };

  return (
    <div className={classNames(styles.container, className)}>
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

      <div className={styles.sidebarContent}>
        <div className={styles.panelContainer}>
          <div className={styles.panelHeader}>
            <h3 className={styles.panelTitle}>{activeView === "explorer" ? "Explorer" : "Projects"}</h3>
            <div className={styles.panelActions} ref={menuRef}>
              {activeView === "explorer" ? (
                <button className={styles.panelActionButton} onClick={onFileCreate} title="New File">
                  <Plus size={14} />
                </button>
              ) : (
                <>
                  <button className={styles.panelActionButton} onClick={onNewProject} title="New File">
                    <Plus size={14} />
                  </button>
                  <button
                    className={styles.panelActionButton}
                    onClick={() => currentProject && onSaveProject(currentProject.name)}
                    title="Save File"
                    disabled={!currentProject}
                  >
                    <Save size={14} />
                  </button>
                </>
              )}
              <button
                className={styles.panelActionButton}
                onClick={() => setMenuOpen((open) => !open)}
                title="More actions"
              >
                <MoreHorizontal size={14} />
              </button>
              {menuOpen && (
                <div className={styles.overflowMenu}>
                  <button
                    className={styles.overflowMenuItem}
                    onClick={() => {
                      setMenuOpen(false);
                      if (activeView === "explorer") {
                        onFileCreate();
                      } else {
                        onNewProject();
                      }
                    }}
                  >
                    <Plus size={14} />
                    New File
                  </button>
                  <button
                    className={styles.overflowMenuItem}
                    onClick={() => importInputRef.current?.click()}
                  >
                    <Upload size={14} />
                    Import File
                  </button>
                </div>
              )}
              <input
                ref={importInputRef}
                type="file"
                accept=".smba,.txt"
                hidden
                onChange={handleImportPick}
              />
            </div>
          </div>
          <div className={styles.panelContent}>
            {activeView === "explorer" ? (
              <FileExplorer
                files={files}
                activeFileId={activeFileId}
                onFileSelect={onFileSelect}
                onFileCreate={onFileCreate}
                onFileRename={onFileRename}
                onFileDelete={onFileDelete}
              />
            ) : (
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
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
