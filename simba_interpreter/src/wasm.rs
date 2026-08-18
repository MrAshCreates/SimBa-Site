use wasm_bindgen::prelude::*;

use crate::{compile_source, run_source};

#[wasm_bindgen]
pub struct SimbaResult {
    ok: bool,
    stdout: String,
    stderr: String,
}

#[wasm_bindgen]
impl SimbaResult {
    #[wasm_bindgen(getter)]
    pub fn ok(&self) -> bool {
        self.ok
    }

    #[wasm_bindgen(getter)]
    pub fn stdout(&self) -> String {
        self.stdout.clone()
    }

    #[wasm_bindgen(getter)]
    pub fn stderr(&self) -> String {
        self.stderr.clone()
    }
}

#[wasm_bindgen]
pub fn execute(source: &str, mode: &str) -> SimbaResult {
    let result = match mode {
        "compile" => compile_source(source).map(|_| String::new()),
        "debug" => run_source(source, true),
        _ => run_source(source, false),
    };

    match result {
        Ok(stdout) => SimbaResult {
            ok: true,
            stdout,
            stderr: String::new(),
        },
        Err(stderr) => SimbaResult {
            ok: false,
            stdout: String::new(),
            stderr,
        },
    }
}
