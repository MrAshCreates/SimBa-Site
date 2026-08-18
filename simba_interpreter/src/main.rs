use std::fs;
use std::path::Path;
use clap::{Arg, Command, ArgAction, Subcommand};

use simba::{compile_source, run_source};

#[allow(dead_code)]
#[derive(Subcommand)]
enum Commands {
    /// Create a new SimBa project
    New {
        /// The name of the project
        name: String,
    },
    /// Run a SimBa script
    Run {
        /// The script file to run
        #[arg()]
        script: String,

        /// Enables debug mode
        #[arg(short, long, action = ArgAction::SetTrue)]
        debug: bool,
    },
    /// Initialize a SimBa project in the current directory
    Init {
        /// The name of the project
        name: String,
    },
}

fn main() {
    if let Err(e) = run() {
        eprintln!("Error: {}", e);
        std::process::exit(1);
    }
}

fn run() -> Result<(), Box<dyn std::error::Error>> {
    // Set up command-line arguments
    let cli = Command::new("SimBa Interpreter")
        .version("0.1.0")
        .author("Your Name <your.email@example.com>")
        .about("SimBa Programming Language Interpreter")
        .subcommand_required(true)
        .arg_required_else_help(true)
        .subcommand(
            Command::new("new")
                .about("Create a new SimBa project")
                .arg(
                    Arg::new("name")
                        .help("The name of the project")
                        .required(true),
                ),
        )
        .subcommand(
            Command::new("run")
                .about("Run a SimBa script")
                .arg(
                    Arg::new("script")
                        .help("The path to the SimBa script to run")
                        .required(true)
                        .index(1),
                )
                .arg(
                    Arg::new("debug")
                        .short('d')
                        .long("debug")
                        .help("Enable debug mode")
                        .action(ArgAction::SetTrue),
                ),
        )
        .subcommand(
            Command::new("compile")
                .about("Compile a SimBa script without running it")
                .arg(
                    Arg::new("script")
                        .help("The path to the SimBa script to compile")
                        .required(true)
                        .index(1),
                ),
        )
        .subcommand(
            Command::new("install")
                .about("Install the simba CLI globally via cargo")
                .arg(
                    Arg::new("path")
                        .long("path")
                        .short('p')
                        .help("Path to the simba_interpreter source directory")
                        .value_name("DIR"),
                ),
        );

    let matches = cli.get_matches();

    match matches.subcommand() {
        Some(("new", sub_m)) => {
            let project_name = sub_m.get_one::<String>("name").expect("Project name is required");
            create_new_project(project_name)?;
        }
        Some(("compile", sub_m)) => {
            let script_path = sub_m.get_one::<String>("script").expect("Script path is required");
            compile_script(script_path)?;
        }
        Some(("init", _)) => {
            init_project(".")?;
        }
        Some(("run", sub_m)) => {
            let script_path = sub_m.get_one::<String>("script").expect("Script path is required");
            let debug_mode = sub_m.get_flag("debug");
            run_script(script_path, debug_mode)?;
        }
        Some(("install", sub_m)) => {
            let source_path = sub_m.get_one::<String>("path").map(|s| s.as_str());
            install_simba(source_path)?;
        }
        _ => unreachable!("Unsupported subcommand"),
    }

    Ok(())
}

fn run_script(script_path: &str, debug_mode: bool) -> Result<(), Box<dyn std::error::Error>> {
    let script_content = fs::read_to_string(script_path)?;
    match run_source(&script_content, debug_mode) {
        Ok(out) => {
            print!("{out}");
            Ok(())
        }
        Err(e) => Err(e.into()),
    }
}

fn compile_script(script_path: &str) -> Result<(), Box<dyn std::error::Error>> {
    let script_content = fs::read_to_string(script_path)?;
    compile_source(&script_content)?;
    println!("Compile succeeded: {}", script_path);
    Ok(())
}

// New function to handle 'new' command
fn create_new_project(project_name: &str) -> Result<(), Box<dyn std::error::Error>> {
    use std::fs::create_dir_all;

    let project_path = Path::new(project_name);

    // Check if the project directory already exists
    if project_path.exists() {
        return Err(format!("Directory '{}' already exists", project_name).into());
    }

    // Create project directory and 'src' subdirectory
    create_dir_all(project_path.join("src"))?;

    // Create a main SimBa script file
    let main_file_content = "// Main entry point for the SimBa program\nprint \"Hello from SimBa!\";";
    fs::write(project_path.join("src").join("main.smba"), main_file_content)?;

    // Optionally create a README file
    let readme_content = format!("# {}\n\nThis is a SimBa project.", project_name);
    fs::write(project_path.join("README.md"), readme_content)?;

    println!("Created new SimBa project '{}'", project_name);
    println!("Project structure:");
    println!("{}{}", project_name, std::path::MAIN_SEPARATOR);
    println!("{}{}src{}", project_name, std::path::MAIN_SEPARATOR, std::path::MAIN_SEPARATOR);
    println!("{}{}src{}main.smba", project_name, std::path::MAIN_SEPARATOR, std::path::MAIN_SEPARATOR);

    Ok(())
}

fn init_project(path: &str) -> Result<(), Box<dyn std::error::Error>> {
    use std::fs::create_dir_all;
    use std::path::Path;

    let project_path = Path::new(path);

    // Check if 'src' directory already exists
    if project_path.join("src").exists() {
        return Err("A SimBa project already exists in this directory.".into());
    }

    // Create 'src' directory
    create_dir_all(project_path.join("src"))?;

    // Create a main SimBa script file
    let main_file_content = "// Main entry point for the SimBa program\nprint \"Hello from SimBa!\";";
    fs::write(project_path.join("src").join("main.smba"), main_file_content)?;

    println!("Initialized SimBa project in '{}'", project_path.display());
    println!("Project structure:");
    println!("{}{}", project_path.display(), std::path::MAIN_SEPARATOR);
    println!("{}src{}", project_path.display(), std::path::MAIN_SEPARATOR);
    println!("{}src{}main.smba", project_path.display(), std::path::MAIN_SEPARATOR);

    Ok(())
}

fn install_simba(source_path: Option<&str>) -> Result<(), Box<dyn std::error::Error>> {
    let project_dir = if let Some(path) = source_path {
        Path::new(path).canonicalize().map_err(|e| {
            format!("Invalid install path '{}': {}", path, e)
        })?
    } else {
        find_simba_project_dir()?
    };

    if !is_simba_project(&project_dir)? {
        return Err(format!(
            "'{}' is not the SimBa interpreter source directory (expected a Cargo.toml with name = \"simba\")",
            project_dir.display()
        )
        .into());
    }

    let project_dir_str = project_dir
        .to_str()
        .ok_or("Project path contains invalid UTF-8")?;

    println!("Installing SimBa from {}...", project_dir.display());

    let status = std::process::Command::new("cargo")
        .args(["install", "--path", project_dir_str, "--force"])
        .status()?;

    if !status.success() {
        return Err("cargo install failed".into());
    }

    let cargo_bin = home_cargo_bin();
    println!();
    println!("SimBa installed successfully.");
    println!("  Binary: {}/simba", cargo_bin);
    println!();
    println!("Open a new terminal, then verify with:");
    println!("  simba --version");
    println!("  simba run helloworld.smba");

    if !path_includes_cargo_bin() {
        println!();
        println!("~/.cargo/bin is not on your PATH. Add this to ~/.zshrc:");
        println!("  export PATH=\"$HOME/.cargo/bin:$PATH\"");
    }

    warn_if_stale_simba_on_path(&cargo_bin);

    Ok(())
}

fn warn_if_stale_simba_on_path(cargo_bin: &str) {
    let expected = format!("{}/simba", cargo_bin);
    let stale_paths = ["/usr/local/bin/simba"];

    for stale in stale_paths {
        if let Ok(target) = fs::read_link(stale) {
            if target.to_string_lossy() != expected {
                println!();
                println!("Warning: '{}' points to an old binary:", stale);
                println!("  {}", target.display());
                println!("Remove it so your shell uses the new install:");
                println!("  sudo rm {}", stale);
            }
        }
    }
}

fn find_simba_project_dir() -> Result<std::path::PathBuf, Box<dyn std::error::Error>> {
    let mut dir = std::env::current_dir()?;

    loop {
        if is_simba_project(&dir)? {
            return Ok(dir);
        }

        if !dir.pop() {
            break;
        }
    }

    Err(
        "Could not find SimBa source directory.\n\
         Run this from simba_interpreter, or pass an explicit path:\n\
           simba install --path /path/to/simba_interpreter"
            .into(),
    )
}

fn is_simba_project(dir: &Path) -> Result<bool, Box<dyn std::error::Error>> {
    let cargo_toml = dir.join("Cargo.toml");
    if !cargo_toml.exists() {
        return Ok(false);
    }

    let content = fs::read_to_string(cargo_toml)?;
    Ok(content.contains("name = \"simba\""))
}

fn home_cargo_bin() -> String {
    std::env::var("HOME")
        .map(|home| format!("{}/.cargo/bin", home))
        .unwrap_or_else(|_| "~/.cargo/bin".to_string())
}

fn path_includes_cargo_bin() -> bool {
    std::env::var("PATH")
        .map(|path| {
            path.split(':').any(|entry| {
                entry.ends_with(".cargo/bin") || entry.contains("/.cargo/bin")
            })
        })
        .unwrap_or(false)
}
