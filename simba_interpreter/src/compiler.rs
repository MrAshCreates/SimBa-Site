use std::collections::HashMap;
use crate::opcodes::Opcode;
use crate::{Stmt, Expr};
use crate::lexer::Token;
use crate::Value;

pub struct Compiler {
    pub bytecode: Vec<u8>,
    pub constants: Vec<Value>,
    pub labels: HashMap<String, u8>,
    pub functions: HashMap<String, Function>,
}

#[allow(dead_code)]
pub struct Function {
    pub name: String,
    pub parameters: Vec<String>,
    pub body: Vec<u8>, // Bytecode for the function body
}

impl Compiler {
    pub fn new() -> Self {
        Compiler {
            bytecode: Vec::new(),
            constants: Vec::new(),
            labels: HashMap::new(),
            functions: HashMap::new(),
        }
    }

    pub fn compile(&mut self, statements: Vec<Stmt>) -> Result<(), String> {
        for stmt in statements {
            self.compile_statement(&stmt)?;
        }
        Ok(())
    }

    pub fn compile_statement(&mut self, stmt: &Stmt) -> Result<(), String> {
        match stmt {
            Stmt::Print(expr) => {
                self.compile_expr(&expr)?;
                self.bytecode.push(Opcode::Print as u8);
            }
            Stmt::VarDecl(name, expr) => {
                self.compile_expr(&expr)?;
                let var_index = self.get_or_create_variable(&name);
                self.bytecode.push(Opcode::StoreVar as u8);
                self.bytecode.push(var_index);
            }
            Stmt::Assignment(name, expr) => {
                self.compile_expr(&expr)?;
                let var_index = self.get_or_create_variable(&name);
                self.bytecode.push(Opcode::StoreVar as u8);
                self.bytecode.push(var_index);
            }
            Stmt::If {
                condition,
                then_branch,
                else_branch,
            } => {
                self.compile_expr(&condition)?;
                self.bytecode.push(Opcode::JumpIfFalse as u8);
                let jump_placeholder = self.bytecode.len();
                self.bytecode.push(0); // Placeholder for jump address

                self.compile_statements(then_branch)?;

                if let Some(else_branch) = else_branch {
                    self.bytecode.push(Opcode::Jump as u8);
                    let else_jump_placeholder = self.bytecode.len();
                    self.bytecode.push(0); // Placeholder for jump address

                    // Back-patch the JumpIfFalse
                    let then_end = self.bytecode.len();
                    self.bytecode[jump_placeholder] = then_end as u8;

                    self.compile_statements(else_branch)?;

                    // Back-patch the Jump
                    let else_end = self.bytecode.len();
                    self.bytecode[else_jump_placeholder] = else_end as u8;
                } else {
                    // Back-patch the JumpIfFalse
                    let then_end = self.bytecode.len();
                    self.bytecode[jump_placeholder] = then_end as u8;
                }
            }
            Stmt::Function { name, parameters, body } => {
                let mut function_compiler = Compiler::new();
                function_compiler.compile_statements(body)?;

                let function = Function {
                    name: name.clone(),
                    parameters: parameters.clone(),
                    body: function_compiler.bytecode,
                };
                self.functions.insert(name.clone(), function);
            }
            Stmt::While { condition, body } => {
                let loop_start = self.bytecode.len();

                self.compile_expr(&condition)?;
                self.bytecode.push(Opcode::JumpIfFalse as u8);
                let exit_jump_placeholder = self.bytecode.len();
                self.bytecode.push(0); // Placeholder for exit jump

                self.compile_statements(body)?;

                self.bytecode.push(Opcode::Jump as u8);
                self.bytecode.push(loop_start as u8);

                // Back-patch the exit jump
                let loop_end = self.bytecode.len();
                self.bytecode[exit_jump_placeholder] = loop_end as u8;
            }
            Stmt::RustBlock(code) => {
                // Add the Rust code as a constant
                let const_index = self.add_constant(Value::RustCode(code.clone()));
                self.bytecode.push(Opcode::ExecuteRust as u8);
                self.bytecode.push(const_index as u8);
            }
            Stmt::PythonBlock(code) => {
                // Add the Python code as a constant
                let const_index = self.add_constant(Value::PythonCode(code.clone()));
                self.bytecode.push(Opcode::ExecutePython as u8);
                self.bytecode.push(const_index as u8);
            }
            Stmt::Block(statements) => {
                self.compile_statements(statements)?;
            }
            // ... handle other statements ...
            _ => unimplemented!(),
        }
        Ok(())
    }

    pub fn compile_statements(&mut self, statements: &Vec<Stmt>) -> Result<(), String> {
        for stmt in statements {
            self.compile_statement(stmt)?;
        }
        Ok(())
    }

    fn compile_expression(&mut self, expr: &Expr) -> Result<(), String> {
        match expr {
            Expr::Integer(value) => {
                let const_index = self.add_constant(Value::Integer(*value));
                self.bytecode.push(Opcode::LoadConst as u8);
                self.bytecode.push(const_index);
            }
            Expr::Bool(value) => {
                let const_index = self.add_constant(Value::Bool(*value));
                self.bytecode.push(Opcode::LoadConst as u8);
                self.bytecode.push(const_index);
            }
            Expr::Identifier(name) => {
                let var_index = self.get_or_create_variable(&name);
                self.bytecode.push(Opcode::LoadVar as u8);
                self.bytecode.push(var_index);
            }
            Expr::Binary { left, operator, right } => {
                if self.is_string_operation(left.as_ref(), right.as_ref()) {
                    self.compile_expression(left.as_ref())?;
                    self.compile_expression(right.as_ref())?;
                    self.bytecode.push(Opcode::Concat as u8);
                } else {
                    self.compile_expression(left.as_ref())?;
                    self.compile_expression(right.as_ref())?;
                    match operator {
                        Token::Plus => self.bytecode.push(Opcode::Add as u8),
                        Token::Minus => self.bytecode.push(Opcode::Sub as u8),
                        Token::Asterisk => self.bytecode.push(Opcode::Mul as u8),
                        Token::Slash => self.bytecode.push(Opcode::Div as u8),
                        Token::GreaterThan => self.bytecode.push(Opcode::GreaterThan as u8),
                        Token::LessThan => self.bytecode.push(Opcode::LessThan as u8),
                        Token::Equals => self.bytecode.push(Opcode::Equals as u8),
                        Token::NotEqual => self.bytecode.push(Opcode::NotEquals as u8),
                        Token::GreaterEqual => self.bytecode.push(Opcode::GreaterEqual as u8),
                        Token::LessEqual => self.bytecode.push(Opcode::LessEqual as u8),
                        _ => unimplemented!("Operator '{:?}' not implemented", operator),
                    }
                }
            }
            Expr::String(value) => {
                let const_index = self.add_constant(Value::String(value.clone()));
                self.bytecode.push(Opcode::LoadConstString as u8);
                self.bytecode.push(const_index);
            }
            Expr::Call { callee, arguments } => {
                // Compile arguments
                for arg in arguments {
                    self.compile_expr(arg)?;
                }
                // Add the function name to constants
                let const_index = self.add_constant(Value::String(callee.clone()));
                // Emit the Call opcode and the index of the function name
                self.bytecode.push(Opcode::Call as u8);
                self.bytecode.push(const_index);
            }
            Expr::Unary { operator, operand } => {
                self.compile_expression(&*operand)?;
                match operator {
                    Token::Minus => self.bytecode.push(Opcode::Negate as u8),
                    // Handle other unary operators if necessary
                    _ => return Err(format!("Operator '{:?}' not implemented", operator)),
                }
            }
        }
        Ok(())
    }

    fn add_constant(&mut self, value: Value) -> u8 {
        self.constants.push(value);
        (self.constants.len() - 1) as u8
    }

    // Variable index mapping
    fn get_or_create_variable(&mut self, name: &str) -> u8 {
        if let Some(&index) = self.labels.get(name) {
            index
        } else {
            let index = self.constants.len() as u8;
            self.constants.push(Value::String(name.to_string()));
            self.labels.insert(name.to_string(), index);
            index
        }
    }

    fn compile_expr(&mut self, expr: &Expr) -> Result<(), String> {
        match expr {
            Expr::Integer(value) => {
                let const_index = self.add_constant(Value::Integer(*value));
                self.bytecode.push(Opcode::LoadConst as u8);
                self.bytecode.push(const_index);
            }
            Expr::Bool(value) => {
                let const_index = self.add_constant(Value::Bool(*value));
                self.bytecode.push(Opcode::LoadConst as u8);
                self.bytecode.push(const_index);
            }
            Expr::Identifier(name) => {
                let var_index = self.get_or_create_variable(&name);
                self.bytecode.push(Opcode::LoadVar as u8);
                self.bytecode.push(var_index);
            }
            Expr::Binary { left, operator, right } => {
                self.compile_expr(&*left)?;
                self.compile_expr(&*right)?;
                match operator {
                    Token::Plus => {
                        if self.is_string_operation(&left, &right) {
                            self.bytecode.push(Opcode::Concat as u8);
                        } else {
                            self.bytecode.push(Opcode::Add as u8);
                        }
                    }
                    Token::Minus => self.bytecode.push(Opcode::Sub as u8),
                    Token::Asterisk => self.bytecode.push(Opcode::Mul as u8),
                    Token::Slash => self.bytecode.push(Opcode::Div as u8),
                    Token::GreaterThan => self.bytecode.push(Opcode::GreaterThan as u8),
                    Token::LessThan => self.bytecode.push(Opcode::LessThan as u8),
                    Token::Equals => self.bytecode.push(Opcode::Equals as u8),
                    Token::NotEqual => self.bytecode.push(Opcode::NotEquals as u8),
                    Token::GreaterEqual => self.bytecode.push(Opcode::GreaterEqual as u8),
                    Token::LessEqual => self.bytecode.push(Opcode::LessEqual as u8),
                    _ => unimplemented!("Operator '{:?}' not implemented", operator),
                }
            }
            Expr::String(value) => {
                let const_index = self.add_constant(Value::String(value.clone()));
                self.bytecode.push(Opcode::LoadConstString as u8);
                self.bytecode.push(const_index);
            }
            Expr::Call { callee, arguments } => {
                // Compile arguments
                for arg in arguments {
                    self.compile_expr(arg)?;
                }
                // Add the function name to constants
                let const_index = self.add_constant(Value::String(callee.clone()));
                // Emit the Call opcode and the index of the function name
                self.bytecode.push(Opcode::Call as u8);
                self.bytecode.push(const_index);
            }
            Expr::Unary { operator, operand } => {
                self.compile_expression(&*operand)?;
                match operator {
                    Token::Minus => self.bytecode.push(Opcode::Negate as u8),
                    // Handle other unary operators if necessary
                    _ => return Err(format!("Operator '{:?}' not implemented", operator)),
                }
            }
        }
        Ok(())
    }

    fn is_string_operation(&self, _left: &Expr, _right: &Expr) -> bool {
        // Implement logic to determine if both operands are strings
        // For now, we'll assume it's always string concatenation
        true
    }
} 