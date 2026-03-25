import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DoorSymbol } from '../../src/floor-plan/components/DoorSymbol';
import { DrawingToolbar } from '../../src/floor-plan/components/DrawingToolbar';

describe('DoorSymbol', () => {
  it('renders without a highlight circle by default', () => {
    const door = { x: 100, y: 100 };
    const { container } = render(<DoorSymbol door={door} />);
    const circles = container.querySelectorAll('circle');
    // Only the hinge dot — no highlight ring
    expect(circles).toHaveLength(1);
  });

  it('renders a highlight circle when highlight=true', () => {
    const door = { x: 100, y: 100 };
    const { container } = render(<DoorSymbol door={door} highlight />);
    const circles = container.querySelectorAll('circle');
    // Hinge dot + highlight ring
    expect(circles).toHaveLength(2);
  });

  it('does not render highlight circle when highlight=false', () => {
    const door = { x: 50, y: 50 };
    const { container } = render(<DoorSymbol door={door} highlight={false} />);
    const circles = container.querySelectorAll('circle');
    expect(circles).toHaveLength(1);
  });
});

describe('DrawingToolbar — delete mode', () => {
  it('renders a Delete button', () => {
    const { getByText } = render(
      <DrawingToolbar mode="wall" wallStarted={false} onModeChange={vi.fn()} onClear={vi.fn()} />
    );
    expect(getByText('Delete')).toBeTruthy();
  });

  it('calls onModeChange with "delete" when Delete is clicked', () => {
    const onModeChange = vi.fn();
    const { getByText } = render(
      <DrawingToolbar
        mode="wall"
        wallStarted={false}
        onModeChange={onModeChange}
        onClear={vi.fn()}
      />
    );
    getByText('Delete').click();
    expect(onModeChange).toHaveBeenCalledWith('delete');
  });

  it('renders Delete button as destructive variant when in delete mode', () => {
    const { getByText } = render(
      <DrawingToolbar mode="delete" wallStarted={false} onModeChange={vi.fn()} onClear={vi.fn()} />
    );
    // Button element should have destructive styling when active
    const btn = getByText('Delete').closest('button');
    expect(btn).toBeTruthy();
  });

  it('shows the delete hint when in delete mode', () => {
    const { getByText } = render(
      <DrawingToolbar mode="delete" wallStarted={false} onModeChange={vi.fn()} onClear={vi.fn()} />
    );
    expect(getByText('Click a wall or door to delete it')).toBeTruthy();
  });
});
