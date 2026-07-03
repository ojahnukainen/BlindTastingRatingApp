import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { StarRating } from '../src/components/StarRating';

describe('StarRating', () => {
  it('renders five stars and marks the selected value', () => {
    render(<StarRating value={3} />);
    const stars = screen.getAllByRole('radio');
    expect(stars).toHaveLength(5);
    expect(stars[2]).toHaveAttribute('aria-checked', 'true');
  });

  it('calls onChange with the clicked star value', async () => {
    const onChange = vi.fn();
    render(<StarRating value={0} onChange={onChange} />);
    await userEvent.click(screen.getByLabelText('4 stars'));
    expect(onChange).toHaveBeenCalledWith(4);
  });

  it('does not fire onChange when read-only', async () => {
    const onChange = vi.fn();
    render(<StarRating value={2} onChange={onChange} readOnly />);
    await userEvent.click(screen.getByLabelText('5 stars'));
    expect(onChange).not.toHaveBeenCalled();
  });
});
