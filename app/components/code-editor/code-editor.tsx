import React, { useState, useRef, useEffect, useCallback } from "react";
import { Link } from "react-router";
import classNames from "classnames";
import { Editor } from "@monaco-editor/react";
import {
  FileText,
  Search,
  Settings,
  Maximize2,
  Minimize2,
  ChevronRight,
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Play,
  Code,
  Lock,
} from "lucide-react";
import { useUserSettings } from "~/hooks/use-user-settings";
import styles from "./code-editor.module.css";

interface CodeEditorProps {
  /**
   * The code content to display in the editor
   * @important
   */
  value: string;
  /**
   * Callback when the code content changes
   * @important
   */
  onChange: (value: string) => void;
  /**
   * Placeholder text for the editor
   * @important
   */
  placeholder?: string;
  /**
   * Title displayed in the editor header
   * @important
   */
  title?: string;
  /**
   * Language tag displayed in the header
   * @important
   */
  language?: string;
  /**
   * File path for breadcrumb navigation
   * @important
   */
  filePath?: string;
  /**
   * Whether the editor is in fullscreen mode
   * @important
   */
  isFullscreen?: boolean;
  /**
   * Callback to toggle fullscreen mode
   * @important
   */
  onToggleFullscreen?: () => void;
  /**
   * Whether the file is read-only (e.g., for examples)
   * @important
   */
  isReadOnly?: boolean;
  /**
   * Whether code is currently running
   * @important
   */
  isRunning?: boolean;
  /**
   * Callback to run the code
   * @important
   */
  onRun?: () => void;
  /**
   * Callback to compile the code
   * @important
   */
  onCompile?: () => void;
  /**
   * Additional CSS class name
   */
  className?: string;
}

// SimBa language configuration for Monaco Editor
const SIMBA_LANGUAGE_CONFIG = {
  id: "simba",
  extensions: [".smba"],
  aliases: ["SimBa", "simba"],
  mimetypes: ["text/x-simba"],
};

const SIMBA_MONARCH_LANGUAGE = {
  keywords: [
    "def",
    "class",
    "if",
    "elif",
    "else",
    "for",
    "while",
    "try",
    "except",
    "finally",
    "with",
    "as",
    "import",
    "from",
    "return",
    "yield",
    "break",
    "continue",
    "pass",
    "and",
    "or",
    "not",
    "in",
    "is",
    "lambda",
    "global",
    "nonlocal",
    "assert",
    "rust",
    "python",
    "async",
    "await",
    "match",
    "case",
  ],

  typeKeywords: ["int", "float", "str", "bool", "list", "dict", "tuple", "set", "None", "True", "False"],

  operators: [
    "=",
    ">",
    "<",
    "!",
    "~",
    "?",
    ":",
    "==",
    "<=",
    ">=",
    "!=",
    "&&",
    "||",
    "++",
    "--",
    "+",
    "-",
    "*",
    "/",
    "&",
    "|",
    "^",
    "%",
    "<<",
    ">>",
    ">>>",
    "+=",
    "-=",
    "*=",
    "/=",
    "&=",
    "|=",
    "^=",
    "%=",
    "<<=",
    ">>=",
    ">>>=",
  ],

  symbols: /[=><!~?:&|+\-*\/\^%]+/,

  tokenizer: {
    root: [
      [
        /[a-zA-Z_]\w*/,
        {
          cases: {
            "@keywords": "keyword",
            "@typeKeywords": "type",
            "@default": "identifier",
          },
        },
      ],

      [/rust\s*\{/, { token: "keyword", next: "@rustBlock" }],
      [/python\s*\{/, { token: "keyword", next: "@pythonBlock" }],

      { include: "@whitespace" },

      [/[{}()\[\]]/, "@brackets"],
      [/[<>](?!@symbols)/, "@brackets"],
      [
        /@symbols/,
        {
          cases: {
            "@operators": "operator",
            "@default": "",
          },
        },
      ],

      [/\d*\.\d+([eE][\-+]?\d+)?/, "number.float"],
      [/0[xX][0-9a-fA-F]+/, "number.hex"],
      [/\d+/, "number"],

      [/[;,.]/, "delimiter"],

      [/"([^"\\]|\\.)*$/, "string.invalid"],
      [/"/, { token: "string.quote", bracket: "@open", next: "@string" }],
      [/'([^'\\]|\\.)*$/, "string.invalid"],
      [/'/, { token: "string.quote", bracket: "@open", next: "@stringSingle" }],
    ],

    rustBlock: [
      [/\}/, { token: "keyword", next: "@pop" }],
      [/[^}]+/, "string.rust"],
    ],

    pythonBlock: [
      [/\}/, { token: "keyword", next: "@pop" }],
      [/[^}]+/, "string.python"],
    ],

    string: [
      [/[^\\"]+/, "string"],
      [/\\./, "string.escape.invalid"],
      [/"/, { token: "string.quote", bracket: "@close", next: "@pop" }],
    ],

    stringSingle: [
      [/[^\\']+/, "string"],
      [/\\./, "string.escape.invalid"],
      [/'/, { token: "string.quote", bracket: "@close", next: "@pop" }],
    ],

    whitespace: [
      [/[ \t\r\n]+/, "white"],
      [/#.*$/, "comment"],
    ],
  },
};

export function CodeEditor({
  value,
  onChange,
  placeholder = "Enter your SimBa code here...",
  title = "Code Editor",
  language = "SimBa",
  filePath,
  isFullscreen = false,
  onToggleFullscreen,
  isReadOnly = false,
  isRunning = false,
  onRun,
  onCompile,
  className,
}: CodeEditorProps) {
  const { settings } = useUserSettings();
  const [isEditorReady, setIsEditorReady] = useState(false);
  const [showFind, setShowFind] = useState(false);
  const [findText, setFindText] = useState("");
  const [replaceText, setReplaceText] = useState("");
  const [cursorPosition, setCursorPosition] = useState({ line: 1, column: 1 });
  const [selectionInfo, setSelectionInfo] = useState("");
  const [editorStats, setEditorStats] = useState({ lines: 0, chars: 0 });

  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);

  // Register SimBa language with Monaco
  const handleEditorWillMount = useCallback((monaco: any) => {
    monacoRef.current = monaco;

    // Register the SimBa language
    monaco.languages.register(SIMBA_LANGUAGE_CONFIG);
    monaco.languages.setMonarchTokensProvider("simba", SIMBA_MONARCH_LANGUAGE);

    // Configure editor theme
    monaco.editor.defineTheme("simba-dark", {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "keyword", foreground: "569CD6" },
        { token: "type", foreground: "4EC9B0" },
        { token: "string", foreground: "CE9178" },
        { token: "string.rust", foreground: "D7BA7D", fontStyle: "italic" },
        { token: "string.python", foreground: "9CDCFE", fontStyle: "italic" },
        { token: "comment", foreground: "6A9955", fontStyle: "italic" },
        { token: "number", foreground: "B5CEA8" },
        { token: "operator", foreground: "D4D4D4" },
        { token: "identifier", foreground: "9CDCFE" },
      ],
      colors: {
        "editor.background": "#1e1e1e",
        "editor.foreground": "#d4d4d4",
        "editorLineNumber.foreground": "#858585",
        "editorLineNumber.activeForeground": "#c6c6c6",
        "editor.selectionBackground": "#264f78",
        "editor.selectionHighlightBackground": "#add6ff26",
        "editorCursor.foreground": "#aeafad",
        "editor.findMatchBackground": "#515c6a",
        "editor.findMatchHighlightBackground": "#ea5c0055",
        "editor.findRangeHighlightBackground": "#3a3d4166",
      },
    });
  }, []);

  const handleEditorDidMount = useCallback(
    (editor: any, monaco: any) => {
      editorRef.current = editor;
      setIsEditorReady(true);

      // Set up cursor position tracking
      editor.onDidChangeCursorPosition((e: any) => {
        setCursorPosition({
          line: e.position.lineNumber,
          column: e.position.column,
        });
      });

      // Set up selection tracking
      editor.onDidChangeCursorSelection((e: any) => {
        const selection = e.selection;
        if (selection.isEmpty()) {
          setSelectionInfo("");
        } else {
          const startLine = selection.startLineNumber;
          const endLine = selection.endLineNumber;
          const selectedText = editor.getModel()?.getValueInRange(selection) || "";
          setSelectionInfo(`(${selectedText.length} chars, ${endLine - startLine + 1} lines)`);
        }
      });

      // Set up keyboard shortcuts
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyF, () => {
        setShowFind(true);
      });

      editor.addCommand(monaco.KeyCode.Escape, () => {
        setShowFind(false);
      });

      // Add run shortcut
      if (onRun) {
        editor.addCommand(monaco.KeyCode.F5, () => {
          onRun();
        });
      }
    },
    [onRun],
  );

  const handleEditorChange = useCallback(
    (newValue: string | undefined) => {
      if (isReadOnly) return;

      const content = newValue || "";
      onChange(content);

      // Update stats
      const lines = content.split("\n").length;
      const chars = content.length;
      setEditorStats({ lines, chars });
    },
    [onChange, isReadOnly],
  );

  const handleFind = useCallback(() => {
    if (editorRef.current && findText) {
      const model = editorRef.current.getModel();
      const matches = model.findMatches(findText, false, false, false, null, false);
      if (matches.length > 0) {
        editorRef.current.setSelection(matches[0].range);
        editorRef.current.revealRangeInCenter(matches[0].range);
      }
    }
  }, [findText]);

  const handleReplace = useCallback(() => {
    if (editorRef.current && findText && !isReadOnly) {
      const selection = editorRef.current.getSelection();
      const selectedText = editorRef.current.getModel()?.getValueInRange(selection);
      if (selectedText === findText) {
        editorRef.current.executeEdits("replace", [
          {
            range: selection,
            text: replaceText,
          },
        ]);
      }
      handleFind(); // Find next occurrence
    }
  }, [findText, replaceText, handleFind, isReadOnly]);

  const handleReplaceAll = useCallback(() => {
    if (editorRef.current && findText && !isReadOnly) {
      const model = editorRef.current.getModel();
      const matches = model.findMatches(findText, false, false, false, null, false);
      const edits = matches.map((match: any) => ({
        range: match.range,
        text: replaceText,
      }));
      editorRef.current.executeEdits("replaceAll", edits);
    }
  }, [findText, replaceText, isReadOnly]);

  const renderBreadcrumb = () => {
    if (!filePath) return null;

    const parts = filePath.split("/");
    return (
      <div className={styles.breadcrumb}>
        {parts.map((part, index) => (
          <React.Fragment key={index}>
            {index > 0 && <ChevronRight className={styles.breadcrumbSeparator} size={12} />}
            <span className={styles.breadcrumbItem}>{part}</span>
          </React.Fragment>
        ))}
      </div>
    );
  };

  // Get editor options from user settings
  const editorOptions = {
    minimap: { enabled: settings.editor?.minimap !== false },
    fontSize: settings.editor?.fontSize || 14,
    fontFamily: "var(--font-monospace-code)",
    lineNumbers: (settings.editor?.lineNumbers !== false ? "on" : "off") as "on" | "off" | "relative" | "interval",
    renderWhitespace: "selection" as const,
    automaticLayout: true,
    scrollBeyondLastLine: false,
    wordWrap: (settings.editor?.wordWrap ? "on" : "off") as "on" | "off" | "wordWrapColumn" | "bounded",
    folding: true,
    foldingStrategy: "indentation" as const,
    showFoldingControls: "always" as const,
    bracketPairColorization: { enabled: true },
    guides: {
      indentation: true,
      bracketPairs: true,
      bracketPairsHorizontal: true,
    },
    suggest: {
      showKeywords: true,
      showSnippets: true,
    },
    quickSuggestions: {
      other: true,
      comments: false,
      strings: false,
    },
    parameterHints: { enabled: true },
    hover: { enabled: true },
    contextmenu: true,
    mouseWheelZoom: true,
    cursorBlinking: "smooth" as const,
    cursorSmoothCaretAnimation: "on" as const,
    smoothScrolling: true,
    multiCursorModifier: "ctrlCmd" as const,
    formatOnPaste: true,
    formatOnType: true,
    tabSize: settings.editor?.tabSize || 4,
    readOnly: isReadOnly,
  };

  return (
    <div className={classNames(styles.container, className)}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.title}>
            <FileText className={styles.fileIcon} size={16} />
            {title}
            {isReadOnly && <Lock className={styles.readOnlyIcon} size={12} />}
          </div>
          {renderBreadcrumb()}
        </div>
        <div className={styles.headerRight}>
          {/* Execution Controls */}
          {(onRun || onCompile) && (
            <div className={styles.executionControls}>
              {onRun && (
                <button
                  className={classNames(styles.executionButton, styles.runButton)}
                  onClick={onRun}
                  disabled={isRunning}
                  title="Run Code (F5)"
                >
                  {isRunning ? (
                    <Loader2 className={classNames(styles.buttonIcon, "animate-spin")} size={14} />
                  ) : (
                    <Play className={styles.buttonIcon} size={14} />
                  )}
                  Run
                </button>
              )}
              {onCompile && (
                <button
                  className={classNames(styles.executionButton, styles.compileButton)}
                  onClick={onCompile}
                  disabled={isRunning}
                  title="Compile Code"
                >
                  <Code className={styles.buttonIcon} size={14} />
                  Compile
                </button>
              )}
            </div>
          )}

          <span className={styles.languageTag}>{language}</span>
          <button
            className={classNames(styles.headerButton, showFind && styles.headerButtonActive)}
            onClick={() => setShowFind(!showFind)}
            title="Find (Ctrl+F)"
          >
            <Search size={16} />
          </button>
          <Link to="/settings" className={styles.headerButton} title="Settings">
            <Settings size={16} />
          </Link>
          {onToggleFullscreen && (
            <button
              className={styles.headerButton}
              onClick={onToggleFullscreen}
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            >
              {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
          )}
        </div>
      </div>

      <div className={styles.editorArea}>
        {!isEditorReady && (
          <div className={styles.loadingOverlay}>
            <Loader2 className={styles.loadingSpinner} size={24} />
          </div>
        )}

        <Editor
          className={styles.monacoEditor}
          value={value}
          onChange={handleEditorChange}
          beforeMount={handleEditorWillMount}
          onMount={handleEditorDidMount}
          language="simba"
          theme={settings.editor?.theme || "vs-dark"}
          options={editorOptions}
          loading={
            <div className={styles.loadingOverlay}>
              <Loader2 className={styles.loadingSpinner} size={24} />
            </div>
          }
        />

        {showFind && (
          <div className={styles.findWidget}>
            <input
              className={styles.findInput}
              type="text"
              placeholder="Find"
              value={findText}
              onChange={(e) => setFindText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleFind();
                } else if (e.key === "Escape") {
                  setShowFind(false);
                }
              }}
              autoFocus
            />
            <input
              className={styles.findInput}
              type="text"
              placeholder="Replace"
              value={replaceText}
              onChange={(e) => setReplaceText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleReplace();
                }
              }}
              disabled={isReadOnly}
            />
            <div className={styles.findActions}>
              <button className={styles.findButton} onClick={handleFind}>
                Find
              </button>
              <button className={styles.findButton} onClick={handleReplace} disabled={isReadOnly}>
                Replace
              </button>
              <button className={styles.findButton} onClick={handleReplaceAll} disabled={isReadOnly}>
                Replace All
              </button>
              <button className={styles.findButton} onClick={() => setShowFind(false)}>
                Close
              </button>
            </div>
          </div>
        )}
      </div>

      <div className={styles.statusBar}>
        <div className={styles.statusLeft}>
          <div className={styles.statusItem}>
            <CheckCircle className={styles.successIndicator} size={12} />
            SimBa
          </div>
          {isReadOnly && (
            <div className={styles.statusItem}>
              <Lock size={12} />
              Read-only
            </div>
          )}
          <div className={styles.statusItem}>
            Ln {cursorPosition.line}, Col {cursorPosition.column}
          </div>
          {selectionInfo && <div className={styles.statusItem}>{selectionInfo}</div>}
        </div>
        <div className={styles.statusRight}>
          <div className={styles.statusItem}>
            {editorStats.lines} lines, {editorStats.chars} chars
          </div>
          <div className={styles.statusItem}>UTF-8</div>
          <div className={styles.statusItem}>Spaces: {settings.editor?.tabSize || 4}</div>
        </div>
      </div>
    </div>
  );
}
