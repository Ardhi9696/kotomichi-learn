import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { LearningSessionForm } from './learning-session-form';

vi.mock('@/features/learning/actions', () => ({
  createLearningSession: vi.fn(),
}));

describe('LearningSessionForm', () => {
  it('shows vocabulary subcategories beside the material selection flow', () => {
    render(<LearningSessionForm defaultItemCount={10} targetLevel="N5" />);

    expect(screen.getByText('Subkategori vocabulary')).toBeVisible();
    expect(screen.getByLabelText('Kelas kata')).toHaveValue('all');
    expect(screen.getByLabelText('Tema')).toHaveValue('all');
  });

  it('hides vocabulary subcategories when vocabulary is not selected', () => {
    render(<LearningSessionForm defaultItemCount={10} targetLevel="N5" />);

    fireEvent.click(screen.getByRole('checkbox', { name: /Vocabulary/ }));

    expect(screen.queryByText('Subkategori vocabulary')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Tema')).not.toBeInTheDocument();
  });
});
