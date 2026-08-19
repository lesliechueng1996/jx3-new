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
import { listAllSchools, schoolsAllQueryKey } from '@/lib/api/schools-api';
import {
  EMPTY_SCHOOL_LABEL,
  matchesSchoolQuery,
  resolveSchoolInput,
  schoolInputLabel,
} from '@/lib/school-select';

type SchoolOption = {
  id: string;
  name: string;
  alias: string[];
};

const EMPTY_SCHOOL_OPTION: SchoolOption = {
  id: '',
  name: EMPTY_SCHOOL_LABEL,
  alias: [],
};

const EMPTY_SCHOOLS: SchoolOption[] = [];

type SchoolSelectComponentProps = {
  id?: string;
  value?: string;
  disabled?: boolean;
  placeholder?: string;
  allowEmpty?: boolean;
  'aria-invalid'?: boolean;
  onValueChange: (schoolId: string | undefined) => void;
};

const isTypingReason = (reason: string) =>
  reason === 'input-change' || reason === 'input-clear';

export function SchoolSelectComponent({
  id,
  value,
  disabled = false,
  placeholder = '请选择门派',
  allowEmpty = false,
  'aria-invalid': ariaInvalid,
  onValueChange,
}: SchoolSelectComponentProps) {
  const schoolsQuery = useQuery({
    queryKey: schoolsAllQueryKey,
    queryFn: listAllSchools,
  });
  const schools = schoolsQuery.data ?? EMPTY_SCHOOLS;
  const items = allowEmpty ? [EMPTY_SCHOOL_OPTION, ...schools] : schools;
  const selectedSchool =
    items.find((school) => school.id === (value ?? '')) ?? null;
  const isDisabled = disabled || schoolsQuery.isPending;
  const [inputValue, setInputValue] = useState(() =>
    schoolInputLabel(value, schools, allowEmpty),
  );
  const inputValueRef = useRef(inputValue);
  const isFocusedRef = useRef(false);
  const skipBlurCommitRef = useRef(false);
  inputValueRef.current = inputValue;

  useEffect(() => {
    if (isFocusedRef.current) {
      return;
    }
    setInputValue(schoolInputLabel(value, schools, allowEmpty));
  }, [allowEmpty, schools, value]);

  let emptyMessage = '未找到门派';
  if (schoolsQuery.isError) {
    emptyMessage = '加载门派失败';
  } else if (schoolsQuery.isPending) {
    emptyMessage = '加载中...';
  }

  const selectedLabel = () => schoolInputLabel(value, schools, allowEmpty);

  const commitSelection = (next: SchoolOption | null) => {
    if (!next || next.id === '') {
      onValueChange(undefined);
      return;
    }
    onValueChange(next.id);
  };

  const commitInput = () => {
    const resolved = resolveSchoolInput(
      inputValueRef.current,
      schools,
      allowEmpty,
    );
    if (resolved.action === 'select') {
      onValueChange(resolved.schoolId);
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
      items={items}
      value={selectedSchool}
      inputValue={inputValue}
      disabled={isDisabled}
      itemToStringLabel={(school) => school.name}
      itemToStringValue={(school) => school.id}
      isItemEqualToValue={(item, selected) => item.id === selected?.id}
      filter={(school, query) => matchesSchoolQuery(school, query)}
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
        disabled={isDisabled}
        aria-invalid={ariaInvalid}
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
          {(school) => (
            <ComboboxItem key={school.id} value={school}>
              {school.name}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
