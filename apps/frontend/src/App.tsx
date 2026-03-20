import ThemeSwitcher from './components/ThemeSwitcher';
import { FloorPlanEditor } from './floor-plan/FloorPlanEditor';

export function App() {
  return (
    <div className="flex flex-col items-center min-h-screen bg-background text-foreground">
      <header className="border-b border-border px-6 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">PlanCity</h1>
          <p className="text-xs text-muted-foreground">Auto Electrical Wiring Planner</p>
        </div>
        <ThemeSwitcher />
      </header>

      <main className="px-6 py-5 max-w-225">
        <FloorPlanEditor />
      </main>
    </div>
  );
}
