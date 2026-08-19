import { describe, expect, it } from 'vitest';
import {
  matchesSchoolQuery,
  resolveSchoolInput,
  schoolInputLabel,
} from '@/lib/school-select';

describe('matchesSchoolQuery', () => {
  const school = {
    name: '纯阳',
    alias: ['纯阳宫', 'Qi Chunyang'],
  };

  it('matches an empty query', () => {
    expect(matchesSchoolQuery(school, '  ')).toBe(true);
  });

  it('matches name case-insensitively', () => {
    expect(matchesSchoolQuery(school, '纯')).toBe(true);
    expect(matchesSchoolQuery(school, '天策')).toBe(false);
  });

  it('matches alias case-insensitively', () => {
    expect(matchesSchoolQuery(school, 'qi chun')).toBe(true);
    expect(matchesSchoolQuery(school, '纯阳宫')).toBe(true);
    expect(matchesSchoolQuery(school, '少林')).toBe(false);
  });
});

describe('schoolInputLabel', () => {
  const schools = [{ id: 'school-1', name: '纯阳' }];

  it('resolves a selected school name', () => {
    expect(schoolInputLabel('school-1', schools, false)).toBe('纯阳');
    expect(schoolInputLabel('missing', schools, false)).toBe('');
  });

  it('uses the empty label when nothing is selected', () => {
    expect(schoolInputLabel(undefined, schools, true)).toBe('全部');
    expect(schoolInputLabel(undefined, schools, false)).toBe('');
  });
});

describe('resolveSchoolInput', () => {
  const schools = [
    { id: 'school-1', name: '纯阳', alias: ['纯阳宫'] },
    { id: 'school-2', name: '天策', alias: [] },
  ];

  it('clears empty input when allowEmpty', () => {
    expect(resolveSchoolInput('  ', schools, true)).toEqual({
      action: 'clear',
    });
    expect(resolveSchoolInput('全部', schools, true)).toEqual({
      action: 'clear',
    });
  });

  it('reverts empty input when a selection is required', () => {
    expect(resolveSchoolInput('', schools, false)).toEqual({
      action: 'revert',
    });
  });

  it('selects an exact name or alias', () => {
    expect(resolveSchoolInput('天策', schools, true)).toEqual({
      action: 'select',
      schoolId: 'school-2',
    });
    expect(resolveSchoolInput('纯阳宫', schools, false)).toEqual({
      action: 'select',
      schoolId: 'school-1',
    });
  });

  it('reverts unmatched input', () => {
    expect(resolveSchoolInput('少林', schools, true)).toEqual({
      action: 'revert',
    });
  });
});
