import React, { useState, useRef, useEffect } from "react";
import classNames from "classnames";
import { FileText, Folder, FolderOpen, Plus, MoreHorizontal, Edit3, Trash2, ChevronRight, File } from "lucide-react";
import styles from "./file-explorer.module.css";

export interface FileNode {
  id: string;
  name: string;
  type: "file" | "folder";
  path: string;
  children?: FileNode[];
  isExpanded?: boolean;
}

interface FileExplorerProps {
  /**
   * File tree structure
   * @important
   */
  files: FileNode[];
  /**
   * Currently active file ID
   * @important
   */
  activeFileId?: string;
  /**
   * Callback when a file is selected
   * @important
   */
  onFileSelect: (file: FileNode) => void;
  /**
   * Callback when a new file is created
   * @important
   */
  onFileCreate?: (parentPath: string, name: string) => void;
  /**
   * Callback when a file is renamed
   * @important
   */
  onFileRename?: (fileId: string, newName: string) => void;
  /**
   * Callback when a file is deleted
   * @important
   */
  onFileDelete?: (fileId: string) => void;
  /**
   * Callback when a folder is toggled
   * @important
   */
  onFolderToggle?: (folderId: string) => void;
  /**
   * Additional CSS class name
   */
  className?: string;
}

interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  file?: FileNode;
}

export function FileExplorer({
  files,
  activeFileId,
  onFileSelect,
  onFileCreate,
  onFileRename,
  onFileDelete,
  onFolderToggle,
  className,
}: FileExplorerProps) {
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({ visible: false, x: 0, y: 0 });
  const [renamingFileId, setRenamingFileId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const contextMenuRef = useRef<HTMLDivElement>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(event.target as Node)) {
        setContextMenu({ visible: false, x: 0, y: 0 });
      }
    };

    if (contextMenu.visible) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [contextMenu.visible]);

  // Focus rename input when renaming starts
  useEffect(() => {
    if (renamingFileId && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [renamingFileId]);

  const handleContextMenu = (e: React.MouseEvent, file: FileNode) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      file,
    });
  };

  const handleFileClick = (file: FileNode) => {
    if (file.type === "folder") {
      onFolderToggle?.(file.id);
    } else {
      onFileSelect(file);
    }
  };

  const handleRename = (file: FileNode) => {
    setRenamingFileId(file.id);
    setRenameValue(file.name);
    setContextMenu({ visible: false, x: 0, y: 0 });
  };

  const handleRenameSubmit = () => {
    if (renamingFileId && renameValue.trim() && onFileRename) {
      onFileRename(renamingFileId, renameValue.trim());
    }
    setRenamingFileId(null);
    setRenameValue("");
  };

  const handleRenameCancel = () => {
    setRenamingFileId(null);
    setRenameValue("");
  };

  const handleDelete = (file: FileNode) => {
    if (confirm(`Delete ${file.type} "${file.name}"?`)) {
      onFileDelete?.(file.id);
    }
    setContextMenu({ visible: false, x: 0, y: 0 });
  };

  const handleNewFile = () => {
    const parentPath = contextMenu.file?.type === "folder" ? contextMenu.file.path : "";
    const fileName = prompt("Enter file name:");
    if (fileName && onFileCreate) {
      onFileCreate(parentPath, fileName.endsWith(".smba") ? fileName : `${fileName}.smba`);
    }
    setContextMenu({ visible: false, x: 0, y: 0 });
  };

  const renderFileIcon = (file: FileNode) => {
    if (file.type === "folder") {
      return file.isExpanded ? (
        <FolderOpen className={styles.fileItemIcon} size={16} />
      ) : (
        <Folder className={styles.fileItemIcon} size={16} />
      );
    }
    return <FileText className={styles.fileItemIcon} size={16} />;
  };

  const renderFileItem = (file: FileNode, level = 0) => {
    const isActive = file.id === activeFileId;
    const isRenaming = file.id === renamingFileId;

    return (
      <li key={file.id}>
        <div
          className={classNames(
            styles.fileItem,
            file.type === "folder" && styles.folderItem,
            isActive && styles.fileItemActive,
          )}
          onClick={() => handleFileClick(file)}
          onContextMenu={(e) => handleContextMenu(e, file)}
          style={{ paddingLeft: `calc(var(--space-2) + ${level * 16}px)` }}
        >
          {file.type === "folder" && (
            <ChevronRight
              className={classNames(styles.folderToggle, file.isExpanded && styles.folderToggleExpanded)}
              size={12}
            />
          )}

          {renderFileIcon(file)}

          {isRenaming ? (
            <input
              ref={renameInputRef}
              className={styles.renameInput}
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleRenameSubmit();
                } else if (e.key === "Escape") {
                  handleRenameCancel();
                }
              }}
              onBlur={handleRenameSubmit}
            />
          ) : (
            <span className={styles.fileName}>{file.name}</span>
          )}

          {!isRenaming && (
            <div className={styles.fileActions}>
              <button
                className={styles.fileActionButton}
                onClick={(e) => {
                  e.stopPropagation();
                  handleRename(file);
                }}
                title="Rename"
              >
                <Edit3 size={12} />
              </button>
              <button
                className={classNames(styles.fileActionButton, styles.deleteButton)}
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(file);
                }}
                title="Delete"
              >
                <Trash2 size={12} />
              </button>
            </div>
          )}
        </div>

        {file.type === "folder" && file.isExpanded && file.children && (
          <ul className={styles.nestedItems}>{file.children.map((child) => renderFileItem(child, level + 1))}</ul>
        )}
      </li>
    );
  };

  return (
    <div className={classNames(styles.container, className)}>
      <div className={styles.header}>
        <h3 className={styles.title}>Explorer</h3>
        <div className={styles.headerActions}>
          <button className={styles.headerButton} onClick={() => onFileCreate?.("", "new-file.smba")} title="New File">
            <Plus size={14} />
          </button>
          <button className={styles.headerButton} title="More Actions">
            <MoreHorizontal size={14} />
          </button>
        </div>
      </div>

      <div className={styles.content}>
        {files.length === 0 ? (
          <div className={styles.emptyState}>
            <File className={styles.emptyIcon} />
            <h4 className={styles.emptyTitle}>No Files</h4>
            <p className={styles.emptyDescription}>Create a new file to get started with your SimBa project.</p>
          </div>
        ) : (
          <ul className={styles.fileTree}>{files.map((file) => renderFileItem(file))}</ul>
        )}
      </div>

      {contextMenu.visible && (
        <div
          ref={contextMenuRef}
          className={styles.contextMenu}
          style={{
            left: contextMenu.x,
            top: contextMenu.y,
          }}
        >
          <div className={styles.contextMenuItem} onClick={handleNewFile}>
            <Plus size={14} />
            New File
          </div>
          <div className={styles.contextMenuSeparator} />
          <div className={styles.contextMenuItem} onClick={() => contextMenu.file && handleRename(contextMenu.file)}>
            <Edit3 size={14} />
            Rename
          </div>
          <div className={styles.contextMenuItem} onClick={() => contextMenu.file && handleDelete(contextMenu.file)}>
            <Trash2 size={14} />
            Delete
          </div>
        </div>
      )}
    </div>
  );
}
