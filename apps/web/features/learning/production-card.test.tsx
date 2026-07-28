import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ProductionCard } from '@/features/learning/production-card';

describe('ProductionCard', () => {
  it('shows Indonesian first, then reveals Japanese and all self-ratings', () => {
    render(
      <ProductionCard
        detail={{
          id: 'item',
          type: 'vocabulary',
          level: 'N5',
          title: '猫',
          reading: 'ねこ',
          meanings: ['kucing'],
          supportingText: null,
          taxonomy: null,
          examples: [],
          locale: 'id',
          isFallback: false,
        }}
        onRate={vi.fn()}
      />,
    );

    expect(screen.getByRole('heading', { name: 'kucing' })).toBeVisible();
    expect(screen.queryByText('猫')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Buka jawaban' }));

    expect(screen.getByText('猫')).toBeVisible();
    expect(screen.getByText('ねこ')).toBeVisible();
    expect(screen.getByRole('button', { name: /Lupa/ })).toHaveValue('forgot');
    expect(screen.getByRole('button', { name: /Sulit/ })).toHaveValue('hard');
    expect(screen.getByRole('button', { name: /Bagus/ })).toHaveValue('good');
    expect(screen.getByRole('button', { name: /Mudah/ })).toHaveValue('easy');
  });
});
