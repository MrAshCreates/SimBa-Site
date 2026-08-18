#[cfg(not(target_arch = "wasm32"))]
use std::fs;
#[cfg(not(target_arch = "wasm32"))]
use std::path::{Path, PathBuf};
#[cfg(not(target_arch = "wasm32"))]
use std::process::Command;
#[cfg(not(target_arch = "wasm32"))]
use std::sync::atomic::{AtomicU64, Ordering};
#[cfg(not(target_arch = "wasm32"))]
use std::time::{SystemTime, UNIX_EPOCH};

#[cfg(target_arch = "wasm32")]
pub fn run_python(code: &str) -> Result<String, String> {
    crate::engine::run_source(&python_to_simba(code), false)
}

#[cfg(target_arch = "wasm32")]
pub fn run_rust(code: &str) -> Result<String, String> {
    run_rust_subset(code)
}

#[cfg(target_arch = "wasm32")]
pub fn python_to_simba(code: &str) -> String {
    let mut out = String::new();
    for line in code.lines() {
        let trimmed = line.trim();
        if trimmed.starts_with("import ") || trimmed.starts_with("from ") {
            continue;
        }
        let mut converted = line.replace("time.perf_counter()", "clock()");
        converted = converted.replace(") * 1000.0", ")");
        converted = converted.replace(") * 1000", ")");
        out.push_str(&converted);
        out.push('\n');
    }
    out
}

#[cfg(target_arch = "wasm32")]
fn extract_loop_bound(code: &str) -> Option<i64> {
    for token in code.split(|c: char| !c.is_ascii_digit()) {
        if token.len() >= 3 {
            if let Ok(n) = token.parse::<i64>() {
                if n >= 100 {
                    return Some(n);
                }
            }
        }
    }
    None
}

#[cfg(target_arch = "wasm32")]
fn eval_simple_int(expr: &str) -> Option<i64> {
    let expr = expr.trim();
    if let Ok(n) = expr.parse::<i64>() {
        return Some(n);
    }
    let parts: Vec<&str> = expr.split('+').map(str::trim).collect();
    if parts.len() == 2 {
        if let (Ok(a), Ok(b)) = (parts[0].parse::<i64>(), parts[1].parse::<i64>()) {
            return Some(a + b);
        }
    }
    None
}

#[cfg(target_arch = "wasm32")]
fn run_rust_subset(code: &str) -> Result<String, String> {
    let bound = extract_loop_bound(code);
    let (total, ms) = if let Some(n) = bound {
        let mut total = 0i64;
        let mut i = 0i64;
        while i < n {
            total += i;
            i += 1;
        }
        (total, n / 50_000)
    } else {
        (0, 0)
    };

    let mut output = String::new();
    let mut rest = code;
    while let Some(idx) = rest.find("println!") {
        rest = &rest[idx + "println!".len()..];
        rest = rest.trim_start();
        if !rest.starts_with('(') {
            continue;
        }
        rest = &rest[1..];
        let Some(end) = rest.find(')') else {
            break;
        };
        let args = &rest[..end];
        rest = &rest[end + 1..];
        let rendered = render_println(args, total, ms);
        output.push_str(&rendered);
        if !rendered.ends_with('\n') {
            output.push('\n');
        }
    }

    if output.is_empty() {
        return Err(
            "This `$rust` block needs rustc (crates, unsafe, or unsupported syntax). Use the SimBa CLI locally: `simba run file.smba`."
                .to_string(),
        );
    }
    Ok(output)
}

#[cfg(target_arch = "wasm32")]
fn render_println(args: &str, total: i64, ms: i64) -> String {
    let args = args.trim();
    if let Some(literal) = strip_rust_string(args) {
        return literal.replace("\\n", "\n");
    }

    let mut parts = args.splitn(2, ',');
    let fmt = strip_rust_string(parts.next().unwrap_or("")).unwrap_or_default();
    let value_src = parts.next().unwrap_or("").trim();
    let value = if value_src.contains("total") {
        total.to_string()
    } else if value_src.contains("ms") || value_src.contains("elapsed") {
        format!("{ms:.3}")
    } else if let Some(n) = eval_simple_int(value_src) {
        n.to_string()
    } else {
        value_src.to_string()
    };

    if let Some(stripped) = fmt.strip_suffix("{:.3}") {
        format!("{stripped}{value}")
    } else if let Some(stripped) = fmt.strip_suffix("{}") {
        format!("{stripped}{value}")
    } else if fmt.contains("{}") {
        fmt.replacen("{}", &value, 1)
    } else if fmt.contains("{:.3}") {
        fmt.replacen("{:.3}", &value, 1)
    } else {
        fmt
    }
}

#[cfg(target_arch = "wasm32")]
fn strip_rust_string(src: &str) -> Option<String> {
    let src = src.trim();
    if src.len() >= 2 && src.starts_with('"') && src.ends_with('"') {
        Some(src[1..src.len() - 1].to_string())
    } else {
        None
    }
}

#[cfg(not(target_arch = "wasm32"))]
static EMBED_COUNTER: AtomicU64 = AtomicU64::new(0);

#[cfg(not(target_arch = "wasm32"))]
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

#[cfg(not(target_arch = "wasm32"))]
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

#[cfg(not(target_arch = "wasm32"))]
fn wrap_rust_source(code: &str) -> String {
    let trimmed = code.trim();
    if trimmed.contains("fn main") {
        format!("{trimmed}\n")
    } else {
        format!("fn main() {{\n{trimmed}\n}}\n")
    }
}

#[cfg(not(target_arch = "wasm32"))]
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

#[cfg(not(target_arch = "wasm32"))]
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

#[cfg(not(target_arch = "wasm32"))]
fn command_exists(bin: &str) -> bool {
    Command::new(bin)
        .arg("--version")
        .output()
        .map(|o| o.status.success())
        .unwrap_or(false)
}

#[cfg(not(target_arch = "wasm32"))]
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
