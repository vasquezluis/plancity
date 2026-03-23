# Auto Electrical Wiring Planner — Planning

## Purpose

Central guide for building the project.
Use this file to understand order, scope, and references.

## Docs Reference

- 01-overview.md → Project goal
- 02-architecture.md → System design
- 03-frontend-drawing.md → Drawing tool
- 04-geometry-processing.md → Data structuring
- 05-layout-engine.md → Placement + routing
- 06-api-design.md → Backend API
- 07-rendering.md → SVG / 3D output
- 08-ai-integration.md → AI enhancements
- 09-development-phases.md → Milestones
- 10-demo-script.md → Final demo
- 11-3d-viewer-plan.md → Extra (3D viewer plan)
- 13-spotlight-tutorial-tour.md → How to use the app

## Phases Order (Follow Strictly)

- **DO NOT** create project as a whole
- Create the project phase by phase
- **Wait** for developer review before going to the next phase
- **Always** mark with [✅] the phase when finish

## Build Order (Follow Strictly)

1. Frontend drawing tool  
   → Output walls + doors as JSON

2. Geometry processing  
   → Normalize coordinates

3. Basic layout engine  
   → Place outlets along walls

4. Simple rendering  
   → Draw walls + outlets + straight wires

5. Routing engine  
   → Implement A\* to avoid walls

6. API layer  
   → Move logic to backend

7. AI integration (optional)  
   → Improve layout suggestions

8. Metrics + polish

## Core Data Contract

```json
{
  "walls": [],
  "doors": [],
  "rooms": [],
  "electrical": {
    "outlets": [],
    "switches": [],
    "panel": {}
  },
  "wires": []
}
```

## Rules

- Keep everything simple
- Do not block on AI
- Always maintain a working pipeline
- Prefer visual output over perfect logic

## Definition of Done

- User draws layout
- Click "Generate"
- System shows:
  - Outlets
  - Wires
- Output rendered clearly

## Start Point

Begin with:

→ 03-frontend-drawing.md
