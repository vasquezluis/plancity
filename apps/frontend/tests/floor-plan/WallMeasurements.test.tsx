import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { WallMeasurements } from '../../src/floor-plan/components/WallMeasurements';

describe('WallMeasurements', () => {
  it('renders one label per wall with the correct measurement', () => {
    // 80px wall = 2m
    const walls = [{ x1: 0, y1: 0, x2: 80, y2: 0 }];
    const { getAllByText } = render(<WallMeasurements walls={walls} unit="m" />);
    expect(getAllByText('2 m')).toHaveLength(1);
  });

  it('renders measurements in feet when unit is ft', () => {
    // 40px = 1m = 3.3ft
    const walls = [{ x1: 0, y1: 0, x2: 40, y2: 0 }];
    const { getByText } = render(<WallMeasurements walls={walls} unit="ft" />);
    expect(getByText('3.3 ft')).toBeTruthy();
  });

  it('renders a preview label in addition to placed walls', () => {
    const walls = [{ x1: 0, y1: 0, x2: 40, y2: 0 }];
    const preview = { x1: 80, y1: 0, x2: 120, y2: 0 };
    const { getAllByText } = render(<WallMeasurements walls={walls} unit="m" preview={preview} />);
    // Both walls are 40px = 1m each
    expect(getAllByText('1 m')).toHaveLength(2);
  });

  it('renders nothing for a zero-length wall', () => {
    const walls = [{ x1: 50, y1: 50, x2: 50, y2: 50 }];
    const { container } = render(<WallMeasurements walls={walls} unit="m" />);
    expect(container.querySelectorAll('text')).toHaveLength(0);
  });
});
