use std::collections::VecDeque;

use crate::interpreter::Interpreter;
use crate::lexer::Token;

#[derive(Clone, Debug)]
struct Tok {
    token: Token,
    line: usize,
}

fn peek(tokens: &VecDeque<Tok>) -> Option<&Token> {
    tokens.front().map(|t| &t.token)
}

fn peek_line(tokens: &VecDeque<Tok>) -> usize {
    tokens.front().map(|t| t.line).unwrap_or(1)
}

fn take(tokens: &mut VecDeque<Tok>) -> Option<Token> {
    tokens.pop_front().map(|t| t.token)
}

fn at(tokens: &VecDeque<Tok>) -> String {
    format!("line {}", peek_line(tokens))
}

fn is_type_name(name: &str) -> bool {
    matches!(
        name,
        "int" | "i64" | "i32" | "u64" | "str" | "bool" | "String" | "float"
    )
}

// `Stmt` and `Expr` are defined in this file, so no need to import them

// Make `Stmt` and `Expr` public so other modules can access them
#[allow(dead_code)]
#[derive(Clone, Debug)]
pub enum Stmt {
    Print(Expr),
    VarDecl(String, Expr),
    Assignment(String, Expr),
    If {
        condition: Expr,
        then_branch: Vec<Stmt>,
        else_branch: Option<Vec<Stmt>>,
    },
    While {
        condition: Expr,
        body: Vec<Stmt>,
    },
    Function {
        name: String,
        parameters: Vec<String>,
        body: Vec<Stmt>,
    },
    Return(Expr),
    For {
        variable: String,
        iterable: Expr,
        body: Vec<Stmt>,
    },
    Break,
    Continue,
    Pass,

    // Add these variants for embedded code blocks
    RustBlock(String),
    PythonBlock(String),
    Expr(Expr),

    // **Added Block variant**
    Block(Vec<Stmt>),
}

#[allow(dead_code)]
#[derive(Clone, Debug)]
pub enum Expr {
    Integer(i64),
    String(String),
    Identifier(String),
    Unary {
        operator: Token,
        operand: Box<Expr>,
    },
    Binary {
        left: Box<Expr>,
        operator: Token,
        right: Box<Expr>,
    },
    Call {
        callee: String,
        arguments: Vec<Expr>,
    },
    Bool(bool),
}

pub fn run_source(source: &str, debug: bool) -> Result<String, String> {
    let tokens = tokenize(source)?;
    let mut tokens: VecDeque<Tok> = tokens.into_iter().collect();
    let ast = parse(&mut tokens, debug)?;
    let mut interpreter = Interpreter::new();
    interpreter.set_debug(debug);
    interpreter.interpret(&ast)?;
    Ok(interpreter.take_output())
}

pub fn compile_source(source: &str) -> Result<(), String> {
    let tokens = tokenize(source)?;
    let mut tokens: VecDeque<Tok> = tokens.into_iter().collect();
    parse(&mut tokens, false)?;
    Ok(())
}

fn parse(tokens: &mut VecDeque<Tok>, debug_mode: bool) -> Result<Vec<Stmt>, String> {
    let mut statements = Vec::new();

    while let Some(_) = tokens.front() {
        match parse_statement(tokens, debug_mode) {
            Ok(stmt) => statements.push(stmt),
            Err(e) => return Err(format!("Parse error on {}: {}", at(tokens), e)),
        }
    }

    Ok(statements)
}

fn parse_statement(
    tokens: &mut VecDeque<Tok>,
    debug_mode: bool,
) -> Result<Stmt, String> {
    match peek(tokens).cloned() {
        Some(Token::Print) => parse_print_statement(tokens, debug_mode),
        Some(Token::Let) => parse_var_decl(tokens, debug_mode),
        Some(Token::If) => parse_if_statement(tokens, debug_mode),
        Some(Token::While) => parse_while_statement(tokens, debug_mode),
        Some(Token::For) => parse_for_statement(tokens, debug_mode),
        Some(Token::Func) => parse_function(tokens, debug_mode),
        Some(Token::Return) => parse_return_statement(tokens, debug_mode),
        Some(Token::Break) => {
            take(tokens);
            expect_semicolon(tokens);
            Ok(Stmt::Break)
        }
        Some(Token::Continue) => {
            take(tokens);
            expect_semicolon(tokens);
            Ok(Stmt::Continue)
        }
        Some(Token::Pass) => {
            take(tokens);
            expect_semicolon(tokens);
            Ok(Stmt::Pass)
        }
        Some(Token::LeftBrace) => {
            let block = parse_block(tokens, debug_mode)?;
            Ok(Stmt::Block(block))
        }
        Some(Token::Identifier(_)) => parse_assignment_or_expression(tokens, debug_mode),
        Some(Token::RustCode(code)) => {
            take(tokens);
            Ok(Stmt::RustBlock(code))
        }
        Some(Token::PythonCode(code)) => {
            take(tokens);
            Ok(Stmt::PythonBlock(code))
        }
        Some(token) => Err(format!(
            "Unexpected `{:?}` on {}. SimBa statements are assignments, print(), if/while/for, def, or $python/$rust embeds.",
            token,
            at(tokens)
        )),
        None => Err("Unexpected end of input".to_string()),
    }
}

fn parse_print_statement(
    tokens: &mut VecDeque<Tok>,
    debug_mode: bool,
) -> Result<Stmt, String> {
    take(tokens);
    let expr = parse_expression(tokens, debug_mode)?;
    expect_semicolon(tokens);
    Ok(Stmt::Print(expr))
}

fn skip_optional_type(tokens: &mut VecDeque<Tok>) -> Result<(), String> {
    if matches!(peek(tokens), Some(Token::Colon)) {
        take(tokens);
        match take(tokens) {
            Some(Token::Identifier(_)) => Ok(()),
            other => Err(format!(
                "Expected a type name after `:`, found {:?}. Try `x: int = 5`.",
                other
            )),
        }
    } else {
        Ok(())
    }
}

fn parse_var_decl(
    tokens: &mut VecDeque<Tok>,
    debug_mode: bool,
) -> Result<Stmt, String> {
    take(tokens); // let
    if matches!(peek(tokens), Some(Token::Mut)) {
        take(tokens);
    }
    let var_name = if let Some(Token::Identifier(name)) = take(tokens) {
        name
    } else {
        return Err("Expected variable name after `let`. SimBa: `let x = 5` or `let x: int = 5`. Rust: `let x: i64 = 5`. Python: `x = 5`.".to_string());
    };
    skip_optional_type(tokens)?;
    expect_token(tokens, Token::Equal)?;
    let expr = parse_expression(tokens, debug_mode)?;
    expect_semicolon(tokens);
    Ok(Stmt::VarDecl(var_name, expr))
}

fn parse_assignment(
    tokens: &mut VecDeque<Tok>,
    debug_mode: bool,
) -> Result<Stmt, String> {
    let var_name = if let Some(Token::Identifier(name)) = take(tokens) {
        name
    } else {
        return Err("Expected variable name for assignment. SimBa/Python: `x = 5`. Rust: `let x = 5`.".to_string());
    };
    skip_optional_type(tokens)?;

    match peek(tokens).cloned() {
        Some(Token::Equal) => {
            take(tokens);
            let expr = parse_expression(tokens, debug_mode)?;
            expect_semicolon(tokens);
            Ok(Stmt::Assignment(var_name.clone(), expr))
        }
        Some(Token::PlusEqual) | Some(Token::MinusEqual) | Some(Token::StarEqual) => {
            let op = take(tokens).unwrap();
            let right = parse_expression(tokens, debug_mode)?;
            expect_semicolon(tokens);
            let operator = match op {
                Token::PlusEqual => Token::Plus,
                Token::MinusEqual => Token::Minus,
                Token::StarEqual => Token::Asterisk,
                other => other,
            };
            Ok(Stmt::Assignment(
                var_name.clone(),
                Expr::Binary {
                    left: Box::new(Expr::Identifier(var_name)),
                    operator,
                    right: Box::new(right),
                },
            ))
        }
        found => Err(format!(
            "Expected `=` after `{}`, found {:?}. Integer assignment: SimBa/Python `{} = 5`, Rust `let {}: i64 = 5;`.",
            var_name,
            found,
            var_name,
            var_name
        )),
    }
}

// Define operator precedences
// const LOWEST_PRECEDENCE: u8 = 0; // Removed

fn parse_expression(tokens: &mut VecDeque<Tok>, debug_mode: bool) -> Result<Expr, String> {
    parse_or(tokens, debug_mode)
}

fn parse_or(tokens: &mut VecDeque<Tok>, debug_mode: bool) -> Result<Expr, String> {
    let mut expr = parse_and(tokens, debug_mode)?;
    while matches!(peek(tokens), Some(Token::Or)) {
        let operator = take(tokens).unwrap();
        let right = parse_and(tokens, debug_mode)?;
        expr = Expr::Binary {
            left: Box::new(expr),
            operator,
            right: Box::new(right),
        };
    }
    Ok(expr)
}

fn parse_and(tokens: &mut VecDeque<Tok>, debug_mode: bool) -> Result<Expr, String> {
    let mut expr = parse_comparison(tokens, debug_mode)?;
    while matches!(peek(tokens), Some(Token::And)) {
        let operator = take(tokens).unwrap();
        let right = parse_comparison(tokens, debug_mode)?;
        expr = Expr::Binary {
            left: Box::new(expr),
            operator,
            right: Box::new(right),
        };
    }
    Ok(expr)
}

fn parse_comparison(
    tokens: &mut VecDeque<Tok>,
    debug_mode: bool,
) -> Result<Expr, String> {
    let mut expr = parse_term(tokens, debug_mode)?;

    while matches!(
        peek(tokens),
        Some(Token::Equals | Token::NotEqual | Token::LessThan | Token::GreaterThan | Token::LessEqual | Token::GreaterEqual)
    ) {
        let operator = take(tokens).unwrap();
        let right = parse_term(tokens, debug_mode)?;
        expr = Expr::Binary {
            left: Box::new(expr),
            operator,
            right: Box::new(right),
        };
    }

    Ok(expr)
}

fn parse_term(
    tokens: &mut VecDeque<Tok>,
    debug_mode: bool,
) -> Result<Expr, String> {
    let mut expr = parse_factor(tokens, debug_mode)?;

    while matches!(peek(tokens), Some(Token::Plus | Token::Minus)) {
        let operator = take(tokens).unwrap();
        let right = parse_factor(tokens, debug_mode)?;
        expr = Expr::Binary {
            left: Box::new(expr),
            operator,
            right: Box::new(right),
        };
    }

    Ok(expr)
}

fn parse_factor(
    tokens: &mut VecDeque<Tok>,
    debug_mode: bool,
) -> Result<Expr, String> {
    let mut expr = parse_unary(tokens, debug_mode)?;

    while matches!(peek(tokens), Some(Token::Asterisk | Token::Slash | Token::Percent)) {
        let operator = take(tokens).unwrap();
        let right = parse_unary(tokens, debug_mode)?;
        expr = Expr::Binary {
            left: Box::new(expr),
            operator,
            right: Box::new(right),
        };
    }

    Ok(expr)
}

fn parse_unary(
    tokens: &mut VecDeque<Tok>,
    debug_mode: bool,
) -> Result<Expr, String> {
    if matches!(peek(tokens), Some(Token::Minus | Token::Not)) {
        let operator = take(tokens).unwrap();
        let operand = parse_unary(tokens, debug_mode)?;
        return Ok(Expr::Unary {
            operator,
            operand: Box::new(operand),
        });
    }

    parse_postfix(tokens, debug_mode)
}

fn parse_postfix(
    tokens: &mut VecDeque<Tok>,
    debug_mode: bool,
) -> Result<Expr, String> {
    let mut expr = parse_primary(tokens, debug_mode)?;

    while matches!(peek(tokens), Some(Token::LeftParen)) {
        take(tokens);

        let mut arguments = Vec::new();
        if peek(tokens) != Some(&Token::RightParen) {
            loop {
                arguments.push(parse_expression(tokens, debug_mode)?);
                if matches!(peek(tokens), Some(Token::Comma)) {
                    take(tokens);
                } else {
                    break;
                }
            }
        }
        expect_token(tokens, Token::RightParen)?;

        match expr {
            Expr::Identifier(name) => {
                expr = Expr::Call {
                    callee: name,
                    arguments,
                };
            }
            _ => return Err("Can only call named functions".to_string()),
        }
    }

    Ok(expr)
}

fn parse_primary(
    tokens: &mut VecDeque<Tok>,
    debug_mode: bool,
) -> Result<Expr, String> {
    match take(tokens) {
        Some(Token::Integer(value)) => Ok(Expr::Integer(value)),
        Some(Token::StringLiteral(value)) => Ok(Expr::String(value)),
        Some(Token::True) => Ok(Expr::Bool(true)),
        Some(Token::False) => Ok(Expr::Bool(false)),
        Some(Token::Identifier(name)) => Ok(Expr::Identifier(name)),
        Some(Token::LeftParen) => {
            let expr = parse_expression(tokens, debug_mode)?;
            expect_token(tokens, Token::RightParen)?;
            Ok(expr)
        }
        Some(token) => Err(format!(
            "Unexpected `{:?}` in expression on {}. Expected a number, string, name, True/False, or `(...)`.",
            token,
            at(tokens)
        )),
        None => Err("Unexpected end of input in expression".to_string()),
    }
}

fn expect_semicolon(tokens: &mut VecDeque<Tok>) {
    if matches!(peek(tokens), Some(Token::Semicolon)) {
        take(tokens);
    }
}

fn expect_token(tokens: &mut VecDeque<Tok>, expected: Token) -> Result<(), String> {
    match take(tokens) {
        Some(token) if token == expected => Ok(()),
        Some(token) => Err(format!(
            "Expected {:?}, found {:?} on {}. Hint: SimBa blocks use `{{ }}`, and `if`/`while`/`for` do not require parentheses.",
            expected,
            token,
            at(tokens)
        )),
        None => Err(format!(
            "Expected {:?}, found end of input on {}",
            expected,
            at(tokens)
        )),
    }
}

fn parse_condition(tokens: &mut VecDeque<Tok>, debug_mode: bool) -> Result<Expr, String> {
    if matches!(peek(tokens), Some(Token::LeftParen)) {
        take(tokens);
        let condition = parse_expression(tokens, debug_mode)?;
        expect_token(tokens, Token::RightParen)?;
        Ok(condition)
    } else {
        parse_expression(tokens, debug_mode)
    }
}

fn tokenize(input: &str) -> Result<Vec<Tok>, String> {
    use logos::Logos;

    let mut lexer = Token::lexer(input);
    let mut tokens = Vec::new();

    while let Some(token_result) = lexer.next() {
        let start = lexer.span().start;
        let line = input[..start].bytes().filter(|b| *b == b'\n').count() + 1;
        match token_result {
            Ok(token) => tokens.push(Tok { token, line }),
            Err(_) => {
                let ch = input[start..].chars().next().unwrap_or('?');
                return Err(format!(
                    "line {}: invalid character `{}`. SimBa comments use `#` or `//`. Strings use double quotes. Embeds use `$python` ... `python$` and `$rust` ... `rust$`.",
                    line, ch
                ));
            }
        }
    }

    Ok(tokens)
}

#[derive(Debug, Clone, PartialEq)]
pub enum Value {
    Integer(i64),
    Bool(bool),
    String(String),
    RustCode(String),
    PythonCode(String),
}

// Implement Display for Value
impl std::fmt::Display for Value {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Value::Integer(v) => write!(f, "{}", v),
            Value::Bool(v) => write!(f, "{}", if *v { "True" } else { "False" }),
            Value::String(s) => write!(f, "{}", s),
            Value::RustCode(code) => write!(f, "{}", code),
            Value::PythonCode(code) => write!(f, "{}", code),
            // ... handle other value types ...
        }
    }
}

fn parse_if_statement(
    tokens: &mut VecDeque<Tok>,
    debug_mode: bool,
) -> Result<Stmt, String> {
    take(tokens);
    let condition = parse_condition(tokens, debug_mode)?;
    if matches!(peek(tokens), Some(Token::Colon)) {
        return Err("Python colons are not used in SimBa. Write `if cond { ... }` with braces.".to_string());
    }
    let then_branch = parse_block(tokens, debug_mode)?;
    let else_branch = parse_else_branch(tokens, debug_mode)?;

    Ok(Stmt::If {
        condition,
        then_branch,
        else_branch,
    })
}

fn parse_else_branch(
    tokens: &mut VecDeque<Tok>,
    debug_mode: bool,
) -> Result<Option<Vec<Stmt>>, String> {
    match peek(tokens) {
        Some(Token::Elif) => {
            take(tokens);
            let condition = parse_condition(tokens, debug_mode)?;
            let then_branch = parse_block(tokens, debug_mode)?;
            let nested_else = parse_else_branch(tokens, debug_mode)?;
            Ok(Some(vec![Stmt::If {
                condition,
                then_branch,
                else_branch: nested_else,
            }]))
        }
        Some(Token::Else) => {
            take(tokens);
            if matches!(peek(tokens), Some(Token::If)) {
                Ok(Some(vec![parse_if_statement(tokens, debug_mode)?]))
            } else {
                Ok(Some(parse_block(tokens, debug_mode)?))
            }
        }
        _ => Ok(None),
    }
}

fn parse_block(
    tokens: &mut VecDeque<Tok>,
    debug_mode: bool,
) -> Result<Vec<Stmt>, String> {
    expect_token(tokens, Token::LeftBrace)?;
    let mut statements = Vec::new();

    while peek(tokens).is_some() {
        if matches!(peek(tokens), Some(Token::RightBrace)) {
            take(tokens);
            return Ok(statements);
        }
        statements.push(parse_statement(tokens, debug_mode)?);
    }

    Err(format!("Expected `}}` at end of block on {}", at(tokens)))
}

fn parse_function(
    tokens: &mut VecDeque<Tok>,
    debug_mode: bool,
) -> Result<Stmt, String> {
    take(tokens);
    let name = if let Some(Token::Identifier(name)) = take(tokens) {
        name
    } else {
        return Err("Expected function name after `def` or `function`".to_string());
    };

    expect_token(tokens, Token::LeftParen)?;
    let mut parameters = Vec::new();
    while let Some(Token::Identifier(param_name)) = peek(tokens).cloned() {
        take(tokens);
        skip_optional_type(tokens)?;
        parameters.push(param_name);
        if matches!(peek(tokens), Some(Token::Comma)) {
            take(tokens);
        } else {
            break;
        }
    }
    expect_token(tokens, Token::RightParen)?;
    let body = parse_block(tokens, debug_mode)?;

    Ok(Stmt::Function {
        name,
        parameters,
        body,
    })
}

fn parse_return_statement(
    tokens: &mut VecDeque<Tok>,
    debug_mode: bool,
) -> Result<Stmt, String> {
    take(tokens);
    if matches!(peek(tokens), Some(Token::Semicolon | Token::RightBrace)) || peek(tokens).is_none() {
        expect_semicolon(tokens);
        return Ok(Stmt::Return(Expr::Integer(0)));
    }
    let expr = parse_expression(tokens, debug_mode)?;
    expect_semicolon(tokens);
    Ok(Stmt::Return(expr))
}

fn parse_while_statement(
    tokens: &mut VecDeque<Tok>,
    debug_mode: bool,
) -> Result<Stmt, String> {
    take(tokens);
    let condition = parse_condition(tokens, debug_mode)?;
    if matches!(peek(tokens), Some(Token::Colon)) {
        return Err("Python colons are not used in SimBa. Write `while cond { ... }` with braces.".to_string());
    }
    let body = parse_block(tokens, debug_mode)?;
    Ok(Stmt::While { condition, body })
}

fn parse_for_statement(
    tokens: &mut VecDeque<Tok>,
    debug_mode: bool,
) -> Result<Stmt, String> {
    take(tokens);
    let variable = if let Some(Token::Identifier(name)) = take(tokens) {
        name
    } else {
        return Err("Expected `for <name> in range(n) { ... }`".to_string());
    };
    if !matches!(peek(tokens), Some(Token::In)) {
        return Err("Expected `in` after the loop variable. Example: `for i in range(10) { print(i) }`".to_string());
    }
    take(tokens);
    let iterable = parse_expression(tokens, debug_mode)?;
    if matches!(peek(tokens), Some(Token::Colon)) {
        return Err("Python colons are not used in SimBa. Write `for i in range(n) { ... }` with braces.".to_string());
    }
    let body = parse_block(tokens, debug_mode)?;
    Ok(Stmt::For {
        variable,
        iterable,
        body,
    })
}

fn parse_assignment_or_expression(
    tokens: &mut VecDeque<Tok>,
    debug_mode: bool,
) -> Result<Stmt, String> {
    if let Some(Token::Identifier(first)) = peek(tokens).cloned() {
        let mut lookahead = tokens.clone();
        take(&mut lookahead);
        match peek(&lookahead).cloned() {
            Some(Token::Equal | Token::Colon | Token::PlusEqual | Token::MinusEqual | Token::StarEqual) => {
                return parse_assignment(tokens, debug_mode);
            }
            Some(Token::Identifier(second)) if is_type_name(&first) => {
                let mut further = lookahead.clone();
                take(&mut further);
                if matches!(peek(&further), Some(Token::Equal | Token::Colon)) {
                    return Err(format!(
                        "C-style declaration `{} {} = ...` is not SimBa. Use Python-style `{} = 5`, typed SimBa `{}: int = 5`, or Rust-style `let {}: i64 = 5`.",
                        first, second, second, second, second
                    ));
                }
            }
            _ => {}
        }
    }

    let expr = parse_expression(tokens, debug_mode)?;
    expect_semicolon(tokens);
    Ok(Stmt::Expr(expr))
}

/*
fn parse_expression_statement(
    tokens: &mut VecDeque<Tok>,
    debug_mode: bool,
) -> Result<Stmt, String> {
    let expr = parse_expression(tokens, debug_mode)?;
    // Expect a semicolon
    expect_token(tokens, Token::Semicolon)?;
    Ok(Stmt::Expr(expr))
}
*/
