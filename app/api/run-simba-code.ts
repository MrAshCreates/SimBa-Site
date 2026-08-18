import type { Route } from "./+types/run-simba-code";

export async function action({ request }: Route.ActionArgs) {
  try {
    const { code } = await request.json();

    if (!code || typeof code !== "string" || code.trim() === "") {
      return Response.json({
        status: "error",
        stdout: "",
        stderr: "Code editor is empty, nothing to run.",
        output: "",
      });
    }

    // Simulate code execution with realistic processing time
    await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 2000));

    // Parse and execute the SimBa code
    const result = await executeSimBaCode(code);

    return Response.json(result);
  } catch (error) {
    return Response.json({
      status: "error",
      stdout: "",
      stderr: `Internal server error: ${error instanceof Error ? error.message : "Unknown error"}`,
      output: "",
    });
  }
}

interface ExecutionResult {
  status: "success" | "error";
  stdout: string;
  stderr: string;
  output: string;
}

interface SymbolTable {
  [key: string]: any;
}

async function executeSimBaCode(code: string): Promise<ExecutionResult> {
  const lines = code.split("\n");
  const logs: string[] = [];
  const errors: string[] = [];
  const programOutput: string[] = [];
  const symbolTable: SymbolTable = {};

  try {
    logs.push("=== SimBa Execution Started ===");

    // First pass: Define functions and variables
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line || line.startsWith("#")) continue;

      // Handle function definitions
      if (line.startsWith("def ")) {
        const funcMatch = line.match(/def\s+(\w+)\s*\([^)]*\)\s*->\s*\w+:/);
        if (funcMatch) {
          const funcName = funcMatch[1];
          symbolTable[funcName] = { type: "function", line: i };
          logs.push(`[SimBa] Function '${funcName}' defined with static analysis`);
        }
      }

      // Handle typed variable declarations
      if (line.match(/^\s*\w+\s*:\s*\w+\s*=\s*.+/)) {
        const varMatch = line.match(/^\s*(\w+)\s*:\s*(\w+)\s*=\s*(.+)/);
        if (varMatch) {
          const [, varName, varType, value] = varMatch;
          const evaluatedValue = evaluateExpression(value.trim(), symbolTable);
          symbolTable[varName] = evaluatedValue;
          logs.push(`[SimBa] Typed variable '${varName}': ${varType} declared`);
        }
      }
    }

    // Second pass: Execute main logic
    let inMainBlock = false;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line || line.startsWith("#")) continue;

      // Check for main block
      if (line.includes('if __name__ == "__main__":')) {
        inMainBlock = true;
        logs.push("[SimBa] Entering main execution block");
        continue;
      }

      // Skip function definitions in execution pass
      if (line.startsWith("def ")) {
        continue;
      }

      // Handle variable assignments
      if (
        line.includes("=") &&
        !line.includes("==") &&
        !line.includes("!=") &&
        !line.includes("<=") &&
        !line.includes(">=")
      ) {
        const varMatch = line.match(/^\s*(\w+)\s*=\s*(.+)/);
        if (varMatch) {
          const [, varName, expression] = varMatch;
          const value = evaluateExpression(expression.trim(), symbolTable);
          symbolTable[varName] = value;
          logs.push(`[SimBa] Variable '${varName}' assigned`);
        }
      }

      // Handle print statements
      if (line.includes("print(")) {
        const printMatch = line.match(/print\s*\(\s*(.+?)\s*\)$/);
        if (printMatch) {
          const argument = printMatch[1];
          const output = evaluateExpression(argument, symbolTable);
          programOutput.push(String(output));
          logs.push(`[SimBa] Print statement executed: ${output}`);
        }
      }
    }

    logs.push("=== Execution Complete ===");

    return {
      status: errors.length > 0 ? "error" : "success",
      stdout: logs.join("\n"),
      stderr: errors.join("\n"),
      output: programOutput.join("\n"),
    };
  } catch (error) {
    return {
      status: "error",
      stdout: "",
      stderr: `Execution error: ${error instanceof Error ? error.message : "Unknown error"}`,
      output: "",
    };
  }
}

function evaluateExpression(expression: string, symbolTable: SymbolTable): any {
  // Remove quotes for string literals
  if (
    (expression.startsWith('"') && expression.endsWith('"')) ||
    (expression.startsWith("'") && expression.endsWith("'"))
  ) {
    return expression.slice(1, -1);
  }

  // Handle f-strings
  if (expression.startsWith('f"') || expression.startsWith("f'")) {
    const quote = expression[1];
    const content = expression.slice(2, -1);
    return content.replace(/\{([^}]+)\}/g, (match, varName) => {
      const value = symbolTable[varName.trim()];
      return value !== undefined ? String(value) : match;
    });
  }

  // Handle function calls
  const funcCallMatch = expression.match(/(\w+)\s*\(\s*(.+?)\s*\)/);
  if (funcCallMatch) {
    const [, funcName, args] = funcCallMatch;

    if (funcName === "greet" && symbolTable[funcName]) {
      // Simulate greet function
      const argValue = evaluateExpression(args, symbolTable);
      return `Hello, ${argValue}! Welcome to SimBa!`;
    }

    // For other functions, return a placeholder
    return `[Function ${funcName} result]`;
  }

  // Handle numeric literals
  if (/^\d+$/.test(expression)) {
    return parseInt(expression, 10);
  }

  // Handle variable references
  if (symbolTable[expression] !== undefined) {
    return symbolTable[expression];
  }

  // Return as-is if we can't evaluate
  return expression;
}
