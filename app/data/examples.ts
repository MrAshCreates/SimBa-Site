export interface SimBaExample {
  id: string;
  title: string;
  description: string;
  code: string;
}

export const SIMBA_EXAMPLES: SimBaExample[] = [
  {
    id: "hello-world",
    title: "Hello World",
    description: "A simple greeting program showcasing SimBa's Python-like syntax",
    code: `# SimBa Hello World Example
def greet(name: str) -> str:
    return f"Hello, {name}! Welcome to SimBa!"

# Main execution
if __name__ == "__main__":
    message = greet("Developer")
    print(message)
    
    # Demonstrate type safety
    count: int = 42
    print(f"The answer is {count}")`,
  },
  {
    id: "rust-integration",
    title: "Rust Integration",
    description: "Example showing how SimBa integrates Rust code for performance-critical operations",
    code: `# SimBa with embedded Rust for performance
from typing import List

def fibonacci_python(n: int) -> int:
    """Pure Python implementation for comparison"""
    if n <= 1:
        return n
    return fibonacci_python(n - 1) + fibonacci_python(n - 2)

# Embedded Rust block for performance
rust {
    fn fibonacci_rust(n: u32) -> u64 {
        match n {
            0 => 0,
            1 => 1,
            _ => fibonacci_rust(n - 1) + fibonacci_rust(n - 2)
        }
    }
}

# Main execution comparing both approaches
def main():
    n = 20
    
    # Python version
    py_result = fibonacci_python(n)
    print(f"Python fibonacci({n}) = {py_result}")
    
    # Rust version (compiled for speed)
    rust_result = fibonacci_rust(n)
    print(f"Rust fibonacci({n}) = {rust_result}")

if __name__ == "__main__":
    main()`,
  },
  {
    id: "memory-safety",
    title: "Memory Safety",
    description: "Demonstrates SimBa's Rust-inspired memory safety features",
    code: `# SimBa Memory Safety Example
from typing import Optional

class SafeBuffer:
    """A memory-safe buffer implementation"""
    
    def __init__(self, capacity: int):
        self.data: List[int] = []
        self.capacity = capacity
    
    def push(self, value: int) -> bool:
        """Add value if space available"""
        if len(self.data) < self.capacity:
            self.data.append(value)
            return True
        return False
    
    def pop(self) -> Optional[int]:
        """Remove and return last value"""
        if self.data:
            return self.data.pop()
        return None
    
    def get(self, index: int) -> Optional[int]:
        """Safe indexing with bounds checking"""
        if 0 <= index < len(self.data):
            return self.data[index]
        return None

# Usage example
def main():
    buffer = SafeBuffer(5)
    
    # Fill buffer
    for i in range(7):  # Try to add more than capacity
        if buffer.push(i):
            print(f"Added {i}")
        else:
            print(f"Buffer full, cannot add {i}")
    
    # Safe access
    print(f"Element at index 2: {buffer.get(2)}")
    print(f"Element at index 10: {buffer.get(10)}")  # Out of bounds

if __name__ == "__main__":
    main()`,
  },
  {
    id: "concurrency",
    title: "Concurrency",
    description: "Shows SimBa's approach to safe concurrent programming",
    code: `# SimBa Concurrency Example
import asyncio
from typing import List
from concurrent.futures import ThreadPoolExecutor

async def fetch_data(url: str, delay: float) -> str:
    """Simulate async data fetching"""
    await asyncio.sleep(delay)
    return f"Data from {url}"

def cpu_intensive_task(n: int) -> int:
    """CPU-bound task for thread pool"""
    result = 0
    for i in range(n):
        result += i * i
    return result

async def main():
    # Async I/O operations
    print("Starting async operations...")
    
    tasks = [
        fetch_data("api.example.com", 1.0),
        fetch_data("data.service.com", 0.5),
        fetch_data("cache.server.com", 0.3)
    ]
    
    results = await asyncio.gather(*tasks)
    for result in results:
        print(f"Received: {result}")
    
    # CPU-bound operations in thread pool
    print("\\nStarting CPU-intensive tasks...")
    
    with ThreadPoolExecutor(max_workers=3) as executor:
        futures = [
            executor.submit(cpu_intensive_task, 100000),
            executor.submit(cpu_intensive_task, 200000),
            executor.submit(cpu_intensive_task, 150000)
        ]
        
        for i, future in enumerate(futures):
            result = future.result()
            print(f"Task {i + 1} result: {result}")

if __name__ == "__main__":
    asyncio.run(main())`,
  },
];
