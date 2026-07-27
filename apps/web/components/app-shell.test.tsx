import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { AppShell, type AppViewer } from '@/components/app-shell';

let currentPathname = '/dashboard';

vi.mock('next/navigation', () => ({
  usePathname: () => currentPathname,
}));

vi.mock('@/app/auth/actions', () => ({
  logout: vi.fn(),
}));

vi.mock('@/app/settings/actions', () => ({
  saveThemePreference: vi.fn(async () => ({ success: true })),
}));

const learner: AppViewer = {
  displayName: 'Kotomichi Learner',
  email: 'learner@example.com',
  targetLevel: 'N3',
  theme: 'system',
  roles: [],
};

afterEach(() => cleanup());

describe('AppShell', () => {
  it('marks the current dashboard link and hides internal tools from learners', () => {
    currentPathname = '/dashboard';
    render(
      <AppShell viewer={learner}>
        <h1>Dashboard</h1>
      </AppShell>,
    );

    expect(
      screen.getByRole('link', { name: /RingkasanProgres dan aktivitas/i }),
    ).toHaveAttribute('aria-current', 'page');
    expect(
      screen.queryByRole('link', { name: /Kelola materi/i }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  });

  it('shows role-aware editorial and superadmin navigation', () => {
    currentPathname = '/admin/sources';
    render(
      <AppShell
        viewer={{ ...learner, roles: ['editor', 'superadmin'] }}
      >
        <h1>Sources</h1>
      </AppShell>,
    );

    expect(screen.getByRole('link', { name: /Kelola materi/i })).toBeVisible();
    expect(
      screen.getByRole('link', { name: /Sumber dataSnapshot OpenJLPT/i }),
    ).toHaveAttribute('aria-current', 'page');
  });

  it('opens an accessible mobile navigation dialog', async () => {
    currentPathname = '/review';
    render(
      <AppShell viewer={learner}>
        <h1>Review</h1>
      </AppShell>,
    );

    const menuButton = screen.getByRole('button', {
      name: 'Buka menu dashboard',
    });
    fireEvent.click(menuButton);

    expect(menuButton).toHaveAttribute('aria-expanded', 'true');
    expect(
      screen.getByRole('dialog', { name: 'Menu dashboard' }),
    ).toBeVisible();
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Tutup menu' })).toHaveFocus();
    });
  });

  it('keeps the public header and footer outside authenticated app routes', () => {
    currentPathname = '/';
    render(
      <AppShell viewer={null}>
        <h1>Landing</h1>
      </AppShell>,
    );

    expect(screen.getByRole('navigation', { name: 'Navigasi utama' })).toBeVisible();
    expect(screen.getByLabelText('Tema: Sistem')).toBeVisible();
    expect(screen.getByText('Kotomichi Learn')).toBeVisible();
  });
});
