use std::collections::HashMap;
use crate::embed;
use crate::opcodes::Opcode;
use crate::Value;

pub struct VM {
    pub bytecode: Vec<u8>,
    pub constants: Vec<Value>,
    pub stack: Vec<Value>,
    pub ip: usize,
    pub globals: HashMap<String, Value>,
    pub call_stack: Vec<usize>,
    pub functions: HashMap<String, Function>,
    pub _scopes: Vec<HashMap<String, Value>>,
    pub locals_stack: Vec<HashMap<String, Value>>,
}

#[derive(Clone)]
pub struct Function {
    pub body: Vec<u8>,
}

impl VM {
    pub fn new(bytecode: Vec<u8>, constants: Vec<Value>) -> Self {
        VM {
            bytecode,
            constants,
            ip: 0,
            stack: Vec::new(),
            globals: HashMap::new(),
            call_stack: Vec::new(),
            functions: HashMap::new(),
            _scopes: vec![HashMap::new()],
            locals_stack: Vec::new(),
        }
    }

    pub fn run(&mut self) -> Result<(), String> {
        while self.ip < self.bytecode.len() {
            let opcode = Opcode::from_u8(self.bytecode[self.ip]).ok_or(format!(
                "Unknown opcode at position {}: {}",
                self.ip, self.bytecode[self.ip]
            ))?;
            self.ip += 1;

            match opcode {
                Opcode::LoadConst => self.load_const(),
                Opcode::LoadConstString => self.load_const_string(),
                Opcode::LoadVar => {
                    self.load_var()?;
                }
                Opcode::StoreVar => {
                    self.store_var()?;
                }
                Opcode::Add => self.add(),
                Opcode::Sub => self.sub(),
                Opcode::Mul => self.mul(),
                Opcode::Div => self.div(),
                Opcode::GreaterThan => self.greater_than(),
                Opcode::LessThan => self.less_than(),
                Opcode::GreaterEqual => {
                    self.greater_equal()?;
                },
                Opcode::LessEqual => {
                    self.less_equal()?;
                },
                Opcode::Equals => self.equals(),
                Opcode::NotEquals => self.not_equals(),
                Opcode::Print => {
                    let value = self.stack.pop().ok_or("Stack underflow")?;
                    println!("{:?}", value);
                    return Ok(());
                }
                Opcode::JumpIfFalse => {
                    let jump_address = self.bytecode[self.ip] as usize;
                    self.ip += 1;
                    let condition = self.stack.pop().expect("Stack underflow");
                    match condition {
                        Value::Integer(0) => {
                            self.ip = jump_address;
                        }
                        Value::Integer(_) => {} // Do nothing, continue execution
                        _ => return Err("Condition must be an integer".to_string()),
                    }
                }
                Opcode::Jump => {
                    let jump_address = self.bytecode[self.ip] as usize;
                    self.ip += 1;
                    self.ip = jump_address;
                }
                Opcode::Call => {
                    self.call_function()?;
                }
                Opcode::Return => {
                    self.return_from_function()?;
                }
                Opcode::Concat => {
                    self.concat()?;
                }
                Opcode::ExecuteRust => self.execute_rust_code()?,
                Opcode::ExecutePython => self.execute_python_code()?,
                Opcode::Negate => {
                    self.negate()?;
                }
            }
        }
        Ok(())
    }

    fn load_const(&mut self) {
        let const_index = self.bytecode[self.ip] as usize;
        self.ip += 1;
        let value = self.constants[const_index].clone();
        self.stack.push(value);
    }

    fn load_var(&mut self) -> Result<(), String> {
        let var_index = self.bytecode[self.ip] as usize;
        self.ip += 1;
        let var_name = match &self.constants[var_index] {
            Value::String(s) => s.clone(),
            _ => return Err("Expected variable name to be a string".to_string()),
        };

        // Look for the variable in local scopes first
        for scope in self.locals_stack.iter().rev() {
            if let Some(value) = scope.get(&var_name) {
                self.stack.push(value.clone());
                return Ok(());
            }
        }

        // Fallback to global variables
        let value = self.globals.get(&var_name).ok_or(format!("Undefined variable '{}'", var_name))?.clone();
        self.stack.push(value);
        Ok(())
    }

    fn store_var(&mut self) -> Result<(), String> {
        let var_index = self.bytecode[self.ip] as usize;
        self.ip += 1;
        let var_name = match &self.constants[var_index] {
            Value::String(s) => s.clone(),
            _ => return Err("Expected variable name to be a string".to_string()),
        };

        let value = self.stack.pop().ok_or("Stack underflow".to_string())?;

        // Store in the innermost scope
        if let Some(scope) = self.locals_stack.last_mut() {
            scope.insert(var_name, value);
        } else {
            // If there's no local scope, store globally
            self.globals.insert(var_name, value);
        }
        Ok(())
    }

    fn add(&mut self) {
        let right = self.stack.pop().expect("Stack underflow");
        let left = self.stack.pop().expect("Stack underflow");
        match (left, right) {
            (Value::Integer(l), Value::Integer(r)) => {
                self.stack.push(Value::Integer(l + r));
            }
            (Value::String(l), Value::String(r)) => {
                self.stack.push(Value::String(l + &r));
            }
            _ => panic!("Type mismatch in add operation"),
        }
    }

    fn sub(&mut self) {
        let right = self.stack.pop().expect("Stack underflow");
        let left = self.stack.pop().expect("Stack underflow");
        match (left, right) {
            (Value::Integer(l), Value::Integer(r)) => {
                self.stack.push(Value::Integer(l - r));
            }
            _ => panic!("Type mismatch in sub operation"),
        }
    }

    fn print(&mut self) -> Result<(), String> {
        let value = self.stack.pop().expect("Stack underflow in print");

        match value {
            Value::Integer(i) => {
                println!("{}", i);
                Ok(())
            }
            Value::Bool(b) => {
                println!("{}", if b { "True" } else { "False" });
                Ok(())
            }
            Value::String(s) => {
                println!("{}", s);
                Ok(())
            }
            Value::RustCode(code) => {
                println!("{}", code);
                Ok(())
            }
            Value::PythonCode(code) => {
                println!("{}", code);
                Ok(())
            }
        }
    }

    fn mul(&mut self) {
        let right = self.stack.pop().expect("Stack underflow");
        let left = self.stack.pop().expect("Stack underflow");
        match (left, right) {
            (Value::Integer(l), Value::Integer(r)) => {
                self.stack.push(Value::Integer(l * r));
            }
            _ => panic!("Type mismatch in mul operation"),
        }
    }

    fn div(&mut self) {
        let right = self.stack.pop().expect("Stack underflow");
        let left = self.stack.pop().expect("Stack underflow");
        match (left, right) {
            (Value::Integer(l), Value::Integer(r)) => {
                self.stack.push(Value::Integer(l / r));
            }
            _ => panic!("Type mismatch in div operation"),
        }
    }

    fn greater_than(&mut self) {
        let right = self.stack.pop().expect("Stack underflow");
        let left = self.stack.pop().expect("Stack underflow");
        match (left, right) {
            (Value::Integer(l), Value::Integer(r)) => {
                self.stack.push(Value::Integer((l > r) as i64));
            }
            _ => panic!("Type mismatch in greater_than operation"),
        }
    }

    fn less_than(&mut self) {
        let right = self.stack.pop().expect("Stack underflow in less_than");
        let left = self.stack.pop().expect("Stack underflow in less_than");
        match (left, right) {
            (Value::Integer(l), Value::Integer(r)) => {
                self.stack.push(Value::Integer((l < r) as i64));
            }
            _ => panic!("Type mismatch in less_than operation"),
        }
    }

    fn load_const_string(&mut self) {
        let const_index = self.bytecode[self.ip] as usize;
        self.ip += 1;
        let value = self.constants[const_index].clone();
        self.stack.push(value);
    }

    fn concat(&mut self) -> Result<(), String> {
        let right = self.stack.pop().ok_or("Stack underflow in concat")?;
        let left = self.stack.pop().ok_or("Stack underflow in concat")?;
        match (left, right) {
            (Value::String(mut l), Value::String(r)) => {
                l.push_str(&r);
                self.stack.push(Value::String(l));
                Ok(())
            }
            _ => Err("Type mismatch in concat operation".to_string()),
        }
    }

    fn equals(&mut self) {
        let right = self.stack.pop().expect("Stack underflow");
        let left = self.stack.pop().expect("Stack underflow");
        let result = (left == right) as i64;
        self.stack.push(Value::Integer(result));
    }

    fn not_equals(&mut self) {
        let right = self.stack.pop().expect("Stack underflow");
        let left = self.stack.pop().expect("Stack underflow");
        let result = (left != right) as i64;
        self.stack.push(Value::Integer(result));
    }

    pub fn call_function(&mut self) -> Result<(), String> {
        // Fetch function name from constants
        let const_index = self.bytecode[self.ip] as usize;
        self.ip += 1;
        let func_name = match &self.constants[const_index] {
            Value::String(s) => s.clone(),
            _ => return Err("Expected function name to be a string".to_string()),
        };

        // Retrieve the function
        let function = self.functions.get(&func_name).ok_or(format!("Undefined function '{}'", func_name))?.clone();

        // Save the current state
        self.call_stack.push(self.ip);
        self.locals_stack.push(HashMap::new()); // Start a new scope for locals

        // Set instruction pointer to function body
        self.ip = 0;
        self.bytecode = function.body.clone();
        Ok(())
    }

    pub fn return_from_function(&mut self) -> Result<(), String> {
        // Restore the previous state
        self.ip = self.call_stack.pop().ok_or("Call stack underflow".to_string())?;
        self.locals_stack.pop();
        Ok(())
    }

    fn greater_equal(&mut self) -> Result<(), String> {
        let b = self.stack.pop().ok_or("Stack underflow on greater_equal")?;
        let a = self.stack.pop().ok_or("Stack underflow on greater_equal")?;
        match (a, b) {
            (Value::Integer(a), Value::Integer(b)) => {
                self.stack.push(Value::Integer(if a >= b { 1 } else { 0 }));
                Ok(())
            },
            _ => Err("Type error: greater_equal expects two integers".to_string()),
        }
    }

    fn less_equal(&mut self) -> Result<(), String> {
        let b = self.stack.pop().ok_or("Stack underflow on less_equal")?;
        let a = self.stack.pop().ok_or("Stack underflow on less_equal")?;
        match (a, b) {
            (Value::Integer(a), Value::Integer(b)) => {
                self.stack.push(Value::Integer(if a <= b { 1 } else { 0 }));
                Ok(())
            },
            _ => Err("Type error: less_equal expects two integers".to_string()),
        }
    }

    // Implement the method to execute Rust code
    fn execute_rust_code(&mut self) -> Result<(), String> {
        let const_index = self.bytecode[self.ip] as usize;
        self.ip += 1;

        // Retrieve the Rust code from constants
        let code = match &self.constants[const_index] {
            Value::RustCode(code) => code.clone(),
            _ => return Err("Expected RustCode value".to_string()),
        };

        // Execute the Rust code
        self.execute_external_rust_code(&code)
    }

    // Implement the method to execute Python code
    fn execute_python_code(&mut self) -> Result<(), String> {
        let const_index = self.bytecode[self.ip] as usize;
        self.ip += 1;

        // Retrieve the Python code from constants
        let code = match &self.constants[const_index] {
            Value::PythonCode(code) => code.clone(),
            _ => return Err("Expected PythonCode value".to_string()),
        };

        // Execute the Python code
        self.execute_external_python_code(&code)
    }

    fn execute_external_rust_code(&self, code: &str) -> Result<(), String> {
        let stdout = embed::run_rust(code)?;
        print!("{}", stdout);
        Ok(())
    }

    fn execute_external_python_code(&self, code: &str) -> Result<(), String> {
        let stdout = embed::run_python(code)?;
        print!("{}", stdout);
        Ok(())
    }

    fn negate(&mut self) -> Result<(), String> {
        if let Some(Value::Integer(value)) = self.stack.pop() {
            self.stack.push(Value::Integer(-value));
            Ok(())
        } else {
            Err("Top of stack is not an integer".to_string())
        }
    }

    // ... handle other opcodes ...
} 