import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { CatalogCard } from './catalog-card';
import { Pagination } from './pagination';
import type { CatalogItem, CatalogQuery } from './types';

const query: CatalogQuery = {
  level: 'N5',
  type: 'vocabulary',
  search: 'makan',
  view: 'list',
  partOfSpeech: 'verb',
  verbGroup: 'ichidan',
  transitivity: 'transitive',
  adjectiveType: 'all',
  theme: 'food_drink',
  page: 2,
};

const item: CatalogItem = {
  id: 'content-id',
  type: 'vocabulary',
  level: 'N5',
  title: '食べる',
  reading: 'たべる',
  meanings: ['to eat'],
  supportingText: null,
  taxonomy: {
    partsOfSpeech: ['verb'],
    verbGroups: ['ichidan'],
    transitivities: ['transitive'],
    adjectiveTypes: [],
    themes: ['food_drink'],
    needsReview: false,
  },
};

// Mock next/navigation for client components rendered inside tests
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/catalog',
}));

describe('catalog view controls', () => {
  it('renders a compact list item with the same detail affordance', () => {
    render(<CatalogCard item={item} view="list" />);

    expect(screen.getByRole('heading', { name: '食べる' })).toBeVisible();
    expect(screen.getByText('たべる')).toBeVisible();
    expect(screen.getByText('to eat')).toBeVisible();
    expect(screen.getByText('Kata kerja')).toBeVisible();
    expect(screen.getByText('Makanan & minuman')).toBeVisible();
    expect(screen.getByRole('link', { name: 'Lihat detail 食べる' })).toHaveAttribute(
      'href',
      '/catalog/content-id',
    );
  });

  it('preserves list mode through pagination links', () => {
    render(<Pagination query={query} totalPages={3} />);

    expect(screen.getByRole('link', { name: /Berikutnya/ })).toHaveAttribute(
      'href',
      '/catalog?level=N5&type=vocabulary&view=list&page=3&q=makan&pos=verb&verb=ichidan&transitivity=transitive&theme=food_drink',
    );
  });

  it('renders taxonomy badges on vocabulary items', () => {
    render(<CatalogCard item={item} view="list" />);

    expect(screen.getByText('Kata kerja')).toBeVisible();
    expect(screen.getByText('Makanan & minuman')).toBeVisible();
  });

  it('shows fallback text when no meanings', () => {
    const itemNoMeanings: CatalogItem = { ...item, meanings: [] };
    render(<CatalogCard item={itemNoMeanings} view="list" />);

    expect(screen.getByText('Makna belum tersedia')).toBeVisible();
  });

  it('renders grid view card correctly', () => {
    render(<CatalogCard item={item} view="grid" />);

    expect(screen.getByRole('heading', { name: '食べる' })).toBeVisible();
    expect(screen.getByText('たべる')).toBeVisible();
  });
});
