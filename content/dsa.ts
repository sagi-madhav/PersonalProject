import { Lesson } from './types';

export const DSA_PATTERNS = [
  'arrays/hashing',
  'two-pointers',
  'sliding-window',
  'stack',
  'binary-search',
  'linked-list',
  'trees',
  'tries',
  'heap/priority-queue',
  'graphs (BFS/DFS)',
  'backtracking',
  'dynamic-programming',
  'greedy',
  'intervals',
  'bit-manipulation',
] as const;

export const DSA_LESSONS: Lesson[] = [
  {
    id: 'dsa-001-big-o',
    track: 'dsa',
    module: 'Foundations',
    order: 1,
    title: 'Big-O Analysis & Space Complexity',
    estMinutes: 12,
    tags: ['big-o', 'complexity', 'analysis'],
    keyPoints: [
      'Big-O describes upper bound asymptotic growth rate as input size N grows to infinity.',
      'Drop constant factors and non-dominant terms (O(2N + 5) becomes O(N)).',
      'Space complexity includes auxiliary working memory plus recursive call stack frames.',
    ],
    body: `### Summary
Algorithmic complexity measures scalability. Time complexity counts dominant operations; space complexity measures maximum simultaneous memory used.

### Complexity Hierarchy (Fastest to Slowest)
1. **O(1)** — Constant time (hash lookup, array index)
2. **O(log N)** — Logarithmic (binary search, balanced BST lookup)
3. **O(N)** — Linear (single pass iteration)
4. **O(N log N)** — Linearithmic (efficient comparison sorting: merge sort, timsort)
5. **O(N²)** — Quadratic (nested loops, bubble sort)
6. **O(2ᴺ)** — Exponential (unmemoized recursive Fibonacci)

### Common Mistakes
- Neglecting the memory footprint of the call stack during deep recursion.
- Assuming \`in\` lookup on a list is O(1) (it is O(N); set/dict lookup is O(1)).`,
  },
  {
    id: 'dsa-002-arrays-hashing',
    track: 'dsa',
    module: 'Core Patterns',
    order: 2,
    title: 'Arrays & Hash Maps: The Two Sum Pattern',
    estMinutes: 15,
    tags: ['arrays', 'hash-map', 'two-sum'],
    keyPoints: [
      'Trade space for time by storing seen values and their indices in a hash map.',
      'Reduces brute-force O(N²) pair searching down to single-pass O(N) time.',
      'Hash collisions are resolved via open addressing or separate chaining.',
    ],
    body: `### Summary
The frequency counting and complement lookup pattern using hash tables is the most common technique for reducing polynomial array problems to linear time.

### Implementation
\`\`\`python
def two_sum(nums: list[int], target: int) -> list[int]:
    seen: dict[int, int] = {} # val -> index
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i
    return []
\`\`\`

### Common Mistakes
- Storing the current number in the hash map before checking for its complement (causes self-pairing if \`target = 2 * num\`).`,
  },
  {
    id: 'dsa-003-two-pointers',
    track: 'dsa',
    module: 'Core Patterns',
    order: 3,
    title: 'Two Pointers Technique',
    estMinutes: 15,
    tags: ['two-pointers', 'arrays', 'in-place'],
    keyPoints: [
      'Opposite-direction pointers converge inwards on sorted sequences (e.g. 3Sum, Valid Palindrome).',
      'Same-direction (fast & slow) pointers find cycles (Floyd\'s algorithm) or remove duplicates in-place.',
      'Allows O(1) auxiliary space operations.',
    ],
    body: `### Summary
Two pointers iterate through collections either towards each other from both ends or in tandem at different speeds to achieve O(N) time and O(1) memory.

### Implementation: Valid Palindrome
\`\`\`python
def is_palindrome(s: str) -> bool:
    left, right = 0, len(s) - 1
    while left < right:
        while left < right and not s[left].isalnum():
            left += 1
        while left < right and not s[right].isalnum():
            right -= 1
        if s[left].lower() != s[right].lower():
            return False
        left += 1
        right -= 1
    return True
\`\`\`

### Common Mistakes
- Missing boundary checks \`left < right\` inside the inner skip loops, leading to index out of bounds.`,
  },
  {
    id: 'dsa-004-sliding-window',
    track: 'dsa',
    module: 'Core Patterns',
    order: 4,
    title: 'Sliding Window (Fixed & Dynamic)',
    estMinutes: 18,
    tags: ['sliding-window', 'strings', 'subarrays'],
    keyPoints: [
      'Maintains a valid subsegment window across contiguous array or string slices.',
      'Fixed window size: slide right edge and drop left edge at equal pace.',
      'Dynamic window size: expand right edge until condition breaks, then contract left edge.',
    ],
    body: `### Summary
Instead of recomputing window metrics from scratch (O(N * K)), the sliding window pattern increments the right pointer and adjusts the left pointer, visiting each element at most twice (O(N) total).

### Implementation: Max Sum Subarray of Size K
\`\`\`python
def max_sub_array_of_size_k(k: int, arr: list[int]) -> int:
    max_sum = 0
    window_sum = sum(arr[:k])
    max_sum = window_sum
    
    for i in range(k, len(arr)):
        window_sum += arr[i] - arr[i - k]
        max_sum = max(max_sum, window_sum)
        
    return max_sum
\`\`\`

### Common Mistakes
- Resetting the left pointer all the way to 0 on violation instead of sliding it forward monotonically.`,
  },
  {
    id: 'dsa-005-binary-search',
    track: 'dsa',
    module: 'Searching & Sorting',
    order: 5,
    title: 'Binary Search & Boundary Invariants',
    estMinutes: 15,
    tags: ['binary-search', 'logarithmic', 'invariants'],
    keyPoints: [
      'Halves the search space each step on monotonic sorted collections in O(log N) time.',
      'Compute midpoint with `mid = left + (right - left) // 2` to prevent integer overflow.',
      'Carefully establish loop invariant: `left <= right` vs `left < right`.',
    ],
    body: `### Summary
Binary search operates on sorted sequences or monotonic predicates (e.g., search space answer feasibility).

### Implementation: Find First Occurrence (Lower Bound)
\`\`\`python
def lower_bound(nums: list[int], target: int) -> int:
    left, right = 0, len(nums)
    while left < right:
        mid = left + (right - left) // 2
        if nums[mid] < target:
            left = mid + 1
        else:
            right = mid
    return left
\`\`\`

### Common Mistakes
- Using \`right = mid - 1\` with \`left < right\`, potentially skipping the target boundary.
- Infinite loops caused by integer division rounding when \`left = mid\`.`,
  },
  {
    id: 'dsa-006-bfs-dfs',
    track: 'dsa',
    module: 'Graphs & Trees',
    order: 6,
    title: 'Graph Traversals: BFS vs DFS',
    estMinutes: 20,
    tags: ['bfs', 'dfs', 'graphs', 'trees'],
    keyPoints: [
      'BFS uses a Queue and visits nodes level by level; optimal for shortest unweighted path.',
      'DFS uses a Stack or recursion to explore deeply; optimal for exhaustive search, topological sort, cycle detection.',
      'Always track a `visited` set to prevent infinite loops in cyclic graphs.',
    ],
    body: `### Summary
Breadth-First Search (BFS) and Depth-First Search (DFS) are fundamental graph exploration algorithms with O(V + E) complexity.

### BFS Implementation
\`\`\`python
from collections import deque

def bfs_shortest_path(graph: dict[str, list[str]], start: str, target: str) -> int:
    queue = deque([(start, 0)]) # (node, distance)
    visited = {start}
    
    while queue:
        node, dist = queue.popleft()
        if node == target:
            return dist
        for neighbor in graph.get(node, []):
            if neighbor not in visited:
                visited.add(neighbor)
                queue.append((neighbor, dist + 1))
    return -1
\`\`\`

### Common Mistakes
- Adding nodes to the \`visited\` set when popping from the queue instead of when pushing to the queue (causes duplicate queue insertions).`,
  },
];
