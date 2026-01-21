# Code Standards Protocol

## General Principles

1. **Readability over cleverness** — Write code humans can understand
2. **DRY (Don't Repeat Yourself)** — Extract common logic
3. **KISS (Keep It Simple)** — Avoid over-engineering
4. **Single Responsibility** — Each function/class does one thing

## Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Variables | camelCase or snake_case | `userName` or `user_name` |
| Constants | UPPER_SNAKE_CASE | `MAX_RETRIES` |
| Functions | camelCase or snake_case | `getUserData()` |
| Classes | PascalCase | `UserController` |
| Files | kebab-case or snake_case | `user-service.js` |

## Code Structure

```
1. Imports/Dependencies
2. Constants
3. Types/Interfaces
4. Main Logic
5. Helper Functions
6. Exports
```

## Error Handling

- Always handle errors explicitly
- Use try/catch for async operations
- Provide meaningful error messages
- Log errors appropriately

## Comments

- Explain "why", not "what"
- Document public APIs
- Remove commented-out code
- Keep comments up to date
