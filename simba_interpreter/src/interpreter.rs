use std::collections::HashMap;
use crate::{Stmt, Expr, Token, Value};
use crate::embed;

const MAX_STEPS: u32 = 12_000_000;
const MAX_DEBUG_LINES: u32 = 250;
const MAX_OUTPUT: usize = 100_000;

#[derive(Clone)]
struct FunctionDef {
    parameters: Vec<String>,
    body: Vec<Stmt>,
}

enum ExecResult {
    Normal,
    Return(Value),
    Break,
    Continue,
}

pub struct Interpreter {
    pub globals: HashMap<String, Value>,
    functions: HashMap<String, FunctionDef>,
    debug: bool,
    output: String,
    steps: u32,
    debug_logs: u32,
}

impl Interpreter {
    pub fn new() -> Self {
        Interpreter {
            globals: HashMap::new(),
            functions: HashMap::new(),
            debug: false,
            output: String::new(),
            steps: 0,
            debug_logs: 0,
        }
    }

    pub fn set_debug(&mut self, debug: bool) {
        self.debug = debug;
    }

    pub fn take_output(&mut self) -> String {
        std::mem::take(&mut self.output)
    }

    fn emit(&mut self, text: &str) {
        if self.output.len() >= MAX_OUTPUT {
            return;
        }
        let remaining = MAX_OUTPUT - self.output.len();
        let slice = if text.len() > remaining {
            &text[..remaining]
        } else {
            text
        };
        self.output.push_str(slice);
    }

    fn emit_line(&mut self, text: &str) {
        self.emit(text);
        if !text.ends_with('\n') {
            self.emit("\n");
        }
    }

    fn tick(&mut self) -> Result<(), String> {
        self.steps = self.steps.saturating_add(1);
        if self.steps > MAX_STEPS {
            Err("Program ran too long (step limit). Check for an infinite loop.".to_string())
        } else {
            Ok(())
        }
    }

    pub fn interpret(&mut self, statements: &[Stmt]) -> Result<(), String> {
        match self.execute_block(statements)? {
            ExecResult::Break => Err("`break` used outside of a loop".to_string()),
            ExecResult::Continue => Err("`continue` used outside of a loop".to_string()),
            ExecResult::Return(_) | ExecResult::Normal => Ok(()),
        }
    }

    fn debug_log(&mut self, message: &str) {
        if !self.debug {
            return;
        }
        self.debug_logs = self.debug_logs.saturating_add(1);
        if self.debug_logs > MAX_DEBUG_LINES {
            if self.debug_logs == MAX_DEBUG_LINES + 1 {
                self.emit_line("[debug] further debug output omitted");
            }
            return;
        }
        self.emit_line(&format!("[debug] {message}"));
    }

    fn execute(&mut self, stmt: &Stmt) -> Result<ExecResult, String> {
        self.tick()?;
        match stmt {
            Stmt::Print(expr) => {
                let value = self.evaluate(expr)?;
                self.debug_log(&format!("print {value}"));
                self.emit_line(&value.to_string());
            }
            Stmt::VarDecl(name, expr) | Stmt::Assignment(name, expr) => {
                let value = self.evaluate(expr)?;
                self.debug_log(&format!("{name} = {value}"));
                self.globals.insert(name.clone(), value);
            }
            Stmt::Block(statements) => {
                return self.execute_block(statements);
            }
            Stmt::If {
                condition,
                then_branch,
                else_branch,
            } => {
                let condition_value = self.evaluate(condition)?;
                self.debug_log(&format!("if {condition_value}"));
                if self.is_truthy(&condition_value) {
                    return self.execute_block(then_branch);
                } else if let Some(else_branch) = else_branch {
                    return self.execute_block(else_branch);
                }
            }
            Stmt::While { condition, body } => {
                loop {
                    self.tick()?;
                    let condition_value = self.evaluate(condition)?;
                    if !self.is_truthy(&condition_value) {
                        break;
                    }
                    match self.execute_block(body)? {
                        ExecResult::Return(value) => return Ok(ExecResult::Return(value)),
                        ExecResult::Break => break,
                        ExecResult::Continue | ExecResult::Normal => {}
                    }
                }
            }
            Stmt::For {
                variable,
                iterable,
                body,
            } => {
                let (start, end) = self.iterate_bounds(iterable)?;
                self.debug_log(&format!("for {variable} in {start}..{end}"));
                let mut i = start;
                while i < end {
                    self.tick()?;
                    self.globals.insert(variable.clone(), Value::Integer(i));
                    match self.execute_block(body)? {
                        ExecResult::Return(value) => return Ok(ExecResult::Return(value)),
                        ExecResult::Break => break,
                        ExecResult::Continue | ExecResult::Normal => {}
                    }
                    i += 1;
                }
            }
            Stmt::Function {
                name,
                parameters,
                body,
            } => {
                self.debug_log(&format!("def {name}"));
                self.functions.insert(
                    name.clone(),
                    FunctionDef {
                        parameters: parameters.clone(),
                        body: body.clone(),
                    },
                );
            }
            Stmt::Return(expr) => {
                let value = self.evaluate(expr)?;
                self.debug_log(&format!("return {value}"));
                return Ok(ExecResult::Return(value));
            }
            Stmt::Break => return Ok(ExecResult::Break),
            Stmt::Continue => return Ok(ExecResult::Continue),
            Stmt::Pass => {}
            Stmt::Expr(expr) => {
                self.evaluate(expr)?;
            }
            Stmt::RustBlock(code) => {
                self.debug_log("running embedded Rust");
                let output = embed::run_rust(code)?;
                if !output.is_empty() {
                    self.emit_line(&output);
                }
            }
            Stmt::PythonBlock(code) => {
                self.debug_log("running embedded Python");
                let output = embed::run_python(code)?;
                if !output.is_empty() {
                    self.emit_line(&output);
                }
            }
        }
        Ok(ExecResult::Normal)
    }

    fn clock_value(&self) -> i64 {
        #[cfg(target_arch = "wasm32")]
        {
            self.steps as i64 / 8
        }
        #[cfg(not(target_arch = "wasm32"))]
        {
            unix_millis()
        }
    }

    fn range_bounds(&mut self, arguments: &[Expr]) -> Result<(i64, i64), String> {
        let values = arguments
            .iter()
            .map(|arg| self.expect_int(arg))
            .collect::<Result<Vec<_>, _>>()?;
        match values.as_slice() {
            [end] => Ok((0, *end)),
            [start, end] => Ok((*start, *end)),
            _ => Err("range() takes 1 or 2 integer arguments".to_string()),
        }
    }

    fn iterate_bounds(&mut self, iterable: &Expr) -> Result<(i64, i64), String> {
        if let Expr::Call { callee, arguments } = iterable {
            if callee == "range" {
                return self.range_bounds(arguments);
            }
        }

        match self.evaluate(iterable)? {
            Value::Integer(n) => Ok((0, n)),
            other => Err(format!(
                "`for` needs `range(n)` or an integer, got {other}. Example: `for i in range(10): print(i)`"
            )),
        }
    }

    fn expect_int(&mut self, expr: &Expr) -> Result<i64, String> {
        match self.evaluate(expr)? {
            Value::Integer(n) => Ok(n),
            Value::Bool(b) => Ok(b as i64),
            other => Err(format!("Expected an integer, got {other}")),
        }
    }

    fn evaluate(&mut self, expr: &Expr) -> Result<Value, String> {
        match expr {
            Expr::Integer(value) => Ok(Value::Integer(*value)),
            Expr::Bool(value) => Ok(Value::Bool(*value)),
            Expr::String(value) => Ok(Value::String(value.clone())),
            Expr::Identifier(name) => {
                if name == "__name__" {
                    Ok(Value::String("__main__".to_string()))
                } else {
                    self.globals
                        .get(name)
                        .cloned()
                        .ok_or_else(|| format!("Undefined variable `{name}`. Assign it first: `{name} = 0`."))
                }
            }
            Expr::Unary { operator, operand } => {
                let value = self.evaluate(operand)?;
                match (operator, value) {
                    (Token::Minus, Value::Integer(n)) => Ok(Value::Integer(-n)),
                    (Token::Not, value) => Ok(Value::Bool(!self.is_truthy(&value))),
                    _ => Err("Invalid unary operation".to_string()),
                }
            }
            Expr::Binary {
                left,
                operator,
                right,
            } => {
                if matches!(operator, Token::And | Token::Or) {
                    let left_val = self.evaluate(left)?;
                    return match operator {
                        Token::Or if self.is_truthy(&left_val) => Ok(left_val),
                        Token::And if !self.is_truthy(&left_val) => Ok(left_val),
                        _ => self.evaluate(right),
                    };
                }
                let left_val = self.evaluate(left)?;
                let right_val = self.evaluate(right)?;
                self.apply_operator(operator, left_val, right_val)
            }
            Expr::Call { callee, arguments } => self.call_function(callee, arguments),
        }
    }

    fn call_function(&mut self, name: &str, arguments: &[Expr]) -> Result<Value, String> {
        match name {
            "clock" | "time.perf_counter" => {
                self.require_arity(name, arguments, 0)?;
                return Ok(Value::Integer(self.clock_value()));
            }
            "str" => {
                self.require_arity(name, arguments, 1)?;
                return Ok(Value::String(self.evaluate(&arguments[0])?.to_string()));
            }
            "int" => {
                self.require_arity(name, arguments, 1)?;
                return match self.evaluate(&arguments[0])? {
                    Value::Integer(n) => Ok(Value::Integer(n)),
                    Value::Bool(b) => Ok(Value::Integer(b as i64)),
                    Value::String(s) => s
                        .parse::<i64>()
                        .map(Value::Integer)
                        .map_err(|_| format!("Cannot convert `{s}` to int")),
                    other => Err(format!("Cannot convert {other} to int")),
                };
            }
            "bool" => {
                self.require_arity(name, arguments, 1)?;
                let value = self.evaluate(&arguments[0])?;
                return Ok(Value::Bool(self.is_truthy(&value)));
            }
            "abs" => {
                self.require_arity(name, arguments, 1)?;
                return Ok(Value::Integer(self.expect_int(&arguments[0])?.abs()));
            }
            "len" => {
                self.require_arity(name, arguments, 1)?;
                return match self.evaluate(&arguments[0])? {
                    Value::String(s) => Ok(Value::Integer(s.chars().count() as i64)),
                    other => Err(format!("len() expects a string, got {other}")),
                };
            }
            "min" | "max" => {
                if arguments.len() < 2 {
                    return Err(format!("{name}() takes at least 2 arguments"));
                }
                let mut best = self.expect_int(&arguments[0])?;
                for arg in &arguments[1..] {
                    let n = self.expect_int(arg)?;
                    if name == "min" {
                        best = best.min(n);
                    } else {
                        best = best.max(n);
                    }
                }
                return Ok(Value::Integer(best));
            }
            "sum" => {
                self.require_arity(name, arguments, 1)?;
                if let Expr::Call { callee, arguments: range_args } = &arguments[0] {
                    if callee == "range" {
                        let (start, end) = self.range_bounds(range_args)?;
                        let count = end.saturating_sub(start);
                        return Ok(Value::Integer(count.saturating_mul(start + end - 1) / 2));
                    }
                }
                return Err("sum() currently supports `sum(range(n))`".to_string());
            }
            "range" => {
                return Err("`range()` is used in `for i in range(n):` or `sum(range(n))`.".to_string());
            }
            _ => {}
        }

        let FunctionDef {
            parameters,
            body,
        } = self
            .functions
            .get(name)
            .ok_or_else(|| format!("Undefined function `{name}`"))?
            .clone();

        if arguments.len() != parameters.len() {
            return Err(format!(
                "Function `{name}` expected {} arguments, got {}",
                parameters.len(),
                arguments.len()
            ));
        }

        let saved_globals = self.globals.clone();
        for (param, arg_expr) in parameters.iter().zip(arguments.iter()) {
            let arg_value = self.evaluate(arg_expr)?;
            self.globals.insert(param.clone(), arg_value);
        }

        let result = match self.execute_block(&body)? {
            ExecResult::Return(value) => value,
            ExecResult::Break => return Err("`break` used outside of a loop".to_string()),
            ExecResult::Continue => return Err("`continue` used outside of a loop".to_string()),
            ExecResult::Normal => Value::Integer(0),
        };
        self.globals = saved_globals;
        Ok(result)
    }

    fn require_arity(&self, name: &str, arguments: &[Expr], count: usize) -> Result<(), String> {
        if arguments.len() != count {
            Err(format!("{name}() takes {count} argument(s)"))
        } else {
            Ok(())
        }
    }

    fn apply_operator(&self, operator: &Token, left: Value, right: Value) -> Result<Value, String> {
        match (operator, left, right) {
            (Token::Plus, Value::Integer(a), Value::Integer(b)) => Ok(Value::Integer(a + b)),
            (Token::Minus, Value::Integer(a), Value::Integer(b)) => Ok(Value::Integer(a - b)),
            (Token::Asterisk, Value::Integer(a), Value::Integer(b)) => Ok(Value::Integer(a * b)),
            (Token::Slash, Value::Integer(a), Value::Integer(b)) => {
                if b != 0 {
                    Ok(Value::Integer(a / b))
                } else {
                    Err("Division by zero".to_string())
                }
            }
            (Token::Percent, Value::Integer(a), Value::Integer(b)) => {
                if b != 0 {
                    Ok(Value::Integer(a % b))
                } else {
                    Err("Division by zero".to_string())
                }
            }
            (Token::Plus, Value::String(a), Value::String(b)) => Ok(Value::String(a + &b)),
            (Token::Plus, Value::String(a), Value::Integer(b)) => Ok(Value::String(a + &b.to_string())),
            (Token::Plus, Value::Integer(a), Value::String(b)) => Ok(Value::String(a.to_string() + &b)),
            (Token::Plus, Value::String(a), Value::Bool(b)) => Ok(Value::String(a + if b { "True" } else { "False" })),
            (Token::Equals, left, right) => Ok(Value::Bool(self.values_equal(&left, &right))),
            (Token::NotEqual, left, right) => Ok(Value::Bool(!self.values_equal(&left, &right))),
            (Token::LessThan, Value::Integer(a), Value::Integer(b)) => Ok(Value::Bool(a < b)),
            (Token::GreaterThan, Value::Integer(a), Value::Integer(b)) => Ok(Value::Bool(a > b)),
            (Token::LessEqual, Value::Integer(a), Value::Integer(b)) => Ok(Value::Bool(a <= b)),
            (Token::GreaterEqual, Value::Integer(a), Value::Integer(b)) => Ok(Value::Bool(a >= b)),
            (op, left, right) => Err(format!(
                "Type error: cannot use {op:?} with {left} and {right}"
            )),
        }
    }

    fn values_equal(&self, left: &Value, right: &Value) -> bool {
        match (left, right) {
            (Value::Integer(a), Value::Integer(b)) => a == b,
            (Value::Bool(a), Value::Bool(b)) => a == b,
            (Value::Integer(a), Value::Bool(b)) => *a == *b as i64,
            (Value::Bool(a), Value::Integer(b)) => *a as i64 == *b,
            (Value::String(a), Value::String(b)) => a == b,
            _ => false,
        }
    }

    fn is_truthy(&self, value: &Value) -> bool {
        match value {
            Value::Integer(n) => *n != 0,
            Value::Bool(b) => *b,
            Value::String(s) => !s.is_empty(),
            _ => true,
        }
    }

    fn execute_block(&mut self, statements: &[Stmt]) -> Result<ExecResult, String> {
        for statement in statements {
            match self.execute(statement)? {
                ExecResult::Normal => {}
                other => return Ok(other),
            }
        }
        Ok(ExecResult::Normal)
    }
}

fn unix_millis() -> i64 {
    #[cfg(target_arch = "wasm32")]
    {
        js_sys::Date::now() as i64
    }
    #[cfg(not(target_arch = "wasm32"))]
    {
        use std::time::{SystemTime, UNIX_EPOCH};
        SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .map(|d| d.as_millis() as i64)
            .unwrap_or(0)
    }
}
