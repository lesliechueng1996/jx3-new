import { beforeEach, describe, expect, it } from 'vitest';
import { useRaidRun } from '@/routes/_authenticated/raid-run/-hook/use-raid-run';
import {
  createRaidRun,
  setRaidRunDungeon,
  setRaidRunName,
} from '@/routes/_authenticated/raid-run/-lib/raid-run';
import { raidRunSaveSnapshot } from '@/routes/_authenticated/raid-run/-lib/raid-run-save';

const tenPlayerDungeon = {
  id: 'dungeon-2',
  name: '10人普通',
  playerLimit: 10,
  bossCount: 3,
  difficulty: 'normal' as const,
};

describe('useRaidRun', () => {
  beforeEach(() => {
    useRaidRun.getState().resetRaidRun();
  });

  it('starts with an empty raid run snapshot', () => {
    const { raidRun, selectedSlot, savedSnapshot } = useRaidRun.getState();

    expect(raidRun.status).toBe('pending');
    expect(raidRun.signups).toHaveLength(5);
    expect(raidRun.signups[0]).toHaveLength(5);
    expect(selectedSlot).toBeNull();
    expect(savedSnapshot).toBe(raidRunSaveSnapshot(raidRun));
  });

  it('selects a slot and keeps it when the grid still contains it', () => {
    useRaidRun.getState().selectSlot({ groupNumber: 1, positionNumber: 2 });
    useRaidRun.getState().updateRaidRun((run) =>
      setRaidRunDungeon(run, {
        id: 'dungeon-1',
        name: '25人英雄',
        playerLimit: 25,
        bossCount: 6,
        difficulty: 'heroic',
      }),
    );

    expect(useRaidRun.getState().selectedSlot).toEqual({
      groupNumber: 1,
      positionNumber: 2,
    });
  });

  it('clears the selected slot when the dungeon shrinks past it', () => {
    useRaidRun.getState().selectSlot({ groupNumber: 5, positionNumber: 1 });
    useRaidRun
      .getState()
      .updateRaidRun((run) => setRaidRunDungeon(run, tenPlayerDungeon));

    expect(useRaidRun.getState().raidRun.totalGroupCount).toBe(2);
    expect(useRaidRun.getState().selectedSlot).toBeNull();
  });

  it('hydrates a saved run and clears the selection', () => {
    useRaidRun.getState().selectSlot({ groupNumber: 1, positionNumber: 1 });
    const next = setRaidRunName(createRaidRun({ id: 'run-1' }), '已保存');
    useRaidRun.getState().hydrateRaidRun(next);

    expect(useRaidRun.getState().raidRun.name).toBe('已保存');
    expect(useRaidRun.getState().selectedSlot).toBeNull();
    expect(useRaidRun.getState().savedSnapshot).toBe(raidRunSaveSnapshot(next));
  });
});
