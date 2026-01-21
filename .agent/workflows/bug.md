---
description: Log a bug/mistake and its fix to the memory system
---

# /bug Workflow

When this workflow is triggered, capture the current context as a learning opportunity.

// turbo-all

## Steps

1. **Identify the Bug**
   - Read the current conversation context to understand what went wrong.
   - Extract: What was the error? What was the root cause?

2. **Document the Fix**
   - What solution was applied?
   - Why did it work?

3. **Log to Lessons**
   - Append a new entry to `Second_Brain/.agent/skills/second_brain/memory/lessons.md`
   - Use today's date: `YYYY-MM-DD`
   - Format:
     ```markdown
     ### [Date] - [Short Title]
     **Situation:** [What happened?]
     **What worked:** [The fix]
     **What didn't work:** [The original approach]
     **Lesson:** [What to do differently]
     ```

4. **Confirm to User**
   - Report: "Bug logged to `lessons.md` for future reference."

## Example

If user says `/bug` after fixing a Redis connection issue:

```markdown
### 2026-01-21 - Redis Timeout in Production
**Situation:** Rate limiter throwing connection errors after deploy.
**What worked:** Added reconnection strategy to ioredis config.
**What didn't work:** Default connection settings.
**Lesson:** Always configure explicit reconnection for production Redis.
```
