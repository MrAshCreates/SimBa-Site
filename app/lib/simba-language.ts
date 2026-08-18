export type DiagnosticSeverity = "error" | "warning" | "info";

export interface SimbaDiagnostic {
  line: number;
  column: number;
  endColumn: number;
  message: string;
  severity: DiagnosticSeverity;
}

export interface SimbaCompletion {
  label: string;
  detail: string;
  insertText: string;
  kind: "keyword" | "function" | "snippet" | "variable";
}

export const ASSIGNMENT_HELP = {
  simba: "count: int = 5",
  python: "count = 5",
  rust: "let count: i64 = 5;",
};

const TYPE_NAMES = new Set(["int", "i64", "i32", "u64", "str", "bool", "String", "float"]);

export function analyzeSimba(code: string): SimbaDiagnostic[] {
  const diagnostics: SimbaDiagnostic[] = [];
  const lines = code.split(/\n/);

  lines.forEach((line, index) => {
    const lineNumber = index + 1;
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || trimmed.startsWith("//")) {
      return;
    }
    if (trimmed.startsWith("$python") || trimmed.startsWith("$rust") || trimmed.endsWith("python$") || trimmed.endsWith("rust$")) {
      return;
    }

    const cStyle = trimmed.match(/^(int|i64|i32|str|bool)\s+([A-Za-z_][A-Za-z0-9_]*)\s*=/);
    if (cStyle) {
      diagnostics.push({
        line: lineNumber,
        column: 1,
        endColumn: line.length + 1,
        severity: "error",
        message: `C-style \`${cStyle[1]} ${cStyle[2]} = ...\` is not SimBa. Use \`${ASSIGNMENT_HELP.simba}\` (SimBa), \`${ASSIGNMENT_HELP.python}\` (Python), or \`${ASSIGNMENT_HELP.rust}\` (Rust).`,
      });
    }

    if (/:=\s*/.test(trimmed)) {
      diagnostics.push({
        line: lineNumber,
        column: Math.max(1, line.indexOf(":=") + 1),
        endColumn: line.indexOf(":=") + 3,
        severity: "error",
        message: "`:=` is not SimBa. Assign with `name = value` or `name: int = value`.",
      });
    }

    if (/^(if|elif|else if|while|for)\b.*:\s*$/.test(trimmed) || /:\s*(#.*)?$/.test(trimmed) && /^(if|elif|while|for|def|else)\b/.test(trimmed)) {
      diagnostics.push({
        line: lineNumber,
        column: Math.max(1, line.lastIndexOf(":") + 1),
        endColumn: line.lastIndexOf(":") + 2,
        severity: "error",
        message: "Python colons are not used in SimBa. Use braces: `if cond { ... }`.",
      });
    }

    if (/^fn\s+/.test(trimmed)) {
      diagnostics.push({
        line: lineNumber,
        column: 1,
        endColumn: 3,
        severity: "error",
        message: "Rust `fn` is only valid inside `$rust` ... `rust$`. In SimBa write `def name() { ... }`.",
      });
    }

    const parts = trimmed.split(/\s+/);
    if (parts.length >= 2 && TYPE_NAMES.has(parts[0]) && /^[A-Za-z_]/.test(parts[1]) && !parts[1].includes("(") && !trimmed.includes("=") && !trimmed.includes(":")) {
      diagnostics.push({
        line: lineNumber,
        column: 1,
        endColumn: line.length + 1,
        severity: "warning",
        message: `Declare integers as \`${ASSIGNMENT_HELP.simba}\`, not \`${parts[0]} ${parts[1]}\`.`,
      });
    }
  });

  const openBraces = (code.match(/{/g) || []).length;
  const closeBraces = (code.match(/}/g) || []).length;
  if (openBraces !== closeBraces) {
    diagnostics.push({
      line: lines.length,
      column: 1,
      endColumn: (lines[lines.length - 1] || "").length + 1,
      severity: "error",
      message: `Unbalanced braces: ${openBraces} \`{\` and ${closeBraces} \`}\`. Every if/while/for/def block needs matching braces.`,
    });
  }

  return diagnostics;
}

export function simbaCompletions(lineUntilCursor: string): SimbaCompletion[] {
  const items: SimbaCompletion[] = [
    { label: "print", kind: "function", detail: "Print a value", insertText: "print($1)" },
    { label: "def", kind: "snippet", detail: "Define a function", insertText: "def ${1:name}(${2:args}) {\n    $0\n}" },
    { label: "if", kind: "snippet", detail: "If block", insertText: "if ${1:condition} {\n    $0\n}" },
    { label: "elif", kind: "keyword", detail: "Else-if branch", insertText: "elif ${1:condition} {\n    $0\n}" },
    { label: "else", kind: "snippet", detail: "Else block", insertText: "else {\n    $0\n}" },
    { label: "while", kind: "snippet", detail: "While loop", insertText: "while ${1:condition} {\n    $0\n}" },
    { label: "for", kind: "snippet", detail: "For range loop", insertText: "for ${1:i} in range(${2:10}) {\n    $0\n}" },
    { label: "return", kind: "keyword", detail: "Return a value", insertText: "return ${1:0}" },
    { label: "let", kind: "snippet", detail: "Rust-style integer", insertText: "let ${1:count}: int = ${2:0}" },
    { label: "int assignment", kind: "snippet", detail: ASSIGNMENT_HELP.simba, insertText: "${1:count}: int = ${2:0}" },
    { label: "python assignment", kind: "snippet", detail: ASSIGNMENT_HELP.python, insertText: "${1:count} = ${2:0}" },
    { label: "rust assignment", kind: "snippet", detail: ASSIGNMENT_HELP.rust, insertText: "let ${1:count}: int = ${2:0}" },
    { label: "range", kind: "function", detail: "for i in range(n)", insertText: "range($1)" },
    { label: "str", kind: "function", detail: "Convert to string", insertText: "str($1)" },
    { label: "int", kind: "function", detail: "Convert to integer", insertText: "int($1)" },
    { label: "len", kind: "function", detail: "String length", insertText: "len($1)" },
    { label: "abs", kind: "function", detail: "Absolute value", insertText: "abs($1)" },
    { label: "min", kind: "function", detail: "Minimum", insertText: "min($1, $2)" },
    { label: "max", kind: "function", detail: "Maximum", insertText: "max($1, $2)" },
    { label: "clock", kind: "function", detail: "Milliseconds timestamp", insertText: "clock()" },
    { label: "True", kind: "keyword", detail: "Boolean true", insertText: "True" },
    { label: "False", kind: "keyword", detail: "Boolean false", insertText: "False" },
    { label: "$python", kind: "snippet", detail: "Embedded Python", insertText: "$python\n$0\npython$" },
    { label: "$rust", kind: "snippet", detail: "Embedded Rust", insertText: "$rust\nfn main() {\n    $0\n}\nrust$" },
  ];

  const prefix = lineUntilCursor.trim();
  if (!prefix) {
    return items;
  }
  return items.filter((item) => item.label.toLowerCase().startsWith(prefix.split(/\s+/).pop()?.toLowerCase() ?? prefix.toLowerCase()) || item.label.toLowerCase().includes(prefix.toLowerCase()));
}

export function hoverHelp(word: string): string | null {
  const docs: Record<string, string> = {
    print: "print(value)\nWrite a value to output.",
    def: "def name(args) { ... }\nDefine a function. SimBa uses braces, not indentation.",
    let: `Rust-style binding.\nSimBa: ${ASSIGNMENT_HELP.simba}\nPython: ${ASSIGNMENT_HELP.python}\nRust: ${ASSIGNMENT_HELP.rust}`,
    int: "Integer type or converter.\nAssign with `count: int = 5` or convert with int(value).",
    range: "for i in range(n) { ... }\nor range(start, end). Exclusive end, like Python.",
    clock: "clock() -> int milliseconds since epoch. Use for timing.",
    True: "Boolean true. Also accepted: true",
    False: "Boolean false. Also accepted: false",
  };
  return docs[word] ?? null;
}
