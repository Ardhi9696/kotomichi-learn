import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { CatalogCard } from './catalog-card';
import { CatalogFilters } from './catalog-filters';
import { CatalogViewToggle } from './catalog-view-toggle';
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

describe('catalog view controls', () => {
  it('preserves filters and search when switching between grid and list', () => {
    render(<CatalogViewToggle query={query} />);

    expect(screen.getByRole('link', { name: 'Tampilan list' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.getByRole('link', { name: 'Tampilan grid' })).toHaveAttribute(
      'href',
      '/catalog?level=N5&type=vocabulary&view=grid&page=2&q=makan&pos=verb&verb=ichidan&transitivity=transitive&theme=food_drink',
    );
  });

  it('preserves list mode through filtering and pagination', () => {
    render(
      <>
        <CatalogFilters query={query} />
        <Pagination query={query} totalPages={3} />
      </>,
    );

    expect(screen.getByDisplayValue('list')).toHaveAttribute('name', 'view');
    expect(screen.getByRole('link', { name: /Berikutnya/ })).toHaveAttribute(
      'href',
      '/catalog?level=N5&type=vocabulary&view=list&page=3&q=makan&pos=verb&verb=ichidan&transitivity=transitive&theme=food_drink',
    );
  });

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
});
