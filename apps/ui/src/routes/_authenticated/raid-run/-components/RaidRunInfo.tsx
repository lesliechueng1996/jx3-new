import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { useRaidRun } from '../-hook/use-raid-run';
import {
  formatRaidDungeonLabel,
  type RaidRun,
  setRaidRunDescription,
  setRaidRunDungeon,
  setRaidRunDungeonInput,
  setRaidRunEndTime,
  setRaidRunGatherTime,
  setRaidRunName,
  setRaidRunRemark,
  setRaidRunReservedBoss,
  setRaidRunReservedDps,
  setRaidRunReservedHealer,
  setRaidRunReservedTank,
  setRaidRunStartTime,
} from '../-lib/raid-run';
import { GameDungeonSearchSelectComponent } from './GameDungeonSearchSelectComponent';

type Props = {
  className?: string;
};

const padDatePart = (value: number) => String(value).padStart(2, '0');

const toDateTimeLocalValue = (date: Date) =>
  `${date.getFullYear()}-${padDatePart(date.getMonth() + 1)}-${padDatePart(date.getDate())}T${padDatePart(date.getHours())}:${padDatePart(date.getMinutes())}`;

const parseDateTimeLocalValue = (value: string) => {
  if (value.length === 0) {
    return undefined;
  }

  const next = new Date(value);
  return Number.isNaN(next.getTime()) ? undefined : next;
};

const parseReservedCount = (value: string) => {
  if (value.length === 0) {
    return 0;
  }

  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed < 0) {
    return undefined;
  }

  return parsed;
};

const RaidRunInfo = ({ className }: Props) => {
  const { raidRun, updateRaidRun } = useRaidRun();

  const handleTimeChange = (
    value: string,
    setter: (run: RaidRun, date: Date) => RaidRun,
  ) => {
    const next = parseDateTimeLocalValue(value);
    if (!next) {
      return;
    }
    updateRaidRun((run) => setter(run, next));
  };

  const handleReservedChange = (
    value: string,
    setter: (run: RaidRun, count: number) => RaidRun,
  ) => {
    const next = parseReservedCount(value);
    if (next === undefined) {
      return;
    }
    updateRaidRun((run) => setter(run, next));
  };

  return (
    <Card className={cn(className)}>
      <CardHeader>
        <CardTitle>开团信息</CardTitle>
      </CardHeader>
      <CardContent>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="raid-run-name">团队名称</FieldLabel>
            <Input
              id="raid-run-name"
              value={raidRun.name ?? ''}
              placeholder="例如：周六英雄团"
              onChange={(event) =>
                updateRaidRun((run) => setRaidRunName(run, event.target.value))
              }
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="raid-run-description">描述</FieldLabel>
            <Textarea
              id="raid-run-description"
              value={raidRun.description ?? ''}
              placeholder="可选，开团说明"
              onChange={(event) =>
                updateRaidRun((run) =>
                  setRaidRunDescription(run, event.target.value),
                )
              }
            />
          </Field>

          <GameDungeonSearchSelectComponent
            id="raid-run-dungeon"
            value={raidRun.dungeon}
            onInputValueChange={(dungeonInput) =>
              updateRaidRun((run) => setRaidRunDungeonInput(run, dungeonInput))
            }
            onValueChange={(dungeon) =>
              updateRaidRun((run) =>
                setRaidRunDungeon(
                  setRaidRunDungeonInput(run, formatRaidDungeonLabel(dungeon)),
                  dungeon,
                ),
              )
            }
          />

          <Field>
            <FieldLabel htmlFor="raid-run-gather-time">集合时间</FieldLabel>
            <Input
              id="raid-run-gather-time"
              type="datetime-local"
              step={60}
              value={toDateTimeLocalValue(raidRun.gatherTime)}
              onChange={(event) =>
                handleTimeChange(event.target.value, setRaidRunGatherTime)
              }
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="raid-run-start-time">进本时间</FieldLabel>
            <Input
              id="raid-run-start-time"
              type="datetime-local"
              step={60}
              value={toDateTimeLocalValue(raidRun.startTime)}
              onChange={(event) =>
                handleTimeChange(event.target.value, setRaidRunStartTime)
              }
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="raid-run-end-time">预计结束时间</FieldLabel>
            <Input
              id="raid-run-end-time"
              type="datetime-local"
              step={60}
              value={toDateTimeLocalValue(raidRun.endTime)}
              onChange={(event) =>
                handleTimeChange(event.target.value, setRaidRunEndTime)
              }
            />
          </Field>

          <FieldSet>
            <FieldLegend variant="label">预留人数</FieldLegend>
            <FieldGroup>
              <FieldGroup className="flex-row">
                <Field>
                  <FieldLabel htmlFor="raid-run-reserved-tank">
                    坦克预留
                  </FieldLabel>
                  <Input
                    id="raid-run-reserved-tank"
                    type="number"
                    min={0}
                    step={1}
                    value={raidRun.reservedTank}
                    onChange={(event) =>
                      handleReservedChange(
                        event.target.value,
                        setRaidRunReservedTank,
                      )
                    }
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="raid-run-reserved-healer">
                    治疗预留
                  </FieldLabel>
                  <Input
                    id="raid-run-reserved-healer"
                    type="number"
                    min={0}
                    step={1}
                    value={raidRun.reservedHealer}
                    onChange={(event) =>
                      handleReservedChange(
                        event.target.value,
                        setRaidRunReservedHealer,
                      )
                    }
                  />
                </Field>
              </FieldGroup>

              <FieldGroup className="flex-row">
                <Field>
                  <FieldLabel htmlFor="raid-run-reserved-dps">
                    DPS 预留
                  </FieldLabel>
                  <Input
                    id="raid-run-reserved-dps"
                    type="number"
                    min={0}
                    step={1}
                    value={raidRun.reservedDps}
                    onChange={(event) =>
                      handleReservedChange(
                        event.target.value,
                        setRaidRunReservedDps,
                      )
                    }
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="raid-run-reserved-boss">
                    老板预留
                  </FieldLabel>
                  <Input
                    id="raid-run-reserved-boss"
                    type="number"
                    min={0}
                    step={1}
                    value={raidRun.reservedBoss}
                    onChange={(event) =>
                      handleReservedChange(
                        event.target.value,
                        setRaidRunReservedBoss,
                      )
                    }
                  />
                </Field>
              </FieldGroup>
            </FieldGroup>
          </FieldSet>

          <Field>
            <FieldLabel htmlFor="raid-run-remark">备注</FieldLabel>
            <Textarea
              id="raid-run-remark"
              value={raidRun.remark ?? ''}
              placeholder="可选，其他补充"
              onChange={(event) =>
                updateRaidRun((run) =>
                  setRaidRunRemark(run, event.target.value),
                )
              }
            />
          </Field>
        </FieldGroup>
      </CardContent>
    </Card>
  );
};

export default RaidRunInfo;
