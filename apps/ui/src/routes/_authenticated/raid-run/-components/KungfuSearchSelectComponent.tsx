import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from '@/components/ui/combobox';
import { Field, FieldLabel } from '@/components/ui/field';
import { kungfusAllQueryKey, listAllKungfus } from '@/lib/api/kungfus-api';
import {
  type KungfuSelectOption,
  kungfuInputLabel,
  matchesKungfuQuery,
  resolveKungfuInput,
} from '../-lib/kungfu-select';
import type { RaidSignupKungfuSelection } from '../-lib/raid-signup';

const EMPTY_KUNGFUS: KungfuSelectOption[] = [];

type KungfuSearchSelectComponentProps = {
  id?: string;
  value?: string;
  disabled?: boolean;
  placeholder?: string;
  onValueChange: (kungfu: RaidSignupKungfuSelection | undefined) => void;
};

const isTypingReason = (reason: string) =>
  reason === 'input-change' || reason === 'input-clear';

export function KungfuSearchSelectComponent({
  id,
  value,
  disabled = false,
  placeholder = '输入心法名称筛选',
  onValueChange,
}: KungfuSearchSelectComponentProps) {
  const kungfusQuery = useQuery({
    queryKey: kungfusAllQueryKey,
    queryFn: listAllKungfus,
  });
  const kungfus = kungfusQuery.data ?? EMPTY_KUNGFUS;
  const selectedKungfu = kungfus.find((kungfu) => kungfu.id === value) ?? null;
  const isDisabled = disabled || kungfusQuery.isPending;
  const [inputValue, setInputValue] = useState(() =>
    kungfuInputLabel(value, kungfus),
  );
  const inputValueRef = useRef(inputValue);
  const isFocusedRef = useRef(false);
  const skipBlurCommitRef = useRef(false);
  inputValueRef.current = inputValue;

  useEffect(() => {
    if (isFocusedRef.current) {
      return;
    }
    setInputValue(kungfuInputLabel(value, kungfus));
  }, [kungfus, value]);

  let emptyMessage = '未找到心法';
  if (kungfusQuery.isError) {
    emptyMessage = '加载心法失败';
  } else if (kungfusQuery.isPending) {
    emptyMessage = '加载中...';
  }

  const selectedLabel = () => kungfuInputLabel(value, kungfus);

  const commitSelection = (next: KungfuSelectOption | null) => {
    if (!next) {
      onValueChange(undefined);
      return;
    }
    onValueChange({
      id: next.id,
      schoolId: next.schoolId,
      kungfuType: next.kungfuType,
    });
  };

  const commitInput = () => {
    const resolved = resolveKungfuInput(inputValueRef.current, kungfus);
    if (resolved.action === 'select') {
      onValueChange({
        id: resolved.kungfu.id,
        schoolId: resolved.kungfu.schoolId,
        kungfuType: resolved.kungfu.kungfuType,
      });
      return;
    }
    if (resolved.action === 'clear') {
      onValueChange(undefined);
      return;
    }
    setInputValue(selectedLabel());
  };

  return (
    <Field>
      <FieldLabel htmlFor={id}>心法</FieldLabel>
      <Combobox
        items={kungfus}
        value={selectedKungfu}
        inputValue={inputValue}
        disabled={isDisabled}
        itemToStringLabel={(kungfu) => kungfu.name}
        itemToStringValue={(kungfu) => kungfu.id}
        isItemEqualToValue={(item, selected) => item.id === selected?.id}
        filter={(kungfu, query) => matchesKungfuQuery(kungfu, query)}
        onInputValueChange={setInputValue}
        onValueChange={(next, details) => {
          if (
            isTypingReason(details.reason) ||
            details.reason === 'escape-key'
          ) {
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
          disabled={isDisabled}
          aria-label="心法"
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
            {(kungfu) => (
              <ComboboxItem key={kungfu.id} value={kungfu}>
                <span className="flex min-w-0 items-center gap-2">
                  {kungfu.icon ? (
                    <img
                      src={kungfu.icon}
                      alt=""
                      className="size-5 rounded-sm object-contain"
                    />
                  ) : null}
                  <span className="truncate">{kungfu.name}</span>
                  <span className="text-muted-foreground">
                    {kungfu.schoolName}
                  </span>
                </span>
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </Field>
  );
}
