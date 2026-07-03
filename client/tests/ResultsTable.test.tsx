import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { GameResults } from '@blind/shared';
import { ResultsTable } from '../src/components/ResultsTable';

const results: GameResults = {
  totalPlayers: 2,
  submissionsCount: 4,
  items: [
    {
      itemId: '1',
      name: 'Coke',
      label: 'Sample 1',
      averageStars: 3,
      ratingsCount: 2,
      correctGuesses: 1,
      guessAccuracy: 0.5,
    },
    {
      itemId: '2',
      name: 'Pepsi',
      label: 'Sample 2',
      averageStars: 4.5,
      ratingsCount: 2,
      correctGuesses: 2,
      guessAccuracy: 1,
    },
  ],
};

describe('ResultsTable', () => {
  it('ranks items by average stars (highest first)', () => {
    render(<ResultsTable results={results} />);
    const names = screen.getAllByRole('listitem').map((li) => li.querySelector('p')?.textContent);
    expect(names[0]).toBe('Pepsi');
    expect(names[1]).toBe('Coke');
  });

  it('shows guess accuracy as a percentage', () => {
    render(<ResultsTable results={results} />);
    expect(screen.getByText(/guessed correctly by 100%/)).toBeInTheDocument();
    expect(screen.getByText(/guessed correctly by 50%/)).toBeInTheDocument();
  });
});
