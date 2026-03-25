import { DoorOpen, HelpCircle, PenLine, Zap } from 'lucide-react';
import ThemeSwitcher from './components/ThemeSwitcher';
import { TutorialModal } from './floor-plan-tutorial/components/TutorialModal';
import { useTutorial } from './floor-plan-tutorial/hooks/useTutorial';
import { FloorPlanEditor } from './floor-plan/FloorPlanEditor';

const HOW_TO_STEPS = [
  {
    Icon: PenLine,
    step: 1,
    title: 'Draw your walls',
    description:
      'Select the Wall tool, click to place a start point, then click again to finish each wall segment. Repeat to trace your full floor plan.',
  },
  {
    Icon: DoorOpen,
    step: 2,
    title: 'Place the doors',
    description:
      'Switch to Door mode and click near any wall to snap a door onto it. The arc automatically shows the swing direction.',
  },
  {
    Icon: Zap,
    step: 3,
    title: 'Generate wiring',
    description:
      'Click Generate and instantly get suggested outlet positions, switch placements, and a routed wire plan. Optionally enhance it with AI.',
  },
];

export function App() {
  const tutorial = useTutorial();

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <TutorialModal isOpen={tutorial.isOpen} onClose={tutorial.close} />

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-10 w-full bg-card border-b border-border shadow-sm">
        <div className="mx-auto max-w-6xl px-5 py-3 flex items-center justify-between">
          {/* Brand */}
          <div className="flex items-center gap-2.5">
            <div
              className="flex items-center justify-center w-8 h-8 rounded-lg"
              style={{ backgroundColor: 'var(--brand)' }}
            >
              <Zap className="w-4 h-4 text-white" />
            </div>
            <div className="leading-tight">
              <span className="block text-sm font-bold tracking-tight">PlanCity</span>
              <span className="block text-[11px] text-muted-foreground font-medium">
                Electrical Layout Tool
              </span>
            </div>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={tutorial.open}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              aria-label="Open tutorial"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              Tutorial
            </button>
            <ThemeSwitcher />
          </div>
        </div>
      </header>

      {/* ── Main ──────────────────────────────────────────────────────────── */}
      <main className="flex-1 mx-auto w-full max-w-6xl px-5 py-10 space-y-10">
        {/* Hero ─────────────────────────────────────────────────────────── */}
        <section className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-2">
          <div className="max-w-xl space-y-3">
            <div
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold"
              style={{
                backgroundColor: 'var(--brand-light)',
                color: 'var(--brand)',
              }}
            >
              <Zap className="w-3 h-3" />
              AI-powered electrical planning
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold leading-snug tracking-tight">
              Sketch your electrical layout
              <br />
              <span style={{ color: 'var(--brand)' }}>before calling the electrician</span>
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Draw walls and doors, click{' '}
              <strong className="text-foreground font-semibold">Generate</strong>, and get a
              complete wiring plan with outlets, switches, and routed wires in seconds. Use AI to
              optimize the layout further.
            </p>
          </div>

          {/* Quick stats / badge cluster */}
          <div className="flex flex-col gap-2 shrink-0">
            {[
              { label: 'Outlet placement', color: '#3b82f6' },
              { label: 'Wire routing', color: 'var(--brand)' },
              { label: 'AI optimization', color: '#8b5cf6' },
              { label: '3D preview', color: '#10b981' },
            ].map(({ label, color }) => (
              <div key={label} className="flex items-center gap-2 text-xs text-muted-foreground">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: color }}
                />
                {label}
              </div>
            ))}
          </div>
        </section>

        {/* How it works ─────────────────────────────────────────────────── */}
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-5">
            How it works
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {HOW_TO_STEPS.map(({ Icon, step, title, description }) => (
              <div
                key={step}
                className="relative bg-card rounded-xl border border-border p-5 flex flex-col gap-3"
              >
                {/* Step number */}
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                    style={{ backgroundColor: 'var(--brand)' }}
                  >
                    {step}
                  </div>
                  <Icon className="w-4 h-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-semibold text-sm mb-1">{title}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Editor ───────────────────────────────────────────────────────── */}
        <section>
          <div className="bg-card flex justify-center rounded-xl border border-border p-5 shadow-sm">
            <FloorPlanEditor />
          </div>
        </section>

        {/* Disclaimer */}
        <p className="text-xs text-muted-foreground text-center pb-2">
          Not a substitute for a licensed electrician or professional CAD software — this is a fast
          way to sketch ideas before your consultation.
        </p>
      </main>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer className="w-full border-t border-border bg-card">
        <div className="mx-auto max-w-6xl px-5 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
          <p>PlanCity — Electrical Layout Tool</p>
          <div className="flex items-center gap-4">
            <span>Sketch → Generate → Share</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
