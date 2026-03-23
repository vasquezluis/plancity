import { DoorOpen, HelpCircle, PenLine, Zap } from 'lucide-react';
import ThemeSwitcher from './components/ThemeSwitcher';
import { TutorialModal } from './floor-plan-tutorial/components/TutorialModal';
import { useTutorial } from './floor-plan-tutorial/hooks/useTutorial';
import { FloorPlanEditor } from './floor-plan/FloorPlanEditor';

const HOW_TO_STEPS = [
  {
    icon: <PenLine className="w-5 h-5 text-amber-500" />,
    step: '1',
    title: 'Draw walls',
    description:
      'Select the Wall tool and click on the canvas to place the start point, then click again to finish the wall segment. Repeat to outline your floor plan.',
  },
  {
    icon: <DoorOpen className="w-5 h-5 text-amber-500" />,
    step: '2',
    title: 'Add doors',
    description:
      'Switch to the Door tool and click near any wall to snap a door onto it. The arc shows the swing direction.',
  },
  {
    icon: <Zap className="w-5 h-5 text-amber-500" />,
    step: '3',
    title: 'Generate wiring',
    description:
      'Hit the Generate button. PlanCity will automatically place outlets along the walls, route wires, and overlay the electrical plan on your drawing.',
  },
];

export function App() {
  const tutorial = useTutorial();

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <TutorialModal isOpen={tutorial.isOpen} onClose={tutorial.close} />
      {/* Header — full-width, sticky at top */}
      <header className="sticky top-0 z-10 w-full border-b border-border bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="mx-auto max-w-7xl px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500" />
            <div>
              <h1 className="text-lg font-semibold tracking-tight leading-none">PlanCity</h1>
              <p className="text-xs text-muted-foreground">Auto Electrical Wiring Planner</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={tutorial.open}
              className="rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              aria-label="Open tutorial"
              title="How to use PlanCity"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
            <ThemeSwitcher />
          </div>
        </div>
      </header>

      <main className="flex-1 mx-auto w-full max-w-7xl px-6 py-8 space-y-10">
        {/* About section */}
        <section className="text-center max-w-2xl mx-auto space-y-3">
          <h2 className="text-2xl font-bold tracking-tight">
            From blueprint sketch to electrical layout — in seconds
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            PlanCity is an interactive floor-plan editor that automatically generates an electrical
            wiring plan from your drawing. Sketch walls and doors, click <strong>Generate</strong>,
            and instantly see outlet placements and wire routing overlaid on your blueprint.
          </p>
        </section>

        {/* How-to steps */}
        <section>
          <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground text-center mb-6">
            How it works
          </h3>
          <ol className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {HOW_TO_STEPS.map(({ icon, step, title, description }) => (
              <li
                key={step}
                className="relative rounded-lg border border-border bg-card p-4 flex flex-col gap-3"
              >
                {/* Step badge */}
                <span className="absolute top-4 right-4 text-xs font-bold text-muted-foreground/40 select-none">
                  {step} / 3
                </span>
                <div className="flex items-center gap-2">
                  {icon}
                  <span className="font-semibold text-sm">{title}</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* Editor */}
        <section className="flex items-center justify-center">
          <FloorPlanEditor />
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-border">
        <div className="mx-auto max-w-7xl px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} PlanCity — Auto Electrical Wiring Planner</p>
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
              Phase 1 — MVP
            </span>
            <span>Draw &rarr; Generate &rarr; Visualize</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
