import { describe, expect, it } from 'vitest';
import {
  defaultIdiomsSearch,
  idiomsSearchSchema,
} from '@/routes/_authenticated/admin/idioms/-lib/idioms-schema';

describe('idiomsSearchSchema', () => {
  it('trims text and keeps pagination', () => {
    expect(
      idiomsSearchSchema.parse({ page: '2', pageSize: '10', text: ' 一  ' }),
    ).toEqual({
      page: 2,
      pageSize: 10,
      text: '一',
    });
  });

  it('trims blank text to an empty string', () => {
    expect(idiomsSearchSchema.parse({ text: '   ' }).text).toBe('');
  });

  it('exports default search values', () => {
    expect(defaultIdiomsSearch.page).toBe(1);
    expect(defaultIdiomsSearch.pageSize).toBe(20);
    expect(defaultIdiomsSearch.text).toBeUndefined();
  });
});
