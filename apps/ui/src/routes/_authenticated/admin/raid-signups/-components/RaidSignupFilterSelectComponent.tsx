import { useEffect, useRef, useState } from 'react';
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from '@/components/ui/combobox';
import {
  EMPTY_FILTER_LABEL,
  matchesNamedFilterQuery,
  type NamedFilterOption,
  namedFilterInputLabel,
  resolveNamedFilterInput,
} from '../-lib/raid-signups-filter-select';

type RaidSignupFilterSelectComponentProps<T extends NamedFilterOption> = {
  id?: string;
  value?: string;
  items: T[];
  isPending?: boolean;
  isError?: boolean;
  placeholder: string;
  emptyMessage: string;
  loadingMessage: string;
  errorMessage: string;
  itemLabel?: (item: T) => string;
  onValueChange: (id: string | undefined) => void;
};

const EMPTY_OPTION: NamedFilterOption = {
  id: '',
  name: EMPTY_FILTER_LABEL,
  alias: [],
};

const isTypingReason = (reason: string) =>
  reason === 'input-change' || reason === 'input-clear';

export function RaidSignupFilterSelectComponent<T extends NamedFilterOption>({
  id,
  value,
  items,
  isPending = false,
  isError = false,
  placeholder,
  emptyMessage,
  loadingMessage,
  errorMessage,
  itemLabel = (item) => item.name,
  onValueChange,
}: RaidSignupFilterSelectComponentProps<T>) {
  const options = (isError ? [] : [EMPTY_OPTION, ...items]) as Array<
    T | typeof EMPTY_OPTION
  >;
  const labelOf = (item: NamedFilterOption) =>
    item.id === '' ? EMPTY_FILTER_LABEL : itemLabel(item as T);
  const selected =
    options.find((item) => item.id === (value ?? '')) ?? options[0] ?? null;
  const [inputValue, setInputValue] = useState(() =>
    namedFilterInputLabel(value, items, (item) => itemLabel(item as T)),
  );
  const inputValueRef = useRef(inputValue);
  const isFocusedRef = useRef(false);
  const skipBlurCommitRef = useRef(false);
  inputValueRef.current = inputValue;

  useEffect(() => {
    if (isFocusedRef.current) {
      return;
    }
    setInputValue(
      namedFilterInputLabel(value, items, (item) => itemLabel(item as T)),
    );
  }, [itemLabel, items, value]);

  let resolvedEmptyMessage = emptyMessage;
  if (isError) {
    resolvedEmptyMessage = errorMessage;
  } else if (isPending) {
    resolvedEmptyMessage = loadingMessage;
  }

  const selectedLabel = () =>
    namedFilterInputLabel(value, items, (item) => itemLabel(item as T));

  const commitSelection = (next: NamedFilterOption | null) => {
    if (!next || next.id === '') {
      onValueChange(undefined);
      return;
    }
    onValueChange(next.id);
  };

  const commitInput = () => {
    const resolved = resolveNamedFilterInput(
      inputValueRef.current,
      items,
      (item) => itemLabel(item as T),
    );
    if (resolved.action === 'select') {
      onValueChange(resolved.id);
      return;
    }
    if (resolved.action === 'clear') {
      onValueChange(undefined);
      return;
    }
    setInputValue(selectedLabel());
  };

  return (
    <Combobox
      items={options}
      value={selected}
      inputValue={inputValue}
      disabled={isPending}
      itemToStringLabel={labelOf}
      itemToStringValue={(item) => item.id}
      isItemEqualToValue={(item, current) => item.id === current?.id}
      filter={(item, query) =>
        matchesNamedFilterQuery(item, query, labelOf(item))
      }
      onInputValueChange={setInputValue}
      onValueChange={(next, details) => {
        if (isTypingReason(details.reason) || details.reason === 'escape-key') {
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
        disabled={isPending}
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
        <ComboboxEmpty>{resolvedEmptyMessage}</ComboboxEmpty>
        <ComboboxList>
          {(item) => (
            <ComboboxItem key={item.id || 'empty'} value={item}>
              {labelOf(item)}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
