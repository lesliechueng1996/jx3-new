import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useDebounceValue } from 'usehooks-ts';
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from '@/components/ui/combobox';
import { Field, FieldLabel } from '@/components/ui/field';
import {
  type GameDungeonSearchItem,
  gameDungeonsSearchQueryKey,
  searchGameDungeons,
} from '@/lib/api/game-dungeons-api';
import { formatRaidDungeonLabel, type RaidDungeon } from '../-lib/raid-run';

const EMPTY_ITEMS: GameDungeonSearchItem[] = [];

type GameDungeonSearchSelectComponentProps = {
  id?: string;
  value?: RaidDungeon;
  disabled?: boolean;
  placeholder?: string;
  debounceMs?: number;
  onInputValueChange: (value: string) => void;
  onValueChange: (dungeon: RaidDungeon) => void;
};

const isTypingReason = (reason: string) =>
  reason === 'input-change' || reason === 'input-clear';

const matchesDungeonQuery = (item: GameDungeonSearchItem, query: string) => {
  const normalized = query.trim().toLowerCase();
  if (normalized.length === 0) {
    return true;
  }

  return item.name.toLowerCase().includes(normalized);
};

const toRaidDungeon = (item: GameDungeonSearchItem): RaidDungeon => ({
  id: item.id,
  name: item.name,
  playerLimit: item.playerLimit,
  bossCount: item.bossCount,
  difficulty: item.difficulty,
});

const toSearchItem = (dungeon: RaidDungeon): GameDungeonSearchItem => ({
  id: dungeon.id,
  name: dungeon.name,
  expansionId: '',
  expansionName: '',
  seasonId: '',
  seasonName: '',
  playerLimit: dungeon.playerLimit,
  difficulty: dungeon.difficulty,
  levelRequirement: 0,
  bossCount: dungeon.bossCount,
});

export function GameDungeonSearchSelectComponent({
  id,
  value,
  disabled = false,
  placeholder = '输入副本名称搜索',
  debounceMs = 300,
  onInputValueChange,
  onValueChange,
}: GameDungeonSearchSelectComponentProps) {
  const [inputValue, setInputValue] = useState(
    value ? formatRaidDungeonLabel(value) : '',
  );
  const [selectedItem, setSelectedItem] =
    useState<GameDungeonSearchItem | null>(value ? toSearchItem(value) : null);
  const inputValueRef = useRef(inputValue);
  const isFocusedRef = useRef(false);
  const skipBlurCommitRef = useRef(false);
  inputValueRef.current = inputValue;

  const trimmedInput = inputValue.trim();
  const [debouncedQuery] = useDebounceValue(trimmedInput, debounceMs);
  const searchQuery = useQuery({
    queryKey: gameDungeonsSearchQueryKey(debouncedQuery),
    queryFn: () => searchGameDungeons(debouncedQuery),
    enabled: debouncedQuery.length > 0 && debouncedQuery.length <= 64,
  });

  const results = useMemo(() => {
    if (debouncedQuery.length === 0) {
      return EMPTY_ITEMS;
    }

    return searchQuery.data ?? EMPTY_ITEMS;
  }, [debouncedQuery, searchQuery.data]);

  const items = useMemo(() => {
    if (selectedItem && !results.some((item) => item.id === selectedItem.id)) {
      return [selectedItem, ...results];
    }
    return results;
  }, [results, selectedItem]);

  const selectedId = value?.id ?? selectedItem?.id;
  const selectedFromValue =
    items.find((item) => item.id === selectedId) ??
    (selectedItem?.id === selectedId ? selectedItem : null);

  useEffect(() => {
    if (value) {
      setSelectedItem((current) =>
        current?.id === value.id ? current : toSearchItem(value),
      );
      return;
    }
    setSelectedItem(null);
    if (!isFocusedRef.current) {
      setInputValue('');
    }
  }, [value]);

  useEffect(() => {
    if (isFocusedRef.current) {
      return;
    }
    setInputValue(
      selectedFromValue ? formatRaidDungeonLabel(selectedFromValue) : '',
    );
  }, [selectedFromValue]);

  const isSearchPending =
    trimmedInput.length > 0 &&
    (debouncedQuery !== trimmedInput || searchQuery.isFetching);

  let emptyMessage = '请输入副本名称';
  if (searchQuery.isError) {
    emptyMessage = '搜索副本失败';
  } else if (isSearchPending) {
    emptyMessage = '搜索中...';
  } else if (debouncedQuery.length > 0) {
    emptyMessage = '未找到副本';
  }

  const selectedLabel = () =>
    selectedFromValue ? formatRaidDungeonLabel(selectedFromValue) : '';

  const updateInput = (next: string) => {
    setInputValue(next);
    onInputValueChange(next);
  };

  const commitSelection = (next: GameDungeonSearchItem) => {
    setSelectedItem(next);
    onValueChange(toRaidDungeon(next));
  };

  const commitInput = () => {
    const trimmed = inputValueRef.current.trim();
    if (trimmed.length === 0) {
      updateInput(selectedLabel());
      return;
    }

    const normalized = trimmed.toLowerCase();
    const exact = items.find(
      (item) =>
        item.name.toLowerCase() === normalized ||
        formatRaidDungeonLabel(item).toLowerCase() === normalized,
    );
    if (exact) {
      commitSelection(exact);
      updateInput(formatRaidDungeonLabel(exact));
      return;
    }

    updateInput(selectedLabel());
  };

  return (
    <Field>
      <FieldLabel htmlFor={id}>副本</FieldLabel>
      <Combobox
        items={items}
        value={selectedFromValue}
        inputValue={inputValue}
        disabled={disabled}
        itemToStringLabel={formatRaidDungeonLabel}
        itemToStringValue={(item) => item.id}
        isItemEqualToValue={(item, selected) => item.id === selected?.id}
        filter={matchesDungeonQuery}
        onInputValueChange={updateInput}
        onValueChange={(next, details) => {
          if (isTypingReason(details.reason)) {
            skipBlurCommitRef.current = false;
            return;
          }
          if (details.reason === 'escape-key') {
            return;
          }
          skipBlurCommitRef.current = true;
          if (!next) {
            return;
          }
          commitSelection(next);
        }}
        onOpenChange={(open, details) => {
          if (open || details.reason === 'item-press') {
            return;
          }
          if (details.reason === 'escape-key') {
            inputValueRef.current = selectedLabel();
            updateInput(inputValueRef.current);
            return;
          }
          commitInput();
        }}
      >
        <ComboboxInput
          id={id}
          className="w-full"
          placeholder={placeholder}
          disabled={disabled}
          aria-label="副本"
          onFocus={() => {
            isFocusedRef.current = true;
          }}
          onBlur={() => {
            isFocusedRef.current = false;
            window.setTimeout(() => {
              if (skipBlurCommitRef.current) {
                skipBlurCommitRef.current = false;
                return;
              }
              commitInput();
            }, 0);
          }}
        />
        <ComboboxContent>
          <ComboboxEmpty>{emptyMessage}</ComboboxEmpty>
          <ComboboxList>
            {(item) => (
              <ComboboxItem key={item.id} value={item}>
                {formatRaidDungeonLabel(item)}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </Field>
  );
}
