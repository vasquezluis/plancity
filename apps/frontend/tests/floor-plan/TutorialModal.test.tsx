import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { TutorialModal } from '../../src/floor-plan-tutorial/components/TutorialModal';

// Reason: lottie-react needs canvas/browser APIs not available in jsdom
vi.mock('lottie-react', () => ({
  default: ({ animationData }: { animationData: unknown }) => (
    <div data-testid="lottie" data-animation={JSON.stringify(animationData).slice(0, 20)} />
  ),
}));

// Mock animation JSON imports — vite resolves /public paths at runtime
vi.mock('../../src/floor-plan/animations/draw-walls.json', () => ({
  default: { nm: 'draw-walls' },
}));
vi.mock('../../src/floor-plan/animations/add-doors.json', () => ({ default: { nm: 'add-doors' } }));
vi.mock('../../src/floor-plan/animations/generate-layout.json', () => ({
  default: { nm: 'generate-layout' },
}));
vi.mock('../../src/floor-plan/animations/view-3d.json', () => ({ default: { nm: 'view-3d' } }));

describe('TutorialModal', () => {
  it('renders the modal when isOpen is true', () => {
    render(<TutorialModal isOpen={true} onClose={() => {}} />);
    expect(screen.getByText('How to use PlanCity')).toBeInTheDocument();
    expect(screen.getByTestId('lottie')).toBeInTheDocument();
  });

  it('does not render visible content when isOpen is false', () => {
    render(<TutorialModal isOpen={false} onClose={() => {}} />);
    expect(screen.queryByText('How to use PlanCity')).not.toBeInTheDocument();
  });

  it('shows the first slide title on open', () => {
    render(<TutorialModal isOpen={true} onClose={() => {}} />);
    expect(screen.getByText('Draw Walls')).toBeInTheDocument();
  });

  it('navigates to the next slide on Next click', async () => {
    render(<TutorialModal isOpen={true} onClose={() => {}} />);
    await userEvent.click(screen.getByLabelText('Next'));
    expect(screen.getByText('Add Doors')).toBeInTheDocument();
  });

  it('shows "Got it" button on the last slide', async () => {
    render(<TutorialModal isOpen={true} onClose={() => {}} />);
    // Navigate to last slide (index 3)
    await userEvent.click(screen.getByLabelText('Next'));
    await userEvent.click(screen.getByLabelText('Next'));
    await userEvent.click(screen.getByLabelText('Next'));
    await userEvent.click(screen.getByLabelText('Next'));
    expect(screen.getByText('Got it')).toBeInTheDocument();
  });

  it('calls onClose when "Got it" is clicked', async () => {
    const onClose = vi.fn();
    render(<TutorialModal isOpen={true} onClose={onClose} />);
    // Navigate to last slide
    await userEvent.click(screen.getByLabelText('Next'));
    await userEvent.click(screen.getByLabelText('Next'));
    await userEvent.click(screen.getByLabelText('Next'));
    await userEvent.click(screen.getByLabelText('Next'));
    await userEvent.click(screen.getByText('Got it'));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('calls onClose when the X button is clicked', async () => {
    const onClose = vi.fn();
    render(<TutorialModal isOpen={true} onClose={onClose} />);
    await userEvent.click(screen.getByLabelText('Close tutorial'));
    expect(onClose).toHaveBeenCalledOnce();
  });
});
