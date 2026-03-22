# System Architecture

## Architecture

**Monolith**

Screaming Architecture (feature driven)

**Example of features**

```
# example of frontend

├── src
│   ├── App.tsx
│   ├── floor-plan
│   │   ├── api
│   │   ├── components
│   │   ├── FloorPlanEditor.tsx
│   │   ├── hooks
│   │   ├── types
│   │   └── utils
```

## Technologies

- TypeScript
- zod
- Nodejs + express
- React
  - Tailwindcss + Shadcn
  - react query (if needed)
  - zustand (if needed)

## Code helpers

- Husky
- lint-staged

## High-Level Pipeline

```
[Drawing Tool]
      ↓
[Geometry Processing]
      ↓
[Layout Engine]
      ↓
[Output Generator]
      ↓
[Renderer]
```

## Modules

### 1. Frontend

- Drawing UI
- User interaction

### 2. Geometry Layer

- Converts drawing → structured data

### 3. Layout Engine

- Placement logic
- Routing algorithms
- AI enhancement

### 4. Renderer

- SVG (required)
- 3D (optional)

## Data Flow

Input → Normalize → Compute → Enhance → Render
