use std::fs;
use std::path::{Path, PathBuf};
use std::process::Command;
use std::sync::atomic::{AtomicU64, Ordering};
use std::time::{SystemTime, UNIX_EPOCH};

static EMBED_COUNTER: AtomicU64 = AtomicU64::new(0);

pub fn run_python(code: &str) -> Result<String, String> {
    let work_dir = unique_temp_dir("simba-python")?;
    let script_path = work_dir.join("embedded.py");
    fs::write(&script_path, code).map_err(|e| format!("Failed to write Python embed: {e}"))?;

    let python = python_bin();
    let output = Command::new(&python)
        .arg("-u")
        .arg(&script_path)
        .current_dir(&work_dir)
        .output()
        .map_err(|e| {
            let _ = fs::remove_dir_all(&work_dir);
            format!("Failed to start Python ({python}): {e}")
        })?;

    let _ = fs::remove_dir_all(&work_dir);

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr).trim().to_string();
        return Err(if stderr.is_empty() {
            "Embedded Python exited with an error.".to_string()
        } else {
            format!("Python error:\n{stderr}")
        });
    }

    Ok(String::from_utf8_lossy(&output.stdout).to_string())
}

pub fn run_rust(code: &str) -> Result<String, String> {
    let work_dir = unique_temp_dir("simba-rust")?;
    let source_path = work_dir.join("embedded.rs");
    let binary_path = work_dir.join("embedded_bin");
    fs::write(&source_path, wrap_rust_source(code)).map_err(|e| {
        let _ = fs::remove_dir_all(&work_dir);
        format!("Failed to write Rust embed: {e}")
    })?;

    let compile = Command::new(rustc_bin())
        .arg("--edition")
        .arg("2021")
        .arg("-O")
        .arg("-o")
        .arg(&binary_path)
        .arg(&source_path)
        .output()
        .map_err(|e| {
            let _ = fs::remove_dir_all(&work_dir);
            format!("Failed to start rustc: {e}")
        })?;

    if !compile.status.success() {
        let stderr = String::from_utf8_lossy(&compile.stderr).trim().to_string();
        let _ = fs::remove_dir_all(&work_dir);
        return Err(if stderr.is_empty() {
            "Failed to compile embedded Rust.".to_string()
        } else {
            format!("Rust compile error:\n{stderr}")
        });
    }

    let run = Command::new(&binary_path)
        .current_dir(&work_dir)
        .output()
        .map_err(|e| {
            let _ = fs::remove_dir_all(&work_dir);
            format!("Failed to run embedded Rust: {e}")
        })?;

    let _ = fs::remove_dir_all(&work_dir);

    if !run.status.success() {
        let stderr = String::from_utf8_lossy(&run.stderr).trim().to_string();
        return Err(if stderr.is_empty() {
            "Embedded Rust exited with an error.".to_string()
        } else {
            format!("Rust runtime error:\n{stderr}")
        });
    }

    Ok(String::from_utf8_lossy(&run.stdout).to_string())
}

fn wrap_rust_source(code: &str) -> String {
    let trimmed = code.trim();
    if trimmed.contains("fn main") {
        format!("{trimmed}\n")
    } else {
        format!("fn main() {{\n{trimmed}\n}}\n")
    }
}

fn rustc_bin() -> String {
    let mut candidates = vec!["rustc".to_string()];
    if let Ok(home) = std::env::var("HOME") {
        candidates.insert(0, format!("{home}/.cargo/bin/rustc"));
    }
    if let Ok(cargo_home) = std::env::var("CARGO_HOME") {
        candidates.insert(0, format!("{cargo_home}/bin/rustc"));
    }
    for candidate in candidates {
        if Path::new(&candidate).exists() || command_exists(&candidate) {
            return candidate;
        }
    }
    "rustc".to_string()
}

fn python_bin() -> String {
    let mut candidates = vec![
        "python3".to_string(),
        "python".to_string(),
        "/opt/homebrew/bin/python3".to_string(),
        "/usr/bin/python3".to_string(),
        "/usr/local/bin/python3".to_string(),
    ];
    if let Ok(home) = std::env::var("HOME") {
        candidates.insert(0, format!("{home}/.pyenv/shims/python3"));
    }
    for candidate in candidates {
        if Command::new(&candidate)
            .arg("-c")
            .arg("print(1)")
            .output()
            .map(|o| o.status.success())
            .unwrap_or(false)
        {
            return candidate;
        }
    }
    "python3".to_string()
}

fn command_exists(bin: &str) -> bool {
    Command::new(bin)
        .arg("--version")
        .output()
        .map(|o| o.status.success())
        .unwrap_or(false)
}

fn unique_temp_dir(prefix: &str) -> Result<PathBuf, String> {
    let n = EMBED_COUNTER.fetch_add(1, Ordering::Relaxed);
    let nanos = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_nanos())
        .unwrap_or(0);
    let dir = std::env::temp_dir().join(format!("{prefix}-{}-{n}-{nanos}", std::process::id()));
    fs::create_dir_all(&dir).map_err(|e| format!("Failed to create temp dir: {e}"))?;
    Ok(dir)
}
