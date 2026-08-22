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
import { DIFFICULTY_OPTIONS } from '../-lib/game-dungeons-helpers';
import type { GameDungeonsSearch } from '../-lib/game-dungeons-schema';
import { ExpansionSeasonSelectComponent } from './ExpansionSeasonSelectComponent';

type GameDungeonFiltersComponentProps = {
  committedFilters: GameDungeonsSearch;
  onSearch: (filters: GameDungeonsSearch) => void;
  onReset: () => void;
};

const DIFFICULTY_FILTER_ITEMS = [
  { label: '全部', value: 'all' },
  ...DIFFICULTY_OPTIONS.map((item) => ({
    label: item.label,
    value: item.value,
  })),
];

const difficultyFilterValue = (difficulty: GameDungeonsSearch['difficulty']) =>
  difficulty ?? 'all';

export function GameDungeonFiltersComponent({
  committedFilters,
  onSearch,
  onReset,
}: GameDungeonFiltersComponentProps) {
  const [draft, setDraft] = useState<GameDungeonsSearch>(committedFilters);

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
          <FieldLabel htmlFor="filter-dungeon-name">名称</FieldLabel>
          <Input
            id="filter-dungeon-name"
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
        <ExpansionSeasonSelectComponent
          expansionFieldId="filter-dungeon-expansion"
          seasonFieldId="filter-dungeon-season"
          expansionId={draft.expansionId}
          seasonId={draft.seasonId}
          allowEmpty
          onChange={({ expansionId, seasonId }) =>
            setDraft((current) => ({
              ...current,
              expansionId,
              seasonId,
            }))
          }
        />
        <Field>
          <FieldLabel htmlFor="filter-dungeon-difficulty">难度</FieldLabel>
          <Select
            items={DIFFICULTY_FILTER_ITEMS}
            value={difficultyFilterValue(draft.difficulty)}
            onValueChange={(next) => {
              if (
                next === 'normal' ||
                next === 'heroic' ||
                next === 'challenge'
              ) {
                setDraft((current) => ({ ...current, difficulty: next }));
                return;
              }
              setDraft((current) => ({ ...current, difficulty: undefined }));
            }}
          >
            <SelectTrigger id="filter-dungeon-difficulty" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent alignItemWithTrigger={false}>
              <SelectGroup>
                {DIFFICULTY_FILTER_ITEMS.map((item) => (
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
