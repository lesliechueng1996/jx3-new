import { useEffect, useMemo, useRef, useState } from 'react';
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
  formatRaidLootWinnerLabel,
  matchesRaidLootWinnerQuery,
  type RaidLootWinnerOption,
} from '../-lib/raid-loot';

type Props = {
  id?: string;
  value?: string;
  options: RaidLootWinnerOption[];
  disabled?: boolean;
  placeholder?: string;
  onValueChange: (signupId: string | undefined) => void;
};

const isTypingReason = (reason: string) =>
  reason === 'input-change' || reason === 'input-clear';

export const RaidLootWinnerSelectComponent = ({
  id,
  value,
  options,
  disabled = false,
  placeholder = '输入角色名筛选',
  onValueChange,
}: Props) => {
  const selected = options.find((option) => option.id === value) ?? null;
  const [inputValue, setInputValue] = useState(
    selected ? formatRaidLootWinnerLabel(selected) : '',
  );
  const inputValueRef = useRef(inputValue);
  const isFocusedRef = useRef(false);
  const skipBlurCommitRef = useRef(false);
  inputValueRef.current = inputValue;

  useEffect(() => {
    if (isFocusedRef.current) {
      return;
    }
    setInputValue(selected ? formatRaidLootWinnerLabel(selected) : '');
  }, [selected]);

  const selectedLabel = () =>
    selected ? formatRaidLootWinnerLabel(selected) : '';

  const commitSelection = (next: RaidLootWinnerOption | null) => {
    onValueChange(next?.id);
  };

  const commitInput = () => {
    const trimmed = inputValueRef.current.trim();
    if (trimmed.length === 0) {
      commitSelection(null);
      setInputValue('');
      return;
    }

    const normalized = trimmed.toLowerCase();
    const exact = options.find(
      (option) =>
        option.characterName.toLowerCase() === normalized ||
        formatRaidLootWinnerLabel(option).toLowerCase() === normalized,
    );
    if (exact) {
      commitSelection(exact);
      setInputValue(formatRaidLootWinnerLabel(exact));
      return;
    }

    setInputValue(selectedLabel());
  };

  const emptyMessage = useMemo(() => {
    if (options.length === 0) {
      return '暂无可选角色';
    }
    return '未找到角色';
  }, [options.length]);

  return (
    <Field>
      <FieldLabel htmlFor={id}>获得者</FieldLabel>
      <Combobox
        items={options}
        value={selected}
        inputValue={inputValue}
        disabled={disabled}
        itemToStringLabel={formatRaidLootWinnerLabel}
        itemToStringValue={(item) => item.id}
        isItemEqualToValue={(item, current) => item.id === current?.id}
        filter={matchesRaidLootWinnerQuery}
        onInputValueChange={setInputValue}
        onValueChange={(next, details) => {
          if (
            isTypingReason(details.reason) ||
            details.reason === 'escape-key'
          ) {
            skipBlurCommitRef.current = false;
            return;
          }
          skipBlurCommitRef.current = true;
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
          aria-label="获得者"
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
                {formatRaidLootWinnerLabel(item)}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </Field>
  );
};
