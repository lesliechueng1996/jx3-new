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
import type { SchoolsSearch } from '../-lib/schools-schema';

type SchoolFiltersComponentProps = {
  committedFilters: SchoolsSearch;
  onSearch: (filters: SchoolsSearch) => void;
  onReset: () => void;
};

const TYPE_FILTER_ITEMS = [
  { label: '全部', value: 'all' },
  { label: '门派', value: 'school' },
  { label: '流派', value: 'genre' },
];

const typeFilterValue = (type: SchoolsSearch['type']) => type ?? 'all';

export function SchoolFiltersComponent({
  committedFilters,
  onSearch,
  onReset,
}: SchoolFiltersComponentProps) {
  const [draft, setDraft] = useState<SchoolsSearch>(committedFilters);

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
      <FieldGroup className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Field>
          <FieldLabel htmlFor="filter-school-name">名称</FieldLabel>
          <Input
            id="filter-school-name"
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
          <FieldLabel htmlFor="filter-school-type">类型</FieldLabel>
          <Select
            items={TYPE_FILTER_ITEMS}
            value={typeFilterValue(draft.type)}
            onValueChange={(next) => {
              if (next === 'school' || next === 'genre') {
                setDraft((current) => ({ ...current, type: next }));
                return;
              }
              setDraft((current) => ({ ...current, type: undefined }));
            }}
          >
            <SelectTrigger id="filter-school-type" className="w-full">
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
