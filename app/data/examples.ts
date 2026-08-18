export interface SimBaExample {
  id: string;
  title: string;
  description: string;
  code: string;
}

export function exampleFileName(example: SimBaExample): string {
  return `${example.id}.smba`;
}

export function findExampleByFilename(name: string): SimBaExample | undefined {
  const normalized = name.replace(/^examples\//, "").toLowerCase();
  const withoutExt = normalized.replace(/\.smba$/, "");
  return SIMBA_EXAMPLES.find(
    (example) =>
      exampleFileName(example) === normalized ||
      example.id === withoutExt ||
      example.title.toLowerCase().replace(/\s+/g, "-") === withoutExt,
  );
}

export const SIMBA_EXAMPLES: SimBaExample[] = [
  {
    id: "hello-world",
    title: "Hello World",
    description: "Print a message with Python-style SimBa syntax.",
    code: `print("Hello World!")
`,
  },
  {
    id: "fizzbuzz",
    title: "FizzBuzz",
    description: "A complete loop program using for, elif, and modulo.",
    code: `def label(n) {
    if n % 15 == 0 {
        return "FizzBuzz"
    } elif n % 3 == 0 {
        return "Fizz"
    } elif n % 5 == 0 {
        return "Buzz"
    } else {
        return str(n)
    }
}

for i in range(1, 21) {
    print(label(i))
}
`,
  },
  {
    id: "factorial",
    title: "Factorial",
    description: "Typed integers, functions, and a useful math routine.",
    code: `def factorial(n: int) {
    if n <= 1 {
        return 1
    }
    return n * factorial(n - 1)
}

n: int = 6
print("factorial(" + str(n) + ") = " + str(factorial(n)))
print("min/max check: " + str(min(n, 10)) + " " + str(max(n, 10)))
`,
  },
  {
    id: "variables",
    title: "Variables",
    description: "Assign integers in SimBa, with Python and Rust forms shown as comments.",
    code: `# SimBa / Python-style
count = 5

# Typed SimBa
total: int = 10

# Rust-style SimBa
let size: int = 20

print(count + total + size)
`,
  },
  {
    id: "functions",
    title: "Functions",
    description: "Define functions with def, call them, and return values.",
    code: `def greet(name) {
    print("Hello, " + name + "!")
}

userName = "SimBa"
greet(userName)

def add(a, b) {
    return a + b
}

result = add(5, 10)
print(result)
`,
  },
  {
    id: "control-flow",
    title: "Loops & Conditions",
    description: "Use if/else and while. Parentheses around conditions are optional.",
    code: `x = 5

if x > 0 {
    print("positive")
} else {
    print("not positive")
}

i = 0
while i < 5 {
    print(i)
    i = i + 1
}

if x % 2 == 0 {
    print("even")
} else {
    print("odd")
}
`,
  },
  {
    id: "python-block",
    title: "Embedded Python",
    description: "Run a real Python 3 subprocess from a SimBa script.",
    code: `print("SimBa is about to run Python")

$python
print("Hello from embedded Python!")
print(2 + 2)
python$
`,
  },
  {
    id: "rust-block",
    title: "Embedded Rust",
    description: "Compile and run a real rustc program from a SimBa script.",
    code: `print("SimBa is about to run Rust")

$rust
fn main() {
    println!("Hello from embedded Rust!");
    println!("{}", 2 + 2);
}
rust$
`,
  },
  {
    id: "mixed-speed",
    title: "Mixed Speed Lab",
    description:
      "One file with SimBa, two Python embeds, and two Rust embeds. Times the same sum in all three languages.",
    code: `# SimBa writes like Python, runs as a compiled-host language,
# and can embed real Python and Rust in the same file.

n = 2000000
print("Counting sum of 0.." + str(n - 1) + " in three languages")
print("")

print("=== SimBa interpreted loop ===")
start = clock()
total = 0
i = 0
while i < n {
    total = total + i
    i = i + 1
}
simba_ms = clock() - start
print("sum = " + str(total))
print("simba ms = " + str(simba_ms))
print("")

$python
import time

N = 2000000
start = time.perf_counter()
total = 0
i = 0
while i < N:
    total += i
    i += 1
elapsed = (time.perf_counter() - start) * 1000
print("=== Python while loop ===")
print(f"sum = {total}")
print(f"python ms = {elapsed:.3f}")
print("")
python$

$python
import time

N = 2000000
start = time.perf_counter()
total = sum(range(N))
elapsed = (time.perf_counter() - start) * 1000
print("=== Python builtin sum(range) ===")
print(f"sum = {total}")
print(f"python builtin ms = {elapsed:.3f}")
print("")
python$

$rust
use std::hint::black_box;
use std::time::Instant;

fn main() {
    let n: i64 = black_box(2000000);
    let start = Instant::now();
    let mut total: i64 = 0;
    let mut i: i64 = 0;
    while i < n {
        total += black_box(i);
        i += 1;
    }
    let ms = start.elapsed().as_secs_f64() * 1000.0;
    println!("=== Rust while loop ===");
    println!("sum = {}", total);
    println!("rust ms = {:.3}", ms);
    println!();
}
rust$

$rust
use std::hint::black_box;

fn main() {
    let n: i64 = black_box(2000000);
    let start = std::time::Instant::now();
    let total: i64 = (0..n).map(black_box).sum();
    let ms = start.elapsed().as_secs_f64() * 1000.0;
    println!("=== Rust iterator sum ===");
    println!("sum = {}", total);
    println!("rust iter ms = {:.3}", ms);
    println!();
}
rust$

# Extra SimBa checks in the same program
def greet(name) {
    print("Hello, " + name)
}

greet("SimBa")

x = 42
if x % 2 == 0 {
    print("42 is even")
} else {
    print("42 is odd")
}

print("string + number = " + 7)
print("done")
`,
  },
];
