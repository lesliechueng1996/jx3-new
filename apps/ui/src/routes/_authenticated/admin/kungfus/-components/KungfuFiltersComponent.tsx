import { type KeyboardEvent, useEffect, useState } from 'react';
import { SchoolSelectComponent } from '@/components/SchoolSelectComponent';
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
import type { KungfusSearch } from '../-lib/kungfus-schema';

type KungfuFiltersComponentProps = {
  committedFilters: KungfusSearch;
  onSearch: (filters: KungfusSearch) => void;
  onReset: () => void;
};

const TYPE_FILTER_ITEMS = [
  { label: '全部', value: 'all' },
  { label: '防御', value: 'defense' },
  { label: '治疗', value: 'heal' },
  { label: '攻击', value: 'attack' },
];

const UNLIMITED_FILTER_ITEMS = [
  { label: '全部', value: 'all' },
  { label: '无界', value: 'true' },
  { label: '非无界', value: 'false' },
];

const ATTACK_TYPE_FILTER_ITEMS = [
  { label: '全部', value: 'all' },
  { label: '内功', value: 'internal' },
  { label: '外功', value: 'external' },
];

const ATTACK_METHOD_FILTER_ITEMS = [
  { label: '全部', value: 'all' },
  { label: '近战', value: 'melee' },
  { label: '远程', value: 'ranged' },
];

const typeFilterValue = (type: KungfusSearch['kungfuType']) => type ?? 'all';
const attackTypeFilterValue = (attackType: KungfusSearch['attackType']) =>
  attackType ?? 'all';
const attackMethodFilterValue = (attackMethod: KungfusSearch['attackMethod']) =>
  attackMethod ?? 'all';
const unlimitedFilterValue = (isUnlimited: KungfusSearch['isUnlimited']) =>
  isUnlimited ?? 'all';

export function KungfuFiltersComponent({
  committedFilters,
  onSearch,
  onReset,
}: KungfuFiltersComponentProps) {
  const [draft, setDraft] = useState<KungfusSearch>(committedFilters);

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
          <FieldLabel htmlFor="filter-kungfu-name">名称</FieldLabel>
          <Input
            id="filter-kungfu-name"
            value={draft.name ?? ''}
            placeholder="搜索名称"
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                name: event.target.value || undefined,
              }))
            }
            onKeyDown={handleKeyDown}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="filter-kungfu-school">门派</FieldLabel>
          <SchoolSelectComponent
            id="filter-kungfu-school"
            value={draft.schoolId}
            allowEmpty
            onValueChange={(schoolId) =>
              setDraft((current) => ({ ...current, schoolId }))
            }
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="filter-kungfu-type">心法类型</FieldLabel>
          <Select
            items={TYPE_FILTER_ITEMS}
            value={typeFilterValue(draft.kungfuType)}
            onValueChange={(next) => {
              if (next === 'defense' || next === 'heal' || next === 'attack') {
                setDraft((current) => ({ ...current, kungfuType: next }));
                return;
              }
              setDraft((current) => ({ ...current, kungfuType: undefined }));
            }}
          >
            <SelectTrigger id="filter-kungfu-type" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent alignItemWithTrigger={false}>
              <SelectGroup>
                {TYPE_FILTER_ITEMS.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>
        <Field>
          <FieldLabel htmlFor="filter-kungfu-attack-type">攻击类型</FieldLabel>
          <Select
            items={ATTACK_TYPE_FILTER_ITEMS}
            value={attackTypeFilterValue(draft.attackType)}
            onValueChange={(next) => {
              if (next === 'internal' || next === 'external') {
                setDraft((current) => ({ ...current, attackType: next }));
                return;
              }
              setDraft((current) => ({ ...current, attackType: undefined }));
            }}
          >
            <SelectTrigger id="filter-kungfu-attack-type" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent alignItemWithTrigger={false}>
              <SelectGroup>
                {ATTACK_TYPE_FILTER_ITEMS.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>
        <Field>
          <FieldLabel htmlFor="filter-kungfu-attack-method">
            攻击方式
          </FieldLabel>
          <Select
            items={ATTACK_METHOD_FILTER_ITEMS}
            value={attackMethodFilterValue(draft.attackMethod)}
            onValueChange={(next) => {
              if (next === 'melee' || next === 'ranged') {
                setDraft((current) => ({ ...current, attackMethod: next }));
                return;
              }
              setDraft((current) => ({ ...current, attackMethod: undefined }));
            }}
          >
            <SelectTrigger id="filter-kungfu-attack-method" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent alignItemWithTrigger={false}>
              <SelectGroup>
                {ATTACK_METHOD_FILTER_ITEMS.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>
        <Field>
          <FieldLabel htmlFor="filter-kungfu-unlimited">无界</FieldLabel>
          <Select
            items={UNLIMITED_FILTER_ITEMS}
            value={unlimitedFilterValue(draft.isUnlimited)}
            onValueChange={(next) => {
              if (next === 'true' || next === 'false') {
                setDraft((current) => ({ ...current, isUnlimited: next }));
                return;
              }
              setDraft((current) => ({ ...current, isUnlimited: undefined }));
            }}
          >
            <SelectTrigger id="filter-kungfu-unlimited" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent alignItemWithTrigger={false}>
              <SelectGroup>
                {UNLIMITED_FILTER_ITEMS.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
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
