import React from "react";
import { Link } from "react-router";
import { Book, Code, Cpu, Shield, Terminal, Zap, ArrowRight } from "lucide-react";
import type { Route } from "./+types/guide";
import { Navigation } from "~/components/navigation/navigation";
import styles from "./guide.module.css";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "SimBa Programming Guide - Learn Hybrid Python/Rust Development" },
    {
      name: "description",
      content:
        "Complete guide to programming in SimBa. Learn how to combine Python's ease-of-use with Rust's performance and safety in our hybrid programming language.",
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
            Learn how to harness the power of Python's simplicity with Rust's performance and safety
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
                SimBa is a revolutionary hybrid programming language that combines the best of two worlds: Python's
                intuitive syntax and rapid development capabilities with Rust's blazing performance and memory safety
                guarantees.
              </p>
              <p>
                Unlike traditional languages that force you to choose between ease-of-use and performance, SimBa allows
                you to write expressive, readable code that compiles to efficient machine code while preventing common
                programming errors like null pointer dereferences and buffer overflows.
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
                SimBa uses Python's familiar indentation-based syntax, making it immediately accessible to Python
                developers while adding static typing for better performance and safety.
              </p>

              <div className={styles.codeBlock}>
                <div className={styles.codeHeader}>basic_syntax.smba</div>
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

              <p>Key syntax features:</p>
              <ul>
                <li>Indentation-based code blocks (like Python)</li>
                <li>Static type annotations for variables and functions</li>
                <li>
                  Familiar keywords: <code className={styles.inlineCode}>def</code>,{" "}
                  <code className={styles.inlineCode}>if</code>, <code className={styles.inlineCode}>else</code>,{" "}
                  <code className={styles.inlineCode}>for</code>, <code className={styles.inlineCode}>while</code>
                </li>
                <li>F-string formatting for easy string interpolation</li>
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
                  SimBa allows you to seamlessly embed Python code for rapid prototyping and accessing the vast Python
                  ecosystem.
                </p>

                <div className={styles.codeBlock}>
                  <div className={styles.codeHeader}>python_integration.smba</div>
                  <pre>{`# Embed Python code blocks
python {
    import numpy as np
    import matplotlib.pyplot as plt
    
    def create_plot(data):
        plt.plot(data)
        plt.show()
        return "Plot created"
}

# Call Python functions from SimBa
def analyze_data(values: list[float]) -> str:
    # Convert SimBa data to Python
    python_result = python.create_plot(values)
    return python_result

# Use Python libraries
def calculate_stats(numbers: list[float]) -> dict:
    python {
        mean = np.mean(numbers)
        std = np.std(numbers)
        return {"mean": mean, "std": std}
    }`}</pre>
                </div>

                <p>Python integration features:</p>
                <ul>
                  <li>Direct access to Python libraries</li>
                  <li>Seamless data type conversion</li>
                  <li>Runtime Python execution</li>
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
                  For performance-critical sections, SimBa allows you to embed Rust code that compiles to native machine
                  code.
                </p>

                <div className={styles.codeBlock}>
                  <div className={styles.codeHeader}>rust_integration.smba</div>
                  <pre>{`# Embed Rust code for performance
rust {
    pub extern "C" fn fast_fibonacci(n: u64) -> u64 {
        match n {
            0 => 0,
            1 => 1,
            _ => fast_fibonacci(n - 1) + fast_fibonacci(n - 2)
        }
    }
    
    pub extern "C" fn process_array(
        data: *const f64, 
        len: usize
    ) -> f64 {
        let slice = unsafe { 
            std::slice::from_raw_parts(data, len) 
        };
        slice.iter().sum()
    }
}

# Call Rust functions from SimBa
def compute_large_fibonacci(n: int) -> int:
    return rust.fast_fibonacci(n)

def sum_array(numbers: list[float]) -> float:
    return rust.process_array(numbers)`}</pre>
                </div>

                <p>Rust integration features:</p>
                <ul>
                  <li>Zero-cost abstractions</li>
                  <li>Memory safety guarantees</li>
                  <li>Native performance</li>
                </ul>
              </div>
            </section>
          </div>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <Shield className={styles.sectionIcon} />
              Memory Safety & Concurrency
            </h2>
            <div className={styles.sectionContent}>
              <p>
                SimBa adopts Rust's ownership model to prevent memory leaks and data races while maintaining Python's
                ease of use.
              </p>

              <div className={styles.codeBlock}>
                <div className={styles.codeHeader}>memory_safety.smba</div>
                <pre>{`# Safe buffer management
def safe_buffer_example():
    # SimBa prevents buffer overflows
    buffer = SafeBuffer::new(10)
    
    # Ownership transfer
    data = vec![1, 2, 3, 4, 5]
    buffer.extend(data)  # data is moved, not copied
    
    return buffer.len()

# Concurrent processing without GIL
async def concurrent_processing(tasks: list[str]) -> list[str]:
    results = []
    
    # True parallelism (no GIL)
    for task in tasks.parallel():
        result = await process_task(task)
        results.append(result)
    
    return results

# Borrowing and references
def borrow_example(data: &mut list[int]):
    # Mutable borrow - no data copying
    data.append(42)
    data.sort()  # In-place sorting`}</pre>
              </div>

              <p>Safety features:</p>
              <ul>
                <li>Ownership system prevents memory leaks</li>
                <li>Borrowing eliminates unnecessary copying</li>
                <li>No Global Interpreter Lock (GIL) for true parallelism</li>
                <li>Compile-time prevention of data races</li>
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
                The SimBa Playground provides an interactive environment to experiment with SimBa code, manage files,
                and see real-time results.
              </p>

              <div className={styles.commandList}>
                <h4>Available Commands:</h4>
                <ul>
                  <li>
                    <code>run &lt;filename&gt;</code> - Execute a SimBa file
                  </li>
                  <li>
                    <code>exec &lt;code&gt;</code> - Execute SimBa code directly
                  </li>
                  <li>
                    <code>ls</code> - List all files in the workspace
                  </li>
                  <li>
                    <code>clear</code> - Clear the terminal output
                  </li>
                  <li>
                    <code>help</code> - Show available commands
                  </li>
                  <li>
                    <code>examples</code> - Load example SimBa programs
                  </li>
                </ul>
              </div>

              <div className={styles.codeBlock}>
                <div className={styles.codeHeader}>Playground Example Session</div>
                <pre>{`$ exec def greet(): print("Hello, SimBa!")
$ run hello.smba
Hello, SimBa!

$ ls
hello.smba
fibonacci.smba
examples/

$ examples
Loaded example files:
- basic_syntax.smba
- python_integration.smba
- rust_performance.smba

$ run examples/fibonacci.smba
Fibonacci sequence: 0, 1, 1, 2, 3, 5, 8, 13, 21, 34`}</pre>
              </div>

              <p>Playground features:</p>
              <ul>
                <li>Real-time code execution and feedback</li>
                <li>File management and organization</li>
                <li>Built-in examples and tutorials</li>
                <li>Error reporting with helpful suggestions</li>
              </ul>
            </div>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <Zap className={styles.sectionIcon} />
              Best Practices
            </h2>
            <div className={styles.sectionContent}>
              <p>Follow these guidelines to write efficient and maintainable SimBa code:</p>

              <ul>
                <li>
                  <strong>Use static typing:</strong> Always specify types for function parameters and return values
                </li>
                <li>
                  <strong>Leverage Python for prototyping:</strong> Use Python blocks for rapid development and library
                  access
                </li>
                <li>
                  <strong>Optimize with Rust:</strong> Move performance-critical code to Rust blocks
                </li>
                <li>
                  <strong>Embrace ownership:</strong> Use borrowing to avoid unnecessary data copying
                </li>
                <li>
                  <strong>Handle errors explicitly:</strong> Use Result types for error-prone operations
                </li>
                <li>
                  <strong>Write readable code:</strong> SimBa's syntax encourages clear, expressive programming
                </li>
                <li>
                  <strong>Test thoroughly:</strong> Use the playground to experiment and validate your code
                </li>
              </ul>

              <div className={styles.codeBlock}>
                <div className={styles.codeHeader}>best_practices.smba</div>
                <pre>{`# Good: Clear types and error handling
def process_file(filename: str) -> Result[str, str]:
    try:
        content = read_file(filename)
        processed = content.upper().strip()
        return Ok(processed)
    except FileNotFoundError:
        return Err(f"File {filename} not found")

# Good: Efficient data processing
def analyze_large_dataset(data: &list[float]) -> Statistics:
    # Use Rust for heavy computation
    rust {
        pub extern "C" fn compute_stats(
            data: *const f64, 
            len: usize
        ) -> (f64, f64, f64) {
            // Fast statistical computation
        }
    }
    
    mean, median, std = rust.compute_stats(data)
    return Statistics(mean, median, std)`}</pre>
              </div>
            </div>
          </section>
        </div>

        <div className={styles.quickStart}>
          <h2 className={styles.quickStartTitle}>Ready to Start Coding?</h2>
          <p className={styles.quickStartText}>
            Jump into the SimBa Playground and start experimenting with hybrid Python/Rust programming today!
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
