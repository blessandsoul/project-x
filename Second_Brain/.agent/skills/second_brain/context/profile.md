# User Profile

> Second Brain reads this to personalize responses.

---

## Identity
- **Role:** Full-Stack Developer / Project Lead
- **Primary Project:** Project-X (Car Import Platform)
- **Primary Language:** Georgian (ქართული)
- **Response Language:** English (100%)

---

## Communication Style

| Preference | Description |
|------------|-------------|
| **Directness** | No fluff, no filler. Maximum signal, minimum noise. |
| **Format** | Lists, tables, code blocks over prose. |
| **Acknowledgments** | "Got it," "Understood." Never sycophantic praise. |
| **Execution** | When told to do something, DO IT. Never say "you should change X" — just change it. |

---

## Workflow Preferences

1. **Plan First, Always** — Present plan, await approval, then execute.
2. **Decompose Complexity** — If task touches >5 files or >3 components, break into sub-tasks.
3. **Self-Correct** — If verification fails, autonomously fix without asking.
4. **No npm run** — Server and client are ALWAYS running. Never execute `npm run dev` or `npm run build`.

---

## Technical Stack

| Layer | Technology |
|-------|------------|
| Frontend | React, TypeScript, Vite, shadcn/ui, Tailwind CSS, Framer Motion |
| Backend | Fastify, TypeScript, MySQL, Redis |
| i18n | react-i18next (EN, KA, RU) |
| Icons | @iconify/react (tree-shaking required) |
| Deployment | Coolify, Docker |

---

## Code Standards (Non-Negotiable)

- **shadcn First** — Use standard components, no custom CSS.
- **i18n All Strings** — Every user-visible string wrapped in `t()`.
- **English Only** — All comments and identifiers in English.
- **Max 150 Lines** — Per component file.
- **PropTypes.shape** — Never use `.object` or `.array`.
- **Test Edge Cases** — Always: render, loading, empty, error states.

---

## Pain Points (What to Avoid)

1. **Context Drift** — Saying something today that contradicts yesterday.
2. **Forgetting Decisions** — Re-suggesting something we already rejected.
3. **Placeholder Advice** — Generic responses that don't use real project context.
4. **Asking Permission for Obvious Actions** — If it's in the plan, just do it.

---

## Decision-Making Style

- **Data-Driven** — Show evidence, not opinions.
- **Quick on Reversible Decisions** — Move fast if we can undo.
- **Thorough on Irreversible Decisions** — Architecture, DB schema, public API.

---

## Notes

- Georgian market focus (USA → Georgia car imports)
- Heavy emphasis on i18n quality (3 languages)
- Deployment via Coolify to VPS
- Uses multi-agent system (Second Brain → Coder, UI/UX)
