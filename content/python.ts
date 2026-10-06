import { Lesson } from './types';

export const PYTHON_LESSONS: Lesson[] = [
  {
    id: 'py-001-setup',
    track: 'python',
    module: 'Fundamentals',
    order: 1,
    title: 'Python Setup & Execution Model',
    estMinutes: 10,
    tags: ['setup', 'bytecode', 'venv'],
    keyPoints: [
      'Python executes compiled bytecode inside the CPython Virtual Machine (VM).',
      'Virtual environments (`venv`) isolate package dependencies per project.',
      '`python -m venv .venv` creates an isolated runtime.',
    ],
    body: `### Summary
Python is an interpreted, high-level language with dynamic typing. Source code (.py) is compiled into bytecode (.pyc) and executed by the CPython interpreter.

### Key Points
- **Interpreter vs Compiler:** Source code compiles to bytecode which runs on the CPython VM.
- **Virtual Environments:** Always isolate dependencies using virtual environments. Never install application dependencies into the global system Python.
- **Entry Points:** The \`if __name__ == '__main__':\` idiom prevents code from running when a module is imported.

### Code Sample
\`\`\`python
# Creating and activating a virtual environment
# python -m venv .venv
# source .venv/bin/activate  # macOS/Linux
# .\\.venv\\Scripts\\Activate.ps1 # Windows PowerShell

def main():
    print("Virtual environment active and running cleanly.")

if __name__ == '__main__':
    main()
\`\`\`

### Common Mistakes
- Modifying system Python packages directly without an isolated virtual environment.
- Forgetting that mutable default arguments in functions retain state across calls.`,
  },
  {
    id: 'py-002-data-types',
    track: 'python',
    module: 'Fundamentals',
    order: 2,
    title: 'Variables, Types & String Formatting',
    estMinutes: 15,
    tags: ['types', 'strings', 'f-strings'],
    keyPoints: [
      'Python strings are immutable sequences of Unicode characters.',
      'F-strings provide inline expression evaluation and formatting specifiers.',
      'Type hints improve readability and enable static analysis with mypy.',
    ],
    body: `### Summary
Variables in Python are object references rather than fixed memory slots. Fundamental immutable scalar types include \`int\`, \`float\`, \`bool\`, and \`str\`.

### Key Points
- **F-Strings:** Fast and clean string interpolation introduced in Python 3.6 (\`f"{val:.2f}"\`).
- **Immutability:** Strings cannot be mutated in place; concatenating many strings in a loop creates multiple copies. Use \`"".join(parts)\` instead.
- **Identity vs Equality:** \`==\` compares values, while \`is\` compares exact object identity (memory address).

### Code Sample
\`\`\`python
name: str = "Alex"
weight_lb: float = 175.456

# F-string formatting with precision specifiers
summary = f"User: {name.upper()} | Weight: {weight_lb:.1f} lbs"
print(summary)  # User: ALEX | Weight: 175.5 lbs

# Fast string assembly
tokens = ["clean", "architecture", "code"]
csv_line = ", ".join(tokens)
print(csv_line)
\`\`\`

### Common Mistakes
- Using \`is\` to compare numeric or string values instead of \`==\`.
- Repeated \`+=\` string concatenation inside high-throughput loops.`,
  },
  {
    id: 'py-003-collections',
    track: 'python',
    module: 'Data Structures',
    order: 3,
    title: 'Lists, Tuples & Slicing',
    estMinutes: 15,
    tags: ['lists', 'tuples', 'slicing'],
    keyPoints: [
      'Lists are mutable dynamic arrays with amortized O(1) appends.',
      'Tuples are immutable sequences, hashable when containing immutable elements.',
      'Slicing syntax \`sequence[start:stop:step]\` creates shallow copies.',
    ],
    body: `### Summary
Lists and tuples are fundamental sequential collections in Python. Lists allow modification and growth, while tuples guarantee fixed sequence integrity.

### Key Points
- **Amortized Append:** Python lists resize exponentially, providing amortized O(1) appends.
- **Tuples as Records:** Tuples are faster and consume less memory than lists. They can serve as dictionary keys if all items are hashable.
- **Slicing:** Negative indices count from the end. Step values allow reversing (\`[::-1]\`).

### Code Sample
\`\`\`python
# Slicing & manipulation
scores = [10, 20, 30, 40, 50, 60]

first_three = scores[:3]     # [10, 20, 30]
last_two = scores[-2:]       # [50, 60]
reversed_copy = scores[::-1] # [60, 50, 40, 30, 20, 10]

# Tuple unpacking
user_record = ("usr_102", "Alex", True)
user_id, username, is_active = user_record
\`\`\`

### Common Mistakes
- Modifying a list while iterating over it with a \`for\` loop.
- Using \`list.insert(0, item)\` repeatedly (O(n) shift) instead of \`collections.deque.appendleft()\`.`,
  },
  {
    id: 'py-004-dicts',
    track: 'python',
    module: 'Data Structures',
    order: 4,
    title: 'Dictionaries & Hash Maps',
    estMinutes: 15,
    tags: ['dict', 'hashing', 'collections'],
    keyPoints: [
      'Dictionaries are hash tables with guaranteed insertion ordering since Python 3.7.',
      'Lookups, insertions, and deletions have average O(1) time complexity.',
      'Keys must be hashable (implementing `__hash__` and `__eq__`).',
    ],
    body: `### Summary
Python dictionaries are compact, ordered hash maps. Keys are hashed using siphash, allowing constant-time O(1) lookup on average.

### Key Points
- **Insertion Order:** Dicts preserve insertion ordering by maintaining a dense array of entries and a sparse hash table.
- **Safe Retrieval:** Use \`.get(key, default)\` or \`collections.defaultdict\` to avoid \`KeyError\`.
- **Merging:** Python 3.9+ supports the pipe operator \`|\` for dict merging (\`a | b\`).

### Code Sample
\`\`\`python
from collections import defaultdict

# Grouping with defaultdict
workouts_by_split = defaultdict(list)
workouts_by_split["upper"].append("Bench Press")
workouts_by_split["upper"].append("Lat Pulldown")

# Modern dictionary merge
base_config = {"theme": "dark", "units": "lb"}
user_override = {"units": "kg"}
final_config = base_config | user_override
print(final_config)  # {'theme': 'dark', 'units': 'kg'}
\`\`\`

### Common Mistakes
- Attempting to use mutable types like lists or sets as dictionary keys.
- Catching \`KeyError\` instead of utilizing \`.get()\` or \`setdefault()\`.`,
  },
  {
    id: 'py-005-comprehensions',
    track: 'python',
    module: 'Functional Tools',
    order: 5,
    title: 'Comprehensions & Generator Expressions',
    estMinutes: 12,
    tags: ['comprehensions', 'generators', 'memory'],
    keyPoints: [
      'List comprehensions are faster than manual append loops because bytecode bypasses attribute lookups.',
      'Generator expressions evaluate lazily, consuming O(1) memory for streams.',
      'Dict comprehensions concisely transform key-value datasets.',
    ],
    body: `### Summary
Comprehensions provide concise syntax for filtering and transforming collections. Generator expressions provide lazy iterator evaluation.

### Key Points
- **Eager vs Lazy:** List comprehensions \`[x for x in data]\` evaluate immediately into memory. Generator expressions \`(x for x in data)\` yield items on demand.
- **Readable Filtering:** Keep comprehensions to a single \`for\` and optional \`if\`. If nested deeper, prefer regular loops.

### Code Sample
\`\`\`python
# List comprehension with filter
numbers = [1, 2, 3, 4, 5, 6, 7, 8]
evens_squared = [n ** 2 for n in numbers if n % 2 == 0]

# Dict comprehension
names = ["bench", "squat", "deadlift"]
name_lengths = {name: len(name) for name in names}

# Memory-efficient generator expression
huge_sum = sum(x * 2 for x in range(1_000_000))
\`\`\`

### Common Mistakes
- Creating massive list comprehensions that load gigabytes into memory when a generator expression suffices.
- Over-complicating comprehensions with multiple nested loops.`,
  },
  {
    id: 'py-006-functions-decorators',
    track: 'python',
    module: 'Advanced Python',
    order: 6,
    title: 'Decorators, Closures & Context Managers',
    estMinutes: 18,
    tags: ['decorators', 'closures', 'context-managers'],
    keyPoints: [
      'Decorators wrap function execution using closures and `@functools.wraps`.',
      'Context managers (`with`) guarantee resource release via `__enter__` and `__exit__`.',
      '`*args` and `**kwargs` capture positional and keyword arguments dynamically.',
    ],
    body: `### Summary
Functions in Python are first-class objects that can be passed as arguments, assigned to variables, and returned from other functions. Decorators exploit this to modify behavior cleanly.

### Key Points
- **Functools Wraps:** Always apply \`@functools.wraps(func)\` inside a decorator to preserve function name and docstrings.
- **Context Managers:** Ensure file handles, database connections, and locks are closed even if exceptions occur.

### Code Sample
\`\`\`python
import time
from functools import wraps

def timeit(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        start = time.perf_counter()
        result = func(*args, **kwargs)
        duration = time.perf_counter() - start
        print(f"{func.__name__} took {duration:.4f}s")
        return result
    return wrapper

@timeit
def compute_heavy_task(n: int) -> int:
    return sum(i * i for i in range(n))
\`\`\`

### Common Mistakes
- Omitting \`@wraps(func)\`, which obscures debugging stack traces.
- Opening files without \`with open(...) as f:\`.`,
  },
];

export const PYTHON_CHEAT_SHEET = `# Python 3 Quick Syntax Reference

### 1. String Slicing & Formatting
\`\`\`python
s = "Hello World"
s[0:5]       # 'Hello'
s[-5:]       # 'World'
s[::-1]      # 'dlroW olleH' (reversed)

# F-strings
val = 42.1234
f"{val:.2f}" # '42.12'
f"{val:>10}" # '     42.12' (right align)
\`\`\`

### 2. Comprehensions
\`\`\`python
[x * 2 for x in items if x > 0]       # List
{k: v for k, v in pairs}               # Dict
{x for x in duplicates}                # Set
(x * 2 for x in stream)                # Generator
\`\`\`

### 3. Context Managers (\`with\`)
\`\`\`python
# File handling
with open("data.txt", "r", encoding="utf-8") as f:
    content = f.read()

# Custom context manager
from contextlib import contextmanager

@contextmanager
def managed_resource():
    print("Acquiring...")
    yield "resource"
    print("Releasing...")
\`\`\`

### 4. Dataclasses
\`\`\`python
from dataclasses import dataclass

@dataclass(frozen=True)
class Exercise:
    id: str
    name: str
    muscle_group: str
    default_rest: int = 90
\`\`\`

### 5. Type Hints
\`\`\`python
from typing import Optional, List, Dict, Callable

def process_sets(
    sets: List[Dict[str, float]], 
    callback: Optional[Callable[[int], None]] = None
) -> float:
    return sum(s.get("weight", 0) for s in sets)
\`\`\`

### 6. Standard Library Must-Haves
- \`collections.defaultdict\` & \`collections.Counter\`
- \`itertools.chain\`, \`itertools.groupby\`
- \`functools.lru_cache\`
- \`pathlib.Path\`
`;
