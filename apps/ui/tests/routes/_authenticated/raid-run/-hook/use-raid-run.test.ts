import { describe, expect, it } from 'vitest';
import { useRaidRun } from '@/routes/_authenticated/raid-run/-hook/use-raid-run';

describe('useRaidRun', () => {
  it('starts with an empty raid run snapshot', () => {
    const { raidRun } = useRaidRun.getState();

    expect(raidRun.status).toBe('pending');
    expect(raidRun.signups).toHaveLength(5);
    expect(raidRun.signups[0]).toHaveLength(5);
  });
});
