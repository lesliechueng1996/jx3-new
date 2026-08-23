import { create } from 'zustand';
import { createRaidRun, type RaidRun } from '../-lib/raid-run';

type RaidRunStore = {
  raidRun: RaidRun;
  updateRaidRun: (updater: (run: RaidRun) => RaidRun) => void;
};

export const useRaidRun = create<RaidRunStore>((set) => ({
  raidRun: createRaidRun(),
  updateRaidRun: (updater) =>
    set((state) => ({ raidRun: updater(state.raidRun) })),
}));
