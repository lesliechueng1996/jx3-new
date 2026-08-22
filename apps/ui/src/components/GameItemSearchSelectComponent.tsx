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
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import {
  type GameItemSearchItem,
  gameItemsSearchQueryKey,
  searchGameItems,
} from '@/lib/api/game-items-api';

const EMPTY_ITEMS: GameItemSearchItem[] = [];

type GameItemSearchSelectComponentProps = {
  id?: string;
  label?: string;
  value?: string;
  excludeId?: string;
  disabled?: boolean;
  placeholder?: string;
  error?: string;
  debounceMs?: number;
  onValueChange: (itemId: string | undefined) => void;
};

const isTypingReason = (reason: string) =>
  reason === 'input-change' || reason === 'input-clear';

const matchesItemQuery = (item: GameItemSearchItem, query: string) => {
  const normalized = query.trim().toLowerCase();
  if (normalized.length === 0) {
    return true;
  }

  if (item.name.toLowerCase().includes(normalized)) {
    return true;
  }

  return item.alias.some((alias) => alias.toLowerCase().includes(normalized));
};

export function GameItemSearchSelectComponent({
  id,
  label = '替换为',
  value,
  excludeId,
  disabled = false,
  placeholder = '输入物品名称搜索',
  error,
  debounceMs = 300,
  onValueChange,
}: GameItemSearchSelectComponentProps) {
  const [inputValue, setInputValue] = useState('');
  const [selectedItem, setSelectedItem] = useState<GameItemSearchItem | null>(
    null,
  );
  const inputValueRef = useRef(inputValue);
  const isFocusedRef = useRef(false);
  const skipBlurCommitRef = useRef(false);
  inputValueRef.current = inputValue;

  const trimmedInput = inputValue.trim();
  const [debouncedQuery] = useDebounceValue(trimmedInput, debounceMs);
  const searchQuery = useQuery({
    queryKey: gameItemsSearchQueryKey(debouncedQuery),
    queryFn: () => searchGameItems(debouncedQuery),
    enabled: debouncedQuery.length > 0,
  });

  const results = useMemo(() => {
    if (debouncedQuery.length === 0) {
      return EMPTY_ITEMS;
    }

    const rows = searchQuery.data ?? EMPTY_ITEMS;
    if (!excludeId) {
      return rows;
    }

    return rows.filter((item) => item.id !== excludeId);
  }, [debouncedQuery, excludeId, searchQuery.data]);

  const items = useMemo(() => {
    if (selectedItem && !results.some((item) => item.id === selectedItem.id)) {
      return [selectedItem, ...results];
    }
    return results;
  }, [results, selectedItem]);

  const selectedId = value ?? selectedItem?.id;
  const selectedFromValue =
    items.find((item) => item.id === selectedId) ??
    (selectedItem?.id === selectedId ? selectedItem : null);

  useEffect(() => {
    if (value) {
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
    setInputValue(selectedFromValue?.name ?? '');
  }, [selectedFromValue]);

  const isSearchPending =
    trimmedInput.length > 0 &&
    (debouncedQuery !== trimmedInput || searchQuery.isFetching);

  let emptyMessage = '请输入物品名称';
  if (searchQuery.isError) {
    emptyMessage = '搜索物品失败';
  } else if (isSearchPending) {
    emptyMessage = '搜索中...';
  } else if (debouncedQuery.length > 0) {
    emptyMessage = '未找到物品';
  }

  const selectedLabel = () => selectedFromValue?.name ?? '';

  const commitSelection = (next: GameItemSearchItem) => {
    setSelectedItem(next);
    onValueChange(next.id);
  };

  const commitInput = () => {
    const trimmed = inputValueRef.current.trim();
    if (trimmed.length === 0) {
      setInputValue(selectedLabel());
      return;
    }

    const exact = items.find(
      (item) => item.name.toLowerCase() === trimmed.toLowerCase(),
    );
    if (exact) {
      commitSelection(exact);
      setInputValue(exact.name);
      return;
    }

    setInputValue(selectedLabel());
  };

  return (
    <Field data-invalid={Boolean(error) || undefined}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Combobox
        items={items}
        value={selectedFromValue}
        inputValue={inputValue}
        disabled={disabled}
        itemToStringLabel={(item) => item.name}
        itemToStringValue={(item) => item.id}
        isItemEqualToValue={(item, selected) => item.id === selected?.id}
        filter={matchesItemQuery}
        onInputValueChange={setInputValue}
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
            setInputValue(inputValueRef.current);
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
          aria-label={label}
          aria-invalid={Boolean(error)}
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
                {item.name}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
      {error ? <FieldError>{error}</FieldError> : null}
    </Field>
  );
}
