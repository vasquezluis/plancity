# Context

PlanCity needs a first-visit tutorial so new users understand the core workflow.
The UX pattern is a **single modal popup with Lottie animations** (like GIFs) showing
how to use each feature — not a step-by-step spotlight tour.

The modal opens automatically on the first visit (localStorage) and can be
reopened at any time via a "?" help button in the editor.

---

## Approach

**Library stack:**

- `lottie-react` — renders `.json` Lottie animation files as looping animated previews
- `@radix-ui/react-dialog` — accessible modal, consistent with existing Radix UI usage

**Remove:**

- `driver.js` (uninstall + remove its CSS from `index.css`)

**localStorage key:** `plancity:tutorial:seen` — set to `'1'` on dismiss

---

## Modal Layout

```
┌──────────────────────────────────────────────────┐
│  How to use PlanCity                          [×] │
├──────────────────────────────────────────────────┤
│                                                  │
│   ┌──────────────────────────────────────────┐   │
│   │                                          │   │
│   │         Lottie animation (~300px)        │   │
│   │                                          │   │
│   └──────────────────────────────────────────┘   │
│                                                  │
│   Step Title                                     │
│   Short description of what the animation shows  │
│                                                  │
├──────────────────────────────────────────────────┤
│   ←    ● ● ○ ○    →                   [Got it]   │
└──────────────────────────────────────────────────┘
```

4 slides total. "Got it" only shown on last slide; closes + marks seen.

---

## Animation Slides

| #   | Title                      | Description                                                                                                 | File                   |
| --- | -------------------------- | ----------------------------------------------------------------------------------------------------------- | ---------------------- |
| 1   | Draw Walls                 | Click to place a start point, click again to finish the segment. Repeat to outline any floor plan.          | `draw-walls.json`      |
| 2   | Add Doors                  | Switch to Door mode and click near any wall. PlanCity snaps the door and draws the swing arc automatically. | `add-doors.json`       |
| 3   | Generate Electrical Layout | Hit Generate and the app places outlets, switches, a panel, and routes all wiring automatically.            | `generate-layout.json` |
| 4   | View in 3D                 | Toggle 3D View to see your floor plan and wiring in perspective. Drag to orbit, scroll to zoom.             | `view-3d.json`         |

Animation JSON files live in: `apps/frontend/public/animations/`

---

## Files to Create

### 1. `apps/frontend/public/animations/draw-walls.json`

Simple Lottie: a horizontal line that draws itself (trim path 0→100%) on a grid background.

### 2. `apps/frontend/public/animations/add-doors.json`

Simple Lottie: a static wall line + a quarter-circle arc that draws itself on the wall.

### 3. `apps/frontend/public/animations/generate-layout.json`

Simple Lottie: static walls + 3 outlet circles that scale in sequentially + trim-path wires.

### 4. `apps/frontend/public/animations/view-3d.json`

Simple Lottie: a 3D room wireframe (box outline) that fades/draws in and rotates slightly.

### 5. `apps/frontend/src/floor-plan/hooks/useTutorial.ts` (rewrite)

```typescript
export type UseTutorialReturn = {
  isOpen: boolean;
  open: () => void;
  close: () => void; // marks seen in localStorage
};
```

- `isOpen` initialises to `localStorage.getItem('plancity:tutorial:seen') === null`
- `close()` sets the key and flips isOpen to false

### 6. `apps/frontend/src/floor-plan/components/TutorialModal.tsx` (replaces TutorialTour.tsx)

```typescript
// Props: none — reads useTutorial() internally
// Renders: Radix Dialog with carousel of 4 Lottie slides
```

- Radix `Dialog.Root` controlled by `isOpen` / `close()`
- Carousel state: `currentSlide` (0-3), prev/next handlers
- Each slide renders `<Lottie animationData={...} loop={true} />`
- Dot indicators + Prev/Next arrows in footer
- "Got it" button (last slide) calls `close()`
- "Skip" / X button calls `close()` on any slide

### 7. `apps/frontend/src/App.tsx`

Add a `?` icon button in the Header that calls `useTutorial().open()` — lets users
replay the tutorial at any time. Mount `<TutorialModal />` once inside `App`.

---

## Files to Modify

### `apps/frontend/src/floor-plan/FloorPlanEditor.tsx`

- Remove `<TutorialTour>` import and usage (replaced by `<TutorialModal>` in App.tsx)

### `apps/frontend/src/index.css`

- Remove the `.plancity-tour-popover` and `.driver-overlay` blocks added for driver.js

---

## Files to Delete / Replace

| Old file                                     | Action                                        |
| -------------------------------------------- | --------------------------------------------- |
| `src/floor-plan/components/TutorialTour.tsx` | Delete — replaced by `TutorialModal.tsx`      |
| `src/floor-plan/hooks/useTutorial.ts`        | Rewrite (simpler interface)                   |
| `tests/floor-plan/TutorialTour.test.tsx`     | Delete — replaced by `TutorialModal.test.tsx` |
| `tests/floor-plan/useTutorial.test.ts`       | Rewrite                                       |

---

## Tests to Create

### `tests/floor-plan/useTutorial.test.ts`

- **Expected**: absent key → `isOpen === true`; after `close()` → `isOpen === false`, key is `'1'`
- **Edge case**: key already set before mount → `isOpen === false` on init
- **Failure case**: calling `close()` twice is idempotent, no error

### `tests/floor-plan/TutorialModal.test.tsx`

Mock `lottie-react` and `@radix-ui/react-dialog`. Verify:

- **Expected**: absent key → modal renders and is visible
- **Edge case**: key set → modal not rendered / not open
- **Failure case**: clicking "Got it" sets the localStorage key and closes

---

## Verification

1. Clear localStorage → modal opens automatically on page load
2. Navigate all 4 slides → Lottie animations loop correctly
3. Click "Got it" on last slide → modal closes, `plancity:tutorial:seen` is set
4. Refresh → modal does NOT reopen
5. Click "?" help button → modal reopens regardless of localStorage
6. Toggle dark mode → modal styling updates via CSS variables
7. `pnpm test` → all tests pass
