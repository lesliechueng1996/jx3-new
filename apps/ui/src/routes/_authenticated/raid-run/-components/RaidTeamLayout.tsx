import { DragDropProvider, useDraggable, useDroppable } from '@dnd-kit/react';
import { useQuery } from '@tanstack/react-query';
import { Triangle, Wallet } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  gameServersAllQueryKey,
  listAllGameServers,
} from '@/lib/api/game-servers-api';
import { kungfusAllQueryKey, listAllKungfus } from '@/lib/api/kungfus-api';
import { cn } from '@/lib/utils';
import { useRaidRun } from '../-hook/use-raid-run';
import { swapRaidSignupsAt } from '../-lib/raid-run';
import {
  formatRaidSignupSlotTitle,
  isRaidSignupSlotEmpty,
  RAID_SIGNUP_SLOT_DND_TYPE,
  type RaidSignup,
  raidSignupRoleCellClassName,
  raidSignupSlotId,
  resolveRaidSignupSwapSlots,
} from '../-lib/raid-signup';

type Props = {
  className?: string;
};

const RaidTeamLayout = ({ className }: Props) => {
  const { raidRun, selectedSlot, selectSlot, updateRaidRun } = useRaidRun();
  const kungfusQuery = useQuery({
    queryKey: kungfusAllQueryKey,
    queryFn: listAllKungfus,
  });
  const serversQuery = useQuery({
    queryKey: gameServersAllQueryKey,
    queryFn: listAllGameServers,
  });

  const kungfuById = new Map(
    (kungfusQuery.data ?? []).map((kungfu) => [kungfu.id, kungfu]),
  );
  const serverById = new Map(
    (serversQuery.data ?? []).map((server) => [server.id, server]),
  );

  return (
    <Card className={cn(className)}>
      <CardHeader>
        <CardTitle>团队布局</CardTitle>
      </CardHeader>
      <CardContent>
        <DragDropProvider
          onDragEnd={(event) => {
            if (event.canceled) {
              return;
            }

            const slots = resolveRaidSignupSwapSlots(
              event.operation.source?.id,
              event.operation.target?.id,
            );
            if (!slots) {
              return;
            }

            updateRaidRun((run) =>
              swapRaidSignupsAt(run, slots.source, slots.target),
            );
          }}
        >
          <div
            className="grid w-full gap-2"
            style={{
              gridTemplateColumns: `repeat(${raidRun.totalGroupCount}, minmax(0, 1fr))`,
            }}
          >
            {raidRun.signups.map((group) => (
              <div
                key={group[0]?.groupNumber}
                className="flex min-w-0 flex-col gap-2"
              >
                <div className="text-center text-xs text-muted-foreground">
                  {group[0]?.groupNumber}队
                </div>
                {group.map((signup) => (
                  <RaidSignupSlotCell
                    key={raidSignupSlotId(
                      signup.groupNumber,
                      signup.positionNumber,
                    )}
                    signup={signup}
                    selected={
                      selectedSlot?.groupNumber === signup.groupNumber &&
                      selectedSlot.positionNumber === signup.positionNumber
                    }
                    kungfu={
                      signup.kungfuId
                        ? kungfuById.get(signup.kungfuId)
                        : undefined
                    }
                    serverName={
                      signup.serverId
                        ? serverById.get(signup.serverId)?.name
                        : undefined
                    }
                    onSelect={() =>
                      selectSlot({
                        groupNumber: signup.groupNumber,
                        positionNumber: signup.positionNumber,
                      })
                    }
                  />
                ))}
              </div>
            ))}
          </div>
        </DragDropProvider>
      </CardContent>
    </Card>
  );
};

type SlotCellProps = {
  signup: RaidSignup;
  selected: boolean;
  kungfu?: { name: string; icon: string | null };
  serverName?: string;
  onSelect: () => void;
};

const RaidSignupSlotCell = ({
  signup,
  selected,
  kungfu,
  serverName,
  onSelect,
}: SlotCellProps) => {
  const empty = isRaidSignupSlotEmpty(signup);
  const title = formatRaidSignupSlotTitle(
    signup.groupNumber,
    signup.positionNumber,
  );
  const slotId = raidSignupSlotId(signup.groupNumber, signup.positionNumber);
  const { ref: setDragRef, isDragging } = useDraggable({
    id: slotId,
    type: RAID_SIGNUP_SLOT_DND_TYPE,
  });
  const { ref: setDropRef, isDropTarget } = useDroppable({
    id: slotId,
    accept: RAID_SIGNUP_SLOT_DND_TYPE,
    disabled: isDragging,
  });

  return (
    <button
      ref={(element) => {
        setDragRef(element);
        setDropRef(element);
      }}
      type="button"
      aria-label={title}
      aria-pressed={selected}
      aria-grabbed={isDragging}
      className={cn(
        'relative flex min-h-20 w-full cursor-grab flex-col items-stretch justify-center gap-1 rounded-lg border px-2 py-1.5 text-left transition-shadow outline-none focus-visible:ring-3 focus-visible:ring-ring/50 active:cursor-grabbing',
        raidSignupRoleCellClassName(signup.role),
        selected && 'ring-2 ring-ring ring-offset-2 ring-offset-background',
        isDropTarget &&
          'ring-2 ring-primary ring-offset-2 ring-offset-background',
        isDragging && 'opacity-50',
      )}
      onClick={onSelect}
    >
      <span className="absolute top-1 right-1 flex items-center gap-0.5">
        {signup.isLeader ? (
          <Triangle
            className="size-3 rotate-180 fill-red-500 text-red-500"
            aria-label="团长"
          />
        ) : null}
        {signup.isFormationCore ? (
          <span
            role="img"
            className="size-2 rounded-full bg-green-500"
            aria-label="阵眼"
          />
        ) : null}
        {signup.isDarkRun ? (
          <Wallet
            className="size-3 fill-amber-400 text-amber-400"
            aria-label="黑本"
          />
        ) : null}
      </span>
      {empty ? (
        <span className="text-center text-xs">空位</span>
      ) : (
        <>
          <span className="flex min-w-0 items-center gap-1">
            {kungfu?.icon ? (
              <img
                src={kungfu.icon}
                alt={`${kungfu.name}图标`}
                className="size-5 shrink-0 rounded-sm object-contain"
              />
            ) : null}
            <span className="truncate text-xs font-medium">
              {signup.characterName || '空位'}
            </span>
          </span>
          {serverName ? (
            <span className="truncate text-[11px] opacity-80">
              {serverName}
            </span>
          ) : null}
        </>
      )}
    </button>
  );
};

export default RaidTeamLayout;
