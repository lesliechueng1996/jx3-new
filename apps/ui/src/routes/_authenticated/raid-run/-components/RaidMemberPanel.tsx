import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { useRaidRun } from '../-hook/use-raid-run';
import {
  getRaidSignupAt,
  setRaidSignupDarkRunExclusive,
  setRaidSignupFormationCoreExclusive,
  setRaidSignupLeaderExclusive,
  updateRaidSignupAt,
} from '../-lib/raid-run';
import {
  formatRaidSignupSlotTitle,
  type RaidSignupRole,
  raidSignupRoleItems,
  setRaidSignupCharacterName,
  setRaidSignupKungfu,
  setRaidSignupRemark,
  setRaidSignupRole,
  setRaidSignupServerId,
} from '../-lib/raid-signup';
import { GameServerSearchSelectComponent } from './GameServerSearchSelectComponent';
import { KungfuSearchSelectComponent } from './KungfuSearchSelectComponent';

type Props = {
  className?: string;
};

const isRaidSignupRole = (value: unknown): value is RaidSignupRole =>
  typeof value === 'string' &&
  raidSignupRoleItems.some((item) => item.value === value);

const RaidMemberPanel = ({ className }: Props) => {
  const { raidRun, selectedSlot, updateRaidRun } = useRaidRun();
  const signup = selectedSlot
    ? getRaidSignupAt(
        raidRun,
        selectedSlot.groupNumber,
        selectedSlot.positionNumber,
      )
    : undefined;

  if (!selectedSlot || !signup) {
    return null;
  }

  const updateSignup = (updater: Parameters<typeof updateRaidSignupAt>[3]) => {
    updateRaidRun((run) =>
      updateRaidSignupAt(
        run,
        selectedSlot.groupNumber,
        selectedSlot.positionNumber,
        updater,
      ),
    );
  };

  return (
    <Card className={cn(className)}>
      <CardHeader>
        <CardTitle>团员属性</CardTitle>
      </CardHeader>
      <CardContent>
        <FieldGroup>
          <p className="text-sm text-muted-foreground">
            {formatRaidSignupSlotTitle(
              signup.groupNumber,
              signup.positionNumber,
            )}
          </p>

          <Field>
            <FieldLabel htmlFor="raid-signup-role">职能</FieldLabel>
            <Select
              items={raidSignupRoleItems}
              value={signup.role}
              onValueChange={(next) => {
                if (!isRaidSignupRole(next)) {
                  return;
                }
                updateSignup((current) => setRaidSignupRole(current, next));
              }}
            >
              <SelectTrigger id="raid-signup-role" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {raidSignupRoleItems.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>

          <Field>
            <FieldLabel htmlFor="raid-signup-character-name">角色名</FieldLabel>
            <Input
              id="raid-signup-character-name"
              value={signup.characterName ?? ''}
              placeholder="角色名"
              onChange={(event) =>
                updateSignup((current) =>
                  setRaidSignupCharacterName(current, event.target.value),
                )
              }
            />
          </Field>

          <KungfuSearchSelectComponent
            id="raid-signup-kungfu"
            value={signup.kungfuId}
            onValueChange={(kungfu) =>
              updateSignup((current) => setRaidSignupKungfu(current, kungfu))
            }
          />

          <GameServerSearchSelectComponent
            id="raid-signup-server"
            value={signup.serverId}
            onValueChange={(serverId) =>
              updateSignup((current) =>
                setRaidSignupServerId(current, serverId),
              )
            }
          />

          <Field orientation="horizontal" className="w-fit">
            <Checkbox
              id="raid-signup-leader"
              checked={signup.isLeader}
              onCheckedChange={(checked) =>
                updateRaidRun((run) =>
                  setRaidSignupLeaderExclusive(
                    run,
                    selectedSlot.groupNumber,
                    selectedSlot.positionNumber,
                    checked === true,
                  ),
                )
              }
            />
            <FieldLabel htmlFor="raid-signup-leader">是否团长</FieldLabel>
          </Field>

          <Field orientation="horizontal" className="w-fit">
            <Checkbox
              id="raid-signup-dark-run"
              checked={signup.isDarkRun}
              onCheckedChange={(checked) =>
                updateRaidRun((run) =>
                  setRaidSignupDarkRunExclusive(
                    run,
                    selectedSlot.groupNumber,
                    selectedSlot.positionNumber,
                    checked === true,
                  ),
                )
              }
            />
            <FieldLabel htmlFor="raid-signup-dark-run">是否黑本</FieldLabel>
          </Field>

          <Field orientation="horizontal" className="w-fit">
            <Checkbox
              id="raid-signup-formation-core"
              checked={signup.isFormationCore}
              onCheckedChange={(checked) =>
                updateRaidRun((run) =>
                  setRaidSignupFormationCoreExclusive(
                    run,
                    selectedSlot.groupNumber,
                    selectedSlot.positionNumber,
                    checked === true,
                  ),
                )
              }
            />
            <FieldLabel htmlFor="raid-signup-formation-core">
              是否阵眼
            </FieldLabel>
          </Field>

          <Field>
            <FieldLabel htmlFor="raid-signup-remark">备注</FieldLabel>
            <Textarea
              id="raid-signup-remark"
              value={signup.remark ?? ''}
              placeholder="可选，其他补充"
              onChange={(event) =>
                updateSignup((current) =>
                  setRaidSignupRemark(current, event.target.value),
                )
              }
            />
          </Field>
        </FieldGroup>
      </CardContent>
    </Card>
  );
};

export default RaidMemberPanel;
