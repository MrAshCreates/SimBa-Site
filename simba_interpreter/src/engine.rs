use std::collections::VecDeque;

use crate::interpreter::Interpreter;
use crate::lexer::Token;

#[derive(Clone, Debug)]
struct Tok {
    token: Token,
    line: usize,
}

fn peek(tokens: &VecDeque<Tok>) -> Option<&Token> {
    tokens
        .iter()
        .find(|t| !matches!(t.token, Token::Newline))
        .map(|t| &t.token)
}

fn peek_line(tokens: &VecDeque<Tok>) -> usize {
    tokens
        .iter()
        .find(|t| !matches!(t.token, Token::Newline))
        .map(|t| t.line)
        .unwrap_or(1)
}

fn take(tokens: &mut VecDeque<Tok>) -> Option<Token> {
    while matches!(tokens.front().map(|t| &t.token), Some(Token::Newline)) {
        tokens.pop_front();
    }
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

    while peek(tokens).is_some() {
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
        Some(Token::Import) | Some(Token::From) => parse_import(tokens),
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
        Some(Token::Identifier(name)) if name == "python" || name == "rust" => {
            parse_named_embed(tokens, debug_mode, &name)
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

fn skip_type_expr(tokens: &mut VecDeque<Tok>) -> Result<(), String> {
    if matches!(peek(tokens), Some(Token::Ampersand)) {
        take(tokens);
    }
    if matches!(peek(tokens), Some(Token::Mut)) {
        take(tokens);
    }
    match take(tokens) {
        Some(Token::Identifier(_)) => {}
        other => {
            return Err(format!(
                "Expected a type name, found {:?}. Try `x: int = 5` or `def f() -> str:`.",
                other
            ));
        }
    }
    if matches!(peek(tokens), Some(Token::LeftBracket | Token::LessThan)) {
        let expected = if matches!(peek(tokens), Some(Token::LeftBracket)) {
            Token::RightBracket
        } else {
            Token::GreaterThan
        };
        take(tokens);
        loop {
            if peek(tokens).is_none() {
                return Err("Unfinished type argument list".to_string());
            }
            if peek(tokens) == Some(&expected) {
                take(tokens);
                break;
            }
            if matches!(peek(tokens), Some(Token::Comma | Token::Pipe)) {
                take(tokens);
                continue;
            }
            skip_type_expr(tokens)?;
        }
    }
    if matches!(peek(tokens), Some(Token::Pipe)) {
        take(tokens);
        skip_type_expr(tokens)?;
    }
    Ok(())
}

fn skip_optional_type(tokens: &mut VecDeque<Tok>) -> Result<(), String> {
    if matches!(peek(tokens), Some(Token::Colon)) {
        take(tokens);
        skip_type_expr(tokens)
    } else {
        Ok(())
    }
}

fn skip_return_type(tokens: &mut VecDeque<Tok>) -> Result<(), String> {
    if matches!(peek(tokens), Some(Token::Arrow)) {
        take(tokens);
        skip_type_expr(tokens)
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

    while matches!(peek(tokens), Some(Token::LeftParen | Token::Dot)) {
        if matches!(peek(tokens), Some(Token::Dot)) {
            take(tokens);
            let method = if let Some(Token::Identifier(name)) = take(tokens) {
                name
            } else {
                return Err(format!("Expected a name after `.` on {}", at(tokens)));
            };
            let object = match expr {
                Expr::Identifier(name) => name,
                _ => {
                    return Err(format!(
                        "Playground SimBa only supports `module.fn()` calls like `time.perf_counter()` on {}",
                        at(tokens)
                    ));
                }
            };
            let callee = format!("{object}.{method}");
            if matches!(peek(tokens), Some(Token::LeftParen)) {
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
                expr = Expr::Call {
                    callee,
                    arguments,
                };
            } else {
                expr = Expr::Identifier(callee);
            }
            continue;
        }

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
        Some(Token::FString(value)) => interpolate_fstring(&value, debug_mode),
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
            "Expected {:?}, found {:?} on {}. Hint: SimBa blocks use indentation (like Python) or `{{ }}`.",
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
    tokenize_with_indents(input)
}

fn starts_word(src: &str, word: &str) -> bool {
    src.starts_with(word)
        && match src.as_bytes().get(word.len()) {
            Some(b) => !b.is_ascii_alphanumeric() && *b != b'_',
            None => true,
        }
}

fn consume_braced_block(src: &str) -> Option<(&str, usize)> {
    let bytes = src.as_bytes();
    let start = src.find('{')?;
    let mut depth = 0i32;
    let mut in_string = false;
    let mut escaped = false;
    for (i, ch) in src[start..].char_indices() {
        let idx = start + i;
        if in_string {
            if escaped {
                escaped = false;
            } else if ch == '\\' {
                escaped = true;
            } else if ch == '"' {
                in_string = false;
            }
            continue;
        }
        match ch {
            '"' => in_string = true,
            '{' => depth += 1,
            '}' => {
                depth -= 1;
                if depth == 0 {
                    let inner = &src[start + 1..idx];
                    return Some((inner, idx + 1));
                }
            }
            _ => {}
        }
    }
    let _ = bytes;
    None
}

fn tokenize_with_indents(input: &str) -> Result<Vec<Tok>, String> {
    use logos::Logos;

    let mut tokens = Vec::new();
    let mut indent_stack = vec![0usize];
    let mut pos = 0usize;
    let mut line = 1usize;
    let mut at_bol = true;
    let mut pending_colon_indent = false;

    while pos < input.len() {
        if at_bol {
            let mut indent = 0usize;
            while pos < input.len() {
                match input.as_bytes()[pos] {
                    b' ' => {
                        indent += 1;
                        pos += 1;
                    }
                    b'\t' => {
                        indent += 8;
                        pos += 1;
                    }
                    _ => break,
                }
            }
            if pos >= input.len() {
                break;
            }
            if input.as_bytes()[pos] == b'\n' {
                pos += 1;
                line += 1;
                continue;
            }
            if input[pos..].starts_with('#') || input[pos..].starts_with("//") {
                while pos < input.len() && input.as_bytes()[pos] != b'\n' {
                    pos += 1;
                }
                continue;
            }

            let current = *indent_stack.last().unwrap();
            if pending_colon_indent {
                pending_colon_indent = false;
                if indent <= current {
                    return Err(format!("line {line}: expected an indented block after `:`"));
                }
                indent_stack.push(indent);
                tokens.push(Tok {
                    token: Token::Indent,
                    line,
                });
            } else {
                while indent < *indent_stack.last().unwrap() {
                    indent_stack.pop();
                    tokens.push(Tok {
                        token: Token::Dedent,
                        line,
                    });
                }
            }
            at_bol = false;
            continue;
        }

        if input.as_bytes()[pos] == b'\n' {
            pos += 1;
            line += 1;
            at_bol = true;
            tokens.push(Tok {
                token: Token::Newline,
                line: line - 1,
            });
            continue;
        }

        if matches!(input.as_bytes()[pos], b' ' | b'\t' | b'\r') {
            pos += 1;
            continue;
        }

        if input[pos..].starts_with('#') || input[pos..].starts_with("//") {
            while pos < input.len() && input.as_bytes()[pos] != b'\n' {
                pos += 1;
            }
            continue;
        }

        if starts_word(&input[pos..], "$python") || starts_word(&input[pos..], "$rust") {
            let (is_python, prefix, closer) = if input[pos..].starts_with("$python") {
                (true, "$python".len(), "python$")
            } else {
                (false, "$rust".len(), "rust$")
            };
            let start = pos + prefix;
            let Some(rel) = input[start..].find(closer) else {
                return Err(format!(
                    "line {line}: unclosed `{}` embed",
                    if is_python { "$python" } else { "$rust" }
                ));
            };
            let inner = input[start..start + rel].to_string();
            let token = if is_python {
                Token::PythonCode(inner.clone())
            } else {
                Token::RustCode(inner.clone())
            };
            tokens.push(Tok { token, line });
            line += inner.bytes().filter(|b| *b == b'\n').count();
            pos = start + rel + closer.len();
            continue;
        }

        if starts_word(&input[pos..], "python") || starts_word(&input[pos..], "rust") {
            let name_len = if input[pos..].starts_with("python") { 6 } else { 4 };
            let after_name = input[pos + name_len..].trim_start_matches([' ', '\t']);
            if after_name.starts_with('{') {
                let kind = if name_len == 6 { "python" } else { "rust" };
                let offset = input[pos + name_len..]
                    .find('{')
                    .map(|i| pos + name_len + i)
                    .unwrap();
                let Some((inner, end)) = consume_braced_block(&input[offset..]) else {
                    return Err(format!("line {line}: unclosed `{kind} {{ ... }}` embed"));
                };
                let abs_end = offset + end;
                let token = if kind == "python" {
                    Token::PythonCode(inner.to_string())
                } else {
                    Token::RustCode(inner.to_string())
                };
                tokens.push(Tok { token, line });
                line += input[pos..abs_end].bytes().filter(|b| *b == b'\n').count();
                pos = abs_end;
                continue;
            }
        }

        let rest = &input[pos..];
        let mut lexer = Token::lexer(rest);
        match lexer.next() {
            Some(Ok(token)) => {
                let span = lexer.span();
                if span.start != 0 {
                    let ch = rest.chars().next().unwrap_or('?');
                    return Err(format!(
                        "line {line}: invalid character `{ch}`. SimBa comments use `#` or `//`. Strings use double quotes. Embeds use `$python` ... `python$` or `python {{ ... }}`."
                    ));
                }
                pos += span.end;
                pending_colon_indent = matches!(token, Token::Colon);
                tokens.push(Tok { token, line });
            }
            Some(Err(_)) => {
                let ch = rest.chars().next().unwrap_or('?');
                return Err(format!(
                    "line {line}: invalid character `{ch}`. SimBa comments use `#` or `//`. Strings use double quotes. Embeds use `$python` ... `python$` and `$rust` ... `rust$`."
                ));
            }
            None => break,
        }
    }

    while indent_stack.len() > 1 {
        indent_stack.pop();
        tokens.push(Tok {
            token: Token::Dedent,
            line,
        });
    }

    Ok(tokens)
}

fn interpolate_fstring(raw: &str, debug_mode: bool) -> Result<Expr, String> {
    let mut parts: Vec<Expr> = Vec::new();
    let mut buf = String::new();
    let mut chars = raw.chars().peekable();
    while let Some(c) = chars.next() {
        if c == '{' {
            if chars.peek() == Some(&'{') {
                chars.next();
                buf.push('{');
                continue;
            }
            if !buf.is_empty() {
                parts.push(Expr::String(std::mem::take(&mut buf)));
            }
            let mut inner = String::new();
            let mut depth = 1;
            while let Some(ch) = chars.next() {
                if ch == '{' {
                    depth += 1;
                    inner.push(ch);
                } else if ch == '}' {
                    depth -= 1;
                    if depth == 0 {
                        break;
                    }
                    inner.push(ch);
                } else {
                    inner.push(ch);
                }
            }
            let expr_src = inner.split_once(':').map(|(left, _)| left).unwrap_or(&inner).trim();
            if expr_src.is_empty() {
                return Err("Empty f-string interpolation `{}`".to_string());
            }
            let mut inner_tokens: VecDeque<Tok> = tokenize(expr_src)?.into();
            let expr = parse_expression(&mut inner_tokens, debug_mode)?;
            parts.push(expr);
        } else if c == '}' {
            if chars.peek() == Some(&'}') {
                chars.next();
                buf.push('}');
            } else {
                buf.push(c);
            }
        } else {
            buf.push(c);
        }
    }
    if !buf.is_empty() {
        parts.push(Expr::String(buf));
    }
    if parts.is_empty() {
        return Ok(Expr::String(String::new()));
    }
    let mut expr = parts.remove(0);
    for part in parts {
        expr = Expr::Binary {
            left: Box::new(expr),
            operator: Token::Plus,
            right: Box::new(part),
        };
    }
    Ok(expr)
}

fn parse_import(tokens: &mut VecDeque<Tok>) -> Result<Stmt, String> {
    take(tokens);
    while matches!(
        peek(tokens),
        Some(Token::Identifier(_) | Token::Comma | Token::Dot | Token::Asterisk | Token::Import)
    ) {
        take(tokens);
    }
    expect_semicolon(tokens);
    Ok(Stmt::Pass)
}

fn parse_named_embed(tokens: &mut VecDeque<Tok>, _debug_mode: bool, name: &str) -> Result<Stmt, String> {
    match peek(tokens).cloned() {
        Some(Token::PythonCode(code)) if name == "python" => {
            take(tokens);
            Ok(Stmt::PythonBlock(code))
        }
        Some(Token::RustCode(code)) if name == "rust" => {
            take(tokens);
            Ok(Stmt::RustBlock(code))
        }
        _ => parse_assignment_or_expression(tokens, false),
    }
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
    if matches!(peek(tokens), Some(Token::Colon)) {
        take(tokens);
        if matches!(peek(tokens), Some(Token::Indent)) {
            take(tokens);
            let mut statements = Vec::new();
            while peek(tokens).is_some() && !matches!(peek(tokens), Some(Token::Dedent)) {
                statements.push(parse_statement(tokens, debug_mode)?);
            }
            if matches!(peek(tokens), Some(Token::Dedent)) {
                take(tokens);
            }
            return Ok(statements);
        }
        return Ok(vec![parse_statement(tokens, debug_mode)?]);
    }

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
    skip_return_type(tokens)?;
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
