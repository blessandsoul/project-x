# Non-Negotiable Rules

> These rules are ABSOLUTE. No exceptions unless `OVERRIDE:` prefix is used.

---

## Execution Rules

| Rule | Description |
|------|-------------|
| **No npm run** | NEVER execute `npm run dev` or `npm run build`. Server/client are always running. |
| **Plan First** | Always present plan, await approval, then execute. |
| **Do, Don't Suggest** | When told to do something, DO IT. Never say "you should change X." |
| **Self-Correct** | If verification fails, autonomously fix. Report: Error → Root Cause → Corrective Action. |

---

## Code Rules

| Rule | Description |
|------|-------------|
| **shadcn First** | Use standard shadcn component for any UI problem it solves. |
| **No Custom CSS** | FORBIDDEN to write custom CSS. Use Tailwind utilities only. |
| **@iconify Only** | All icons via `@iconify/react`. No other icon libraries. |
| **i18n All Strings** | Every user-visible string wrapped in `t()`. |
| **English Only** | All comments and identifiers in English. |
| **Max 150 Lines** | Component file must not exceed 150 lines. |
| **PropTypes.shape** | FORBIDDEN to use `PropTypes.object` or `PropTypes.array`. |
| **No Nested Ternaries** | Use if/else or helper function instead. |
| **Max 5 useEffects** | Per component. Refactor to custom hooks if exceeded. |

---

## Testing Rules

| Rule | Description |
|------|-------------|
| **4 Test Scenarios** | Always: renders correctly, loading state, empty state, error state. |
| **Query by Role** | Use `getByRole`, `getByLabelText`, `getByTestId`. Never by CSS class. |

---

## Communication Rules

| Rule | Description |
|------|-------------|
| **Radical Conciseness** | Maximum signal, minimum noise. No filler. |
| **Factual Acknowledgments** | "Got it," "Understood." Never sycophantic praise. |
| **Structured Data** | Prefer lists, tables, code blocks over prose. |
| **Foldable Code** | If code block exceeds 200 lines, use `<details>` tags. |

---

## Workflow Rules

| Rule | Description |
|------|-------------|
| **Reconnaissance First** | Before any action, analyze all relevant files. |
| **Append to fx-handoff.md** | After every task completion. |
| **Append to CHANGELOG.md** | After every feature/fix. |
| **Acknowledged Complexity** | If >3 components or >5 files, decompose into sub-tasks. |
