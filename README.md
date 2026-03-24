# PlanCity

**Quick Wiring Sketch Tool**

A lightweight tool for sketching a rough electrical wiring plan before working with a licensed electrician. Draw walls and doors, hit Generate, and get a suggested outlet placement and wire route in seconds.

> **Not a replacement for professional tools or a licensed electrician.** PlanCity is meant for quick ideation and communication — not code-compliant electrical design.

## Stack

- **Frontend**: React 19 + Vite + TypeScript
- **Backend**: Node.js + Express + TypeScript
- **Validation**: Zod
- **Package manager**: pnpm (workspaces)
- **Linting / Formatting**: Biome

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

| Script        | Description                      |
| ------------- | -------------------------------- |
| `pnpm dev`    | Start all apps in watch mode     |
| `pnpm build`  | Build all apps                   |
| `pnpm check`  | Biome lint + format (with fixes) |
| `pnpm lint`   | Biome lint only                  |
| `pnpm format` | Biome format only                |
