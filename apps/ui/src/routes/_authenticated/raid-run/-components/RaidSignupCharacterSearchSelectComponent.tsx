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
  type RaidSignupSearchItem,
  raidSignupsSearchQueryKey,
  searchRaidSignups,
} from '@/lib/api/raid-signups-api';
import {
  formatRaidSignupCharacterSearchLabel,
  matchesRaidSignupCharacterQuery,
} from '../-lib/raid-signup';

const EMPTY_ITEMS: RaidSignupSearchItem[] = [];

type RaidSignupCharacterSearchSelectComponentProps = {
  id?: string;
  value?: string;
  disabled?: boolean;
  placeholder?: string;
  debounceMs?: number;
  onInputValueChange: (value: string) => void;
  onValueChange: (item: RaidSignupSearchItem) => void;
};

const isTypingReason = (reason: string) => reason === 'input-change';

export function RaidSignupCharacterSearchSelectComponent({
  id,
  value = '',
  disabled = false,
  placeholder = '角色名',
  debounceMs = 300,
  onInputValueChange,
  onValueChange,
}: RaidSignupCharacterSearchSelectComponentProps) {
  const [inputValue, setInputValue] = useState(value);
  const [selectedItem, setSelectedItem] = useState<RaidSignupSearchItem | null>(
    null,
  );
  const inputValueRef = useRef(inputValue);
  const isFocusedRef = useRef(false);
  const ignoreNextInputRef = useRef(false);
  inputValueRef.current = inputValue;

  const trimmedInput = inputValue.trim();
  const [debouncedQuery] = useDebounceValue(trimmedInput, debounceMs);
  const searchQuery = useQuery({
    queryKey: raidSignupsSearchQueryKey(debouncedQuery),
    queryFn: () => searchRaidSignups(debouncedQuery),
    enabled: debouncedQuery.length > 0 && debouncedQuery.length <= 64,
  });

  const results = useMemo(() => {
    if (debouncedQuery.length === 0) {
      return EMPTY_ITEMS;
    }

    return searchQuery.data ?? EMPTY_ITEMS;
  }, [debouncedQuery, searchQuery.data]);

  useEffect(() => {
    if (isFocusedRef.current) {
      return;
    }
    setInputValue(value);
    setSelectedItem((current) =>
      current && current.characterName !== value ? null : current,
    );
  }, [value]);

  const isSearchPending =
    trimmedInput.length > 0 &&
    (debouncedQuery !== trimmedInput || searchQuery.isFetching);

  let emptyMessage = '请输入角色名';
  if (searchQuery.isError) {
    emptyMessage = '搜索角色名失败';
  } else if (isSearchPending) {
    emptyMessage = '搜索中...';
  } else if (debouncedQuery.length > 0) {
    emptyMessage = '未找到历史角色';
  }

  const updateInput = (next: string) => {
    setInputValue(next);
    onInputValueChange(next);
  };

  const commitSelection = (next: RaidSignupSearchItem) => {
    ignoreNextInputRef.current = true;
    inputValueRef.current = next.characterName;
    setSelectedItem(next);
    setInputValue(next.characterName);
    onValueChange(next);
    window.setTimeout(() => {
      ignoreNextInputRef.current = false;
      setInputValue(next.characterName);
    }, 0);
  };

  return (
    <Field>
      <FieldLabel htmlFor={id}>角色名</FieldLabel>
      <Combobox
        items={results}
        value={selectedItem}
        inputValue={inputValue}
        disabled={disabled}
        itemToStringLabel={(item: RaidSignupSearchItem) => item.characterName}
        itemToStringValue={(item: RaidSignupSearchItem) => item.id}
        isItemEqualToValue={(item, selected) => item.id === selected?.id}
        filter={(item: RaidSignupSearchItem, query) =>
          matchesRaidSignupCharacterQuery(item, query)
        }
        onInputValueChange={(next, details) => {
          if (ignoreNextInputRef.current) {
            setInputValue(inputValueRef.current);
            return;
          }
          if (!isTypingReason(details.reason)) {
            return;
          }
          setSelectedItem(null);
          updateInput(next);
        }}
        onValueChange={(next, details) => {
          if (
            isTypingReason(details.reason) ||
            details.reason === 'escape-key'
          ) {
            return;
          }
          if (!next) {
            return;
          }
          commitSelection(next);
        }}
      >
        <ComboboxInput
          id={id}
          className="w-full"
          placeholder={placeholder}
          disabled={disabled}
          aria-label="角色名"
          onFocus={() => {
            isFocusedRef.current = true;
          }}
          onBlur={() => {
            isFocusedRef.current = false;
          }}
        />
        <ComboboxContent>
          <ComboboxEmpty>{emptyMessage}</ComboboxEmpty>
          <ComboboxList>
            {(item) => (
              <ComboboxItem key={item.id} value={item}>
                {formatRaidSignupCharacterSearchLabel(item)}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </Field>
  );
}
