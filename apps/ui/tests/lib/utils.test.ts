import { describe, expect, it } from 'vitest';
import { cn, toRouteSearch } from '@/lib/utils';

describe('cn', () => {
  it('merges class names and tailwind conflicts', () => {
    expect(cn('px-2', 'px-4', false && 'hidden')).toBe('px-4');
  });
});

describe('toRouteSearch', () => {
  const defaults = {
    page: 1,
    pageSize: 20,
    text: undefined as string | undefined,
  };

  it('omits values that match defaults or are empty', () => {
    expect(
      toRouteSearch({ page: 1, pageSize: 20, text: '' }, defaults),
    ).toEqual({ page: undefined, pageSize: undefined, text: undefined });
  });

  it('keeps non-default values', () => {
    expect(
      toRouteSearch({ page: 2, pageSize: 50, text: '一' }, defaults),
    ).toEqual({ page: 2, pageSize: 50, text: '一' });
  });

  it('treats null as empty', () => {
    expect(
      toRouteSearch(
        { page: 1, pageSize: 20, text: null as unknown as string },
        defaults,
      ),
    ).toEqual({ page: undefined, pageSize: undefined, text: undefined });
  });
});
