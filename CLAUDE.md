### 🔄 Project Awareness & Context

- **Always read `PLANNING.md`** in `/docs` at the start of a new conversation to understand the project's architecture, goals, style, and constraints.
- **Use consistent naming conventions, file structure, and architecture patterns** as described in `PLANNING.md`.

### 🧱 Code Structure & Modularity

- **Never create a file longer than 500 lines of code.** If a file approaches this limit, refactor by splitting it into modules or helper files.
- **Use clear, consistent imports** (prefer relative imports within packages).

### 🧪 Testing & Reliability

- **Always create unit tests for new features**
- **After updating any logic**, check whether existing unit tests need to be updated. If so, do it.
- **Tests should live in a `/tests` folder** mirroring the main app structure.
  - Include at least:
    - 1 test for expected use
    - 1 edge case
    - 1 failure case

### 🔌 MCP Server Usage

#### Context7

- **Use for external documentation**: Get docs for nodejs, express, typescript and reactjs

### 📎 Style & Conventions

- **Use Typescript** as the primary language.
- **Use pnpm** as the primary package manager
- **Follow Biome**, use type hints, and format with `biome`.
- **Use `zod` for data validation**.

### 📚 Documentation & Explainability

- **Update `README.md`** when new features are added, dependencies change, or setup steps are modified.
- **Comment non-obvious code** and ensure everything is understandable to a mid-level developer.
- When writing complex logic, **add an inline `# Reason:` comment** explaining the why, not just the what.

### 🧠 AI Behavior Rules

- **Never assume missing context. Ask questions if uncertain.**
- **Never hallucinate libraries or functions** – only use known, verified npm packages.
- **Always use context7 MCP for latest docs** - only use know, verified latest docs.
- **Always confirm file paths and module names** exist before referencing them in code or tests.
