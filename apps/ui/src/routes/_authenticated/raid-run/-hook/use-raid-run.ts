import { create } from 'zustand';
import { createRaidRun, type RaidRun } from '../-lib/raid-run';

export type RaidRunSelectedSlot = {
  groupNumber: number;
  positionNumber: number;
};

type RaidRunStore = {
  raidRun: RaidRun;
  selectedSlot: RaidRunSelectedSlot | null;
  updateRaidRun: (updater: (run: RaidRun) => RaidRun) => void;
  selectSlot: (slot: RaidRunSelectedSlot) => void;
};

const isSelectedSlotInRun = (
  run: RaidRun,
  slot: RaidRunSelectedSlot | null,
) => {
  if (!slot) {
    return false;
  }

  return Boolean(run.signups[slot.groupNumber - 1]?.[slot.positionNumber - 1]);
};

export const useRaidRun = create<RaidRunStore>((set) => ({
  raidRun: createRaidRun(),
  selectedSlot: null,
  updateRaidRun: (updater) =>
    set((state) => {
      const raidRun = updater(state.raidRun);
      return {
        raidRun,
        selectedSlot: isSelectedSlotInRun(raidRun, state.selectedSlot)
          ? state.selectedSlot
          : null,
      };
    }),
  selectSlot: (slot) => set({ selectedSlot: slot }),
}));
