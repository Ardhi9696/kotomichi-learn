import { describe, expect, it } from 'vitest';

import {
  createReportSchema,
  updateReportSchema,
} from '@/features/reports/report-schema';

describe('content report schemas', () => {
  it('accepts and trims a valid content report', () => {
    const result = createReportSchema.parse({
      contentItemId: '3d4cb4e8-cf13-49c4-aa9f-a3b55bd52f41',
      locale: 'id',
      fieldName: 'meaning',
      message: '  Makna pada materi ini kurang tepat.  ',
    });

    expect(result.message).toBe('Makna pada materi ini kurang tepat.');
  });

  it('requires notes when closing a report', () => {
    expect(
      updateReportSchema.safeParse({
        reportId: '3d4cb4e8-cf13-49c4-aa9f-a3b55bd52f41',
        status: 'resolved',
        resolutionNotes: '',
        currentFilter: 'open',
      }).success,
    ).toBe(false);
  });

  it('allows a report to remain open without resolution notes', () => {
    expect(
      updateReportSchema.safeParse({
        reportId: '3d4cb4e8-cf13-49c4-aa9f-a3b55bd52f41',
        status: 'triaged',
        resolutionNotes: '',
        currentFilter: 'open',
      }).success,
    ).toBe(true);
  });
});
