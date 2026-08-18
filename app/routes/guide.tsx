import { Link } from "react-router";
import { Book, Code, Cpu, Shield, Terminal, Zap, ArrowRight } from "lucide-react";
import type { Route } from "./+types/guide";
import { Navigation } from "~/components/navigation/navigation";
import styles from "./guide.module.css";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "SimBa Programming Guide - Write Python, Embed Python and Rust" },
    {
      name: "description",
      content:
        "SimBa writes like Python. Most Python runs as native SimBa. Imports and packages use $python embeds; Rust and crates use $rust embeds. Every snippet here runs in the playground.",
    },
  ];
}

export default function Guide() {
  return (
    <div className={styles.container}>
      <Navigation />

      <main className={styles.main}>
        <header className={styles.header}>
          <h1 className={styles.title}>
            SimBa Programming <span className={styles.highlight}>Guide</span>
            <span className="beta-badge">Beta</span>
          </h1>
          <p className={styles.subtitle}>
            Write almost exactly like Python. Embed real Python or Rust when you need their ecosystems.
          </p>
        </header>

        <div className={styles.content}>
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <Book className={styles.sectionIcon} />
              Introduction to SimBa
            </h2>
            <div className={styles.sectionContent}>
              <p>
                SimBa is a host language that writes like Python. Most Python you already know runs as native SimBa —
                functions, indentation, f-strings, <code className={styles.inlineCode}>if</code>/
                <code className={styles.inlineCode}>elif</code>/<code className={styles.inlineCode}>else</code>, loops,
                and optional types. A few safety and typing features (inspired by Rust) change the details slightly so
                host code is harder to leak or misuse.
              </p>
              <p>
                Two things are not native SimBa. Python <code className={styles.inlineCode}>import</code> and packages
                belong in <code className={styles.inlineCode}>$python</code> ...{" "}
                <code className={styles.inlineCode}>python$</code>. Rust is never written as SimBa — syntax,{" "}
                <code className={styles.inlineCode}>fn</code>, <code className={styles.inlineCode}>use</code>, and crates
                all go in <code className={styles.inlineCode}>$rust</code> ...{" "}
                <code className={styles.inlineCode}>rust$</code>. Every example on this page is meant to run in the
                playground.
              </p>
            </div>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <Code className={styles.sectionIcon} />
              Basic SimBa Syntax
            </h2>
            <div className={styles.sectionContent}>
              <p>
                Write SimBa the way you write Python. Types are optional. Blocks use indentation; braces also work if
                you prefer them.
              </p>

              <div className={styles.codeBlock}>
                <div className={styles.codeHeader}>basic-syntax.smba</div>
                <pre>{`# Variable declaration with static typing
name: str = "SimBa"
age: int = 2024
is_fast: bool = True

# Function definition
def greet(user: str) -> str:
    return f"Hello, {user}! Welcome to SimBa."

# Control flow (familiar Python syntax)
def fibonacci(n: int) -> int:
    if n <= 1:
        return n

    return fibonacci(n - 1) + fibonacci(n - 2)

# Main execution
def main():
    message = greet("Developer")
    print(message)
    print(f"Fibonacci(10) = {fibonacci(10)}")

if __name__ == "__main__":
    main()`}</pre>
              </div>

              <p>What is SimBa, and what is not:</p>
              <ul>
                <li>Indentation-based blocks like Python (braces also work)</li>
                <li>Optional types on names and functions, including <code className={styles.inlineCode}>-&gt;</code></li>
                <li>
                  Keywords: <code className={styles.inlineCode}>def</code>,{" "}
                  <code className={styles.inlineCode}>if</code>, <code className={styles.inlineCode}>elif</code>,{" "}
                  <code className={styles.inlineCode}>else</code>, <code className={styles.inlineCode}>for</code>,{" "}
                  <code className={styles.inlineCode}>while</code>
                </li>
                <li>F-strings, <code className={styles.inlineCode}>True</code>/<code className={styles.inlineCode}>False</code></li>
                <li>
                  <code className={styles.inlineCode}>import</code> and Python packages go in{" "}
                  <code className={styles.inlineCode}>$python</code> embeds
                </li>
                <li>
                  Rust is never written as SimBa. Use <code className={styles.inlineCode}>$rust</code> for Rust and crates
                </li>
              </ul>
            </div>
          </section>

          <div className={styles.twoColumn}>
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>
                <Zap className={styles.sectionIcon} />
                Integrating Python Code
              </h2>
              <div className={styles.sectionContent}>
                <p>
                  Most Python is already SimBa. When you need <code className={styles.inlineCode}>import</code>, pip
                  packages, or CPython-only behavior, wrap it in a <code className={styles.inlineCode}>$python</code>{" "}
                  block. The playground runs those embeds.
                </p>

                <div className={styles.codeBlock}>
                  <div className={styles.codeHeader}>python-block.smba</div>
                  <pre>{`print("SimBa is about to run Python")

$python
print("Hello from embedded Python!")
print(2 + 2)

import time
start = time.perf_counter()
total = sum(range(1000))
elapsed = (time.perf_counter() - start) * 1000
print(f"sum = {total}")
print(f"python ms = {elapsed:.3f}")
python$`}</pre>
                </div>

                <p>Python embeds:</p>
                <ul>
                  <li>Use <code className={styles.inlineCode}>$python</code> ... <code className={styles.inlineCode}>python$</code></li>
                  <li>This is where imports and the Python ecosystem live</li>
                  <li>Plain SimBa/Python above the embed stays native SimBa</li>
                </ul>
              </div>
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>
                <Cpu className={styles.sectionIcon} />
                Integrating Rust Code
              </h2>
              <div className={styles.sectionContent}>
                <p>
                  Rust cannot appear as SimBa. Put Rust — including <code className={styles.inlineCode}>fn</code>,{" "}
                  <code className={styles.inlineCode}>use</code>, and crates — inside{" "}
                  <code className={styles.inlineCode}>$rust</code> ... <code className={styles.inlineCode}>rust$</code>.
                </p>

                <div className={styles.codeBlock}>
                  <div className={styles.codeHeader}>rust-block.smba</div>
                  <pre>{`print("SimBa is about to run Rust")

$rust
fn main() {
    println!("Hello from embedded Rust!");
    println!("{}", 2 + 2);
}
rust$`}</pre>
                </div>

                <p>Rust embeds:</p>
                <ul>
                  <li>Required for any Rust syntax or crates</li>
                  <li>The playground runs the embed; the CLI uses rustc</li>
                  <li>SimBa itself stays Python-like</li>
                </ul>
              </div>
            </section>
          </div>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <Shield className={styles.sectionIcon} />
              Types and Safety
            </h2>
            <div className={styles.sectionContent}>
              <p>
                SimBa keeps Python-like code, with extra typing and data-safety rules inspired by Rust. You still write
                SimBa, not Rust. Those rules exist so host programs are less leaky than typical Python. They do not let
                you drop in Rust syntax or crates — that still requires a <code className={styles.inlineCode}>$rust</code>{" "}
                embed.
              </p>

              <div className={styles.codeBlock}>
                <div className={styles.codeHeader}>types-and-safety.smba</div>
                <pre>{`# Optional types on names and functions.
# This is SimBa, not Rust — no fn, no use, no crates.

def add(a: int, b: int) -> int:
    return a + b

count: int = 0
while count < 3:
    count = add(count, 1)
    print(count)

name: str = "SimBa"
print(f"{name} stays Python-like")`}</pre>
              </div>

              <p>What this means in practice:</p>
              <ul>
                <li>Write Python-shaped SimBa for almost everything</li>
                <li>Add types when they help; they are not required</li>
                <li>Python packages still go in <code className={styles.inlineCode}>$python</code></li>
                <li>Rust and its ecosystem only run inside <code className={styles.inlineCode}>$rust</code></li>
              </ul>
            </div>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <Terminal className={styles.sectionIcon} />
              Using the SimBa Playground
            </h2>
            <div className={styles.sectionContent}>
              <p>
                The playground editor, examples panel, and console all run the same SimBa that this guide describes.
                Output (limited) shows program results. Terminal (full) is a command session. Type{" "}
                <code className={styles.inlineCode}>help</code> or <code className={styles.inlineCode}>guide</code> in
                the terminal for the live list.
              </p>

              <div className={styles.commandList}>
                <h4>Available Commands:</h4>
                <ul>
                  <li>
                    <code>help [command]</code> — list commands or explain one
                  </li>
                  <li>
                    <code>examples</code> — list built-in programs
                  </li>
                  <li>
                    <code>open &lt;file|example&gt;</code> — open a saved file, tab, or example
                  </li>
                  <li>
                    <code>run [file]</code> — compile and run SimBa
                  </li>
                  <li>
                    <code>compile [file]</code> — check syntax without executing
                  </li>
                  <li>
                    <code>debug [file]</code> — run with interpreter tracing
                  </li>
                  <li>
                    <code>exec &lt;code&gt;</code> — run inline SimBa
                  </li>
                  <li>
                    <code>ls</code> / <code>tabs</code> — saved files vs open editors
                  </li>
                  <li>
                    <code>new</code> / <code>save</code> / <code>rename</code> / <code>rm</code> — file management
                  </li>
                  <li>
                    <code>mode output|terminal</code> — switch console views
                  </li>
                  <li>
                    <code>theme</code> / <code>accent</code> / <code>settings</code> — appearance
                  </li>
                  <li>
                    <code>clear</code> — clear the console
                  </li>
                </ul>
              </div>

              <div className={styles.codeBlock}>
                <div className={styles.codeHeader}>Playground Example Session</div>
                <pre>{`simba> examples
hello-world.smba
python-block.smba
rust-block.smba
mixed-speed.smba

simba> open hello-world.smba
simba> run
Hello World!

simba> open python-block.smba
simba> run
SimBa is about to run Python
Hello from embedded Python!
4
sum = 499500
python ms = ...

simba> mode terminal
simba> help run`}</pre>
              </div>

              <p>Playground features:</p>
              <ul>
                <li>Python-like SimBa in the editor, including types and f-strings</li>
                <li>
                  Working <code className={styles.inlineCode}>$python</code> and{" "}
                  <code className={styles.inlineCode}>$rust</code> embeds
                </li>
                <li>Built-in examples that match this guide</li>
                <li>Parse errors with hints when syntax is off</li>
              </ul>
            </div>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <Zap className={styles.sectionIcon} />
              Best Practices
            </h2>
            <div className={styles.sectionContent}>
              <p>Follow these guidelines to write SimBa that also runs in the playground:</p>

              <ul>
                <li>
                  <strong>Write Python:</strong> Indentation, <code className={styles.inlineCode}>def</code>,{" "}
                  <code className={styles.inlineCode}>if</code>/<code className={styles.inlineCode}>elif</code>, loops,
                  and f-strings are SimBa
                </li>
                <li>
                  <strong>Use types when they help:</strong>{" "}
                  <code className={styles.inlineCode}>name: str</code> and{" "}
                  <code className={styles.inlineCode}>-&gt; int</code> are optional
                </li>
                <li>
                  <strong>Put imports in embeds:</strong> Python packages live in{" "}
                  <code className={styles.inlineCode}>$python</code> ...{" "}
                  <code className={styles.inlineCode}>python$</code>
                </li>
                <li>
                  <strong>Put Rust in embeds:</strong> Rust syntax and crates live in{" "}
                  <code className={styles.inlineCode}>$rust</code> ...{" "}
                  <code className={styles.inlineCode}>rust$</code>
                </li>
                <li>
                  <strong>Stay in the playground:</strong> If a snippet is on this page, it should run there
                </li>
              </ul>

              <div className={styles.codeBlock}>
                <div className={styles.codeHeader}>best-practices.smba</div>
                <pre>{`# Host SimBa — Python-shaped, optional types
def greet(user: str) -> str:
    return f"Hello, {user}"

print(greet("SimBa"))

# Python ecosystem (imports, pip packages)
$python
print("ecosystem code lives here")
python$

# Rust and crates — never native SimBa
$rust
fn main() {
    println!("native Rust lives here");
}
rust$`}</pre>
              </div>
            </div>
          </section>
        </div>

        <div className={styles.quickStart}>
          <h2 className={styles.quickStartTitle}>Ready to Start Coding?</h2>
          <p className={styles.quickStartText}>
            Jump into the playground. Copy any snippet from this guide, or open an example and press Run.
          </p>
          <Link to="/playground" className={styles.quickStartButton}>
            Open Playground
            <ArrowRight className={styles.buttonIcon} />
          </Link>
        </div>
      </main>
    </div>
  );
}
