---
description: Generate a session summary for context restoration
---

# /memorydump Workflow

When this workflow is triggered, generate a comprehensive session summary that can be used to restore context in a future session.

// turbo-all

## Steps

1. **Summarize Completed Work**
   - List all tasks/changes completed in this session.
   - Reference specific files modified.

2. **Summarize Pending/Broken Items**
   - What is currently broken or incomplete?
   - What errors are unresolved?

3. **Summarize Next Steps**
   - What should be done next?
   - Any blockers or dependencies?

4. **Output Formatted Block**
   - Generate a markdown block formatted for copy-paste into next session.

## Output Format

```markdown
## Memory Dump - [Date]

### ✅ Completed
- [Task 1]: [Brief description] (`file1.ts`, `file2.ts`)
- [Task 2]: [Brief description]

### 🔴 Broken/Pending
- [Issue 1]: [Description]
- [Issue 2]: [Description]

### 📋 Next Steps
1. [Next action 1]
2. [Next action 2]

### 🧠 Context Notes
- [Important context that should not be forgotten]
- [Key decisions made this session]
```

## Usage

User pastes this output at the start of the next session to instantly restore agent context.
