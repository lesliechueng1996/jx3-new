import { useQuery } from '@tanstack/react-query';
import { type KeyboardEvent, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
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
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
  gameServersAllQueryKey,
  listAllGameServers,
} from '@/lib/api/game-servers-api';
import { kungfusAllQueryKey, listAllKungfus } from '@/lib/api/kungfus-api';
import { formatGameServerFilterLabel } from '../-lib/raid-signups-filter-select';
import {
  isRaidSignupFlag,
  raidSignupFlagLabel,
  raidSignupRoleLabel,
} from '../-lib/raid-signups-helpers';
import {
  type RaidSignupsSearch,
  raidSignupFlagValues,
  raidSignupRoleValues,
} from '../-lib/raid-signups-schema';
import { RaidSignupFilterSelectComponent } from './RaidSignupFilterSelectComponent';

type RaidSignupFiltersComponentProps = {
  committedFilters: RaidSignupsSearch;
  onSearch: (filters: RaidSignupsSearch) => void;
  onReset: () => void;
};

const ROLE_FILTER_ITEMS = [
  { label: '全部', value: 'all' },
  ...raidSignupRoleValues.map((value) => ({
    label: raidSignupRoleLabel(value),
    value,
  })),
];

const roleFilterValue = (role: RaidSignupsSearch['role']) => role ?? 'all';

export function RaidSignupFiltersComponent({
  committedFilters,
  onSearch,
  onReset,
}: RaidSignupFiltersComponentProps) {
  const [draft, setDraft] = useState<RaidSignupsSearch>(committedFilters);
  const serversQuery = useQuery({
    queryKey: gameServersAllQueryKey,
    queryFn: listAllGameServers,
  });
  const kungfusQuery = useQuery({
    queryKey: kungfusAllQueryKey,
    queryFn: listAllKungfus,
  });

  useEffect(() => {
    setDraft(committedFilters);
  }, [committedFilters]);

  const handleSearch = () => {
    onSearch({ ...draft, page: 1 });
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleSearch();
    }
  };

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border p-4">
      <FieldGroup className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Field>
          <FieldLabel htmlFor="filter-raid-signup-character">角色名</FieldLabel>
          <Input
            id="filter-raid-signup-character"
            value={draft.characterName ?? ''}
            placeholder="搜索角色名"
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                characterName: event.target.value || undefined,
              }))
            }
            onKeyDown={handleKeyDown}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="filter-raid-signup-raid-run">
            团队名称
          </FieldLabel>
          <Input
            id="filter-raid-signup-raid-run"
            value={draft.raidRunName ?? ''}
            placeholder="搜索团队名称"
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                raidRunName: event.target.value || undefined,
              }))
            }
            onKeyDown={handleKeyDown}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="filter-raid-signup-server">区服</FieldLabel>
          <RaidSignupFilterSelectComponent
            id="filter-raid-signup-server"
            value={draft.serverId}
            items={serversQuery.data ?? []}
            isPending={serversQuery.isPending}
            isError={serversQuery.isError}
            placeholder="选择区服"
            emptyMessage="未找到区服"
            loadingMessage="加载中..."
            errorMessage="加载区服失败"
            itemLabel={formatGameServerFilterLabel}
            onValueChange={(serverId) =>
              setDraft((current) => ({ ...current, serverId }))
            }
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="filter-raid-signup-kungfu">心法</FieldLabel>
          <RaidSignupFilterSelectComponent
            id="filter-raid-signup-kungfu"
            value={draft.kungfuId}
            items={kungfusQuery.data ?? []}
            isPending={kungfusQuery.isPending}
            isError={kungfusQuery.isError}
            placeholder="选择心法"
            emptyMessage="未找到心法"
            loadingMessage="加载中..."
            errorMessage="加载心法失败"
            onValueChange={(kungfuId) =>
              setDraft((current) => ({ ...current, kungfuId }))
            }
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="filter-raid-signup-role">职能</FieldLabel>
          <Select
            items={ROLE_FILTER_ITEMS}
            value={roleFilterValue(draft.role)}
            onValueChange={(next) => {
              if (
                next === 'pending' ||
                next === 'tank' ||
                next === 'healer' ||
                next === 'dps' ||
                next === 'boss'
              ) {
                setDraft((current) => ({ ...current, role: next }));
                return;
              }
              setDraft((current) => ({ ...current, role: undefined }));
            }}
          >
            <SelectTrigger id="filter-raid-signup-role" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent alignItemWithTrigger={false}>
              <SelectGroup>
                {ROLE_FILTER_ITEMS.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>
        <Field>
          <FieldLabel id="filter-raid-signup-flags">标记</FieldLabel>
          <ToggleGroup
            multiple
            variant="outline"
            className="flex flex-wrap"
            aria-labelledby="filter-raid-signup-flags"
            value={draft.flags ?? []}
            onValueChange={(next) => {
              const flags = next.filter(isRaidSignupFlag);
              setDraft((current) => ({
                ...current,
                flags: flags.length > 0 ? flags : undefined,
              }));
            }}
          >
            {raidSignupFlagValues.map((flag) => (
              <ToggleGroupItem key={flag} value={flag}>
                {raidSignupFlagLabel(flag)}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </Field>
      </FieldGroup>
      <div className="flex items-center gap-2">
        <Button type="button" onClick={handleSearch}>
          搜索
        </Button>
        <Button type="button" variant="outline" onClick={onReset}>
          重置
        </Button>
      </div>
    </div>
  );
}
