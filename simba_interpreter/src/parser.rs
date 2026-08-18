use std::collections::VecDeque;
use crate::lexer::Token;
use crate::ast::{Stmt, Expr};

pub enum Stmt {
    // ... existing variants ...
    RustBlock(String),
    PythonBlock(String),
    Function {
        name: String,
        parameters: Vec<String>,
        body: Vec<Stmt>,
    },
    Assignment(String, Expr),
    Expr(Expr),
    Block(Vec<Stmt>),
}

// ... existing code ...

pub fn parse(tokens: &mut VecDeque<Token>, debug_mode: bool) -> Result<Vec<Stmt>, String> {
    let mut statements = Vec::new();

    while let Some(_) = tokens.front() {
        let stmt = parse_statement(tokens, debug_mode)?;
        statements.push(stmt);
    }

    Ok(statements)
}

fn parse_statement(
    tokens: &mut VecDeque<Token>,
    debug_mode: bool,
) -> Result<Stmt, String> {
    if let Some(token) = tokens.front().cloned() {
        match token {
            Token::Print => parse_print_statement(tokens, debug_mode),
            Token::Let => parse_var_decl(tokens, debug_mode),
            Token::If => parse_if_statement(tokens, debug_mode),
            Token::While => parse_while_statement(tokens, debug_mode),
            Token::Func => parse_function(tokens, debug_mode),
            Token::Return => parse_return_statement(tokens, debug_mode),
            Token::LeftBrace => {
                // Parse a block
                let block = parse_block(tokens, debug_mode)?;
                Ok(Stmt::Block(block))
            }
            Token::RustCode(_) => {
                if let Some(Token::RustCode(code)) = tokens.pop_front() {
                    Ok(Stmt::RustBlock(code))
                } else {
                    Err("Expected RustCode token".to_string())
                }
            }
            Token::PythonCode(_) => {
                if let Some(Token::PythonCode(code)) = tokens.pop_front() {
                    Ok(Stmt::PythonBlock(code))
                } else {
                    Err("Expected PythonCode token".to_string())
                }
            }
            _ => parse_assignment_or_expression(tokens, debug_mode),
        }
    } else {
        Err("Unexpected end of input in statement".to_string())
    }
} 