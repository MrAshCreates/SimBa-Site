pub mod engine;
pub mod embed;
pub mod interpreter;
pub mod lexer;

#[allow(dead_code)]
mod compiler;
#[allow(dead_code)]
mod opcodes;
#[allow(dead_code)]
mod vm;

pub use engine::{compile_source, run_source, Expr, Stmt, Value};
pub use lexer::Token;

#[cfg(target_arch = "wasm32")]
mod wasm;
