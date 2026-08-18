# SimBa Interpreter

SimBa is a small interpreted programming language written in Rust. Scripts use the `.smba` file extension and are executed by the `simba` CLI.

## Prerequisites

- [Rust](https://rustup.rs/) (2021 edition)
- Python 3 (optional, only needed for embedded `$python` blocks)

## Build

```bash
cargo build
```

For a release build:

```bash
cargo build --release
```

The binary is written to `target/debug/simba` (or `target/release/simba`).

## Install globally

Install the `simba` command so you can use it from any terminal.

### First-time install (from source)

If you don't have `simba` installed yet, run this from the `simba_interpreter` directory:

```bash
cargo run -- install
```

This builds SimBa and installs it to `~/.cargo/bin/simba`.

### Install or update with `simba install`

Once you have SimBa (or after the step above), you can install or reinstall globally with:

```bash
cd simba_interpreter
simba install
```

To install from a specific path:

```bash
simba install --path /path/to/simba_interpreter
```

This runs `cargo install --path . --force` under the hood and puts the release binary on your PATH.

### One-time setup

1. **Install Rust** if you don't have it: [rustup.rs](https://rustup.rs/)

2. **Install SimBa** using either method above.

3. **Make sure `~/.cargo/bin` is on your PATH.** Rust's installer usually adds this via `~/.zshenv`. If `simba` is not found in a new terminal, add this to `~/.zshrc`:

   ```bash
   export PATH="$HOME/.cargo/bin:$PATH"
   ```

4. **Open a new terminal** (or run `source ~/.zshrc`) and verify:

   ```bash
   simba --version
   simba run helloworld.smba
   ```

### Use it anywhere

Once installed, run SimBa scripts from any directory:

```bash
simba run path/to/program.smba
simba new MyProject
simba init
```

### Update or uninstall

```bash
# Reinstall after pulling changes
simba install

# Or manually
cargo install --path . --force

# Remove global install
cargo uninstall simba
```

### Fix: wrong or broken `simba` command

If `simba` runs but scripts fail unexpectedly, you may have an old symlink shadowing the Cargo install. Check which binary is used:

```bash
which simba
```

It should point to `~/.cargo/bin/simba`. If it points elsewhere (e.g. `/usr/local/bin/simba`), remove the stale link:

```bash
sudo rm /usr/local/bin/simba
```

Then open a new terminal and use the Cargo-installed version.

## Run a script

```bash
cargo run -- run helloworld.smba
```

Or, after building locally:

```bash
./target/debug/simba run helloworld.smba
```

If installed globally:

```bash
simba run helloworld.smba
```

Enable debug output:

```bash
cargo run -- run myscript.smba --debug
```

## Project commands

Create a new project in a subdirectory:

```bash
simba new MyProject
```

Or, without a global install:

```bash
cargo run -- new MyProject
```

This creates:

```
MyProject/
  src/
    main.smba
  README.md
```

Initialize a project in the current directory:

```bash
simba init
```

## Language overview

### Variables

```smba
let x = 5;
let name = "SimBa";
```

### Print

```smba
print "Hello World!";
print x;
```

### Arithmetic and comparisons

```smba
let sum = x + y;
let product = x * y;
let is_equal = x == y;
```

Supported operators: `+`, `-`, `*`, `/`, `==`, `!=`, `<`, `>`, `<=`, `>=`

String concatenation works with the `+` operator:

```smba
print "Hello, " + name + "!";
```

### Conditionals

```smba
if (x > 0) {
    print "positive";
} else {
    print "not positive";
}
```

### Loops

```smba
let i = 0;
while (i < 5) {
    print i;
    i = i + 1;
}
```

### Functions

```smba
function greet(name) {
    print "Hello, " + name + "!";
}

function add(a, b) {
    return a + b;
}

greet("SimBa");
let result = add(5, 10);
print result;
```

### Comments

```smba
// Single-line comment

/* Block comment */
```

### Embedded code blocks

SimBa supports embedding Rust and Python source in scripts. These blocks are delimited by `$rust` / `rust$` and `$python` / `python$`.

**Python** (requires Python 3 at runtime):

```smba
$python
print("Hello from embedded Python!")
python$
```

**Rust** (currently simulated — prints the code but does not compile or execute it):

```smba
$rust
fn main() {
    println!("Hello from embedded Rust!");
}
rust$
```

## Example scripts

| File | Description |
|------|-------------|
| `helloworld.smba` | Basic print statement |
| `test.smba` | Variables and arithmetic |
| `function_test.smba` | Functions, calls, and return values |
| `simba_and_python.smba` | Embedded Python block |
| `simba_and_rust.smba` | Embedded Rust block |

## Troubleshooting

**`Python interpreter not available`** — Install Python 3 and rebuild:

```bash
brew install python3   # macOS
cargo build
```

**Parse errors** — Statements must end with a semicolon (`;`). String literals use double quotes.

**Undefined variable** — Variables must be declared with `let` before use. Reassignment uses `=` on an existing variable:

```smba
let x = 1;
x = 2;
```

## License

MIT
