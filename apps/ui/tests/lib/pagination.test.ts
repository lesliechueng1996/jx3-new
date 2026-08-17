import { describe, expect, it } from 'vitest';
import {
  DEFAULT_PAGE,
  DEFAULT_PAGE_SIZE,
  paginationSearchQuerySchema,
} from '@/lib/pagination';

describe('paginationSearchQuerySchema', () => {
  it('parses valid page values', () => {
    expect(
      paginationSearchQuerySchema.parse({ page: '3', pageSize: '10' }),
    ).toEqual({
      page: 3,
      pageSize: 10,
    });
  });

  it('falls back to defaults for invalid values', () => {
    expect(
      paginationSearchQuerySchema.parse({ page: '0', pageSize: '-1' }),
    ).toEqual({
      page: DEFAULT_PAGE,
      pageSize: DEFAULT_PAGE_SIZE,
    });
  });

  it('falls back when values are missing', () => {
    expect(paginationSearchQuerySchema.parse({})).toEqual({
      page: DEFAULT_PAGE,
      pageSize: DEFAULT_PAGE_SIZE,
    });
  });
});
