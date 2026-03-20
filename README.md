# CubePath — Auto Electrical Wiring Planner

A tool that lets users sketch a floor plan, then automatically places outlets and routes wiring.

## Stack

- **Frontend**: React 19 + Vite + TypeScript + TanStack Query
- **Backend**: Node.js + Express + TypeScript
- **Validation**: Zod
- **Package manager**: pnpm (workspaces)
- **Linting / Formatting**: Biome
- **Git hooks**: Husky + lint-staged

## Project Structure

```
cubepath/
├── apps/
│   ├── frontend/   # React app (port 3000)
│   └── backend/    # Express API (port 3001)
├── biome.json
├── tsconfig.base.json
└── pnpm-workspace.yaml
```

## Setup

```bash
pnpm install
```

## Development

```bash
pnpm dev        # starts frontend + backend in parallel
```

## Scripts

| Script          | Description                      |
|-----------------|----------------------------------|
| `pnpm dev`      | Start all apps in watch mode     |
| `pnpm build`    | Build all apps                   |
| `pnpm check`    | Biome lint + format (with fixes) |
| `pnpm lint`     | Biome lint only                  |
| `pnpm format`   | Biome format only                |
