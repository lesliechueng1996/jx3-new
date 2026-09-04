import { useState } from 'react';
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DEFAULT_QUICK_CREATE_ITEM_QUALITY,
  DEFAULT_QUICK_CREATE_ITEM_TYPE,
  ITEM_QUALITY_OPTIONS,
  ITEM_TYPE_OPTIONS,
  type ItemQuality,
  type ItemType,
  isItemQuality,
  isItemType,
} from '@/lib/game-item-labels';
import { CopyMiddleDotHintComponent } from './CopyMiddleDotHintComponent';

export type GameItemQuickCreateValues = {
  name: string;
  type: ItemType;
  quality: ItemQuality;
};

type GameItemQuickCreateFormComponentProps = {
  formId: string;
  pending?: boolean;
  initialName?: string;
  initialType?: ItemType;
  initialQuality?: ItemQuality;
  onSubmit: (values: GameItemQuickCreateValues) => void;
  onValuesChange?: (values: GameItemQuickCreateValues) => void;
  showCopyHint?: boolean;
};

export function GameItemQuickCreateFormComponent({
  formId,
  pending = false,
  initialName = '',
  initialType = DEFAULT_QUICK_CREATE_ITEM_TYPE,
  initialQuality = DEFAULT_QUICK_CREATE_ITEM_QUALITY,
  onSubmit,
  onValuesChange,
  showCopyHint = true,
}: GameItemQuickCreateFormComponentProps) {
  const [name, setName] = useState(initialName);
  const [type, setType] = useState<ItemType>(initialType);
  const [quality, setQuality] = useState<ItemQuality>(initialQuality);
  const [nameError, setNameError] = useState<string>();

  const nameId = `${formId}-name`;
  const typeId = `${formId}-type`;
  const qualityId = `${formId}-quality`;

  const emitChange = (next: GameItemQuickCreateValues) => {
    onValuesChange?.(next);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setNameError('请填写物品名称');
      return;
    }

    setNameError(undefined);
    onSubmit({ name: trimmed, type, quality });
  };

  return (
    <form
      id={formId}
      className="flex flex-col gap-4"
      noValidate
      onSubmit={handleSubmit}
    >
      <FieldGroup>
        <Field
          data-invalid={Boolean(nameError) || undefined}
          data-disabled={pending || undefined}
        >
          <FieldLabel htmlFor={nameId}>物品名称</FieldLabel>
          <Input
            id={nameId}
            autoComplete="off"
            value={name}
            disabled={pending}
            aria-invalid={Boolean(nameError) || undefined}
            onChange={(event) => {
              const nextName = event.target.value;
              setName(nextName);
              setNameError(undefined);
              emitChange({ name: nextName, type, quality });
            }}
          />
          {nameError ? <FieldError>{nameError}</FieldError> : null}
        </Field>
        <FieldGroup className="grid grid-cols-2 gap-4">
          <Field data-disabled={pending || undefined}>
            <FieldLabel htmlFor={typeId}>类型</FieldLabel>
            <Select
              items={[...ITEM_TYPE_OPTIONS]}
              value={type}
              disabled={pending}
              onValueChange={(next) => {
                if (!isItemType(next)) {
                  return;
                }
                setType(next);
                emitChange({ name, type: next, quality });
              }}
            >
              <SelectTrigger id={typeId} className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent alignItemWithTrigger={false}>
                <SelectGroup>
                  {ITEM_TYPE_OPTIONS.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>
          <Field data-disabled={pending || undefined}>
            <FieldLabel htmlFor={qualityId}>品质</FieldLabel>
            <Select
              items={[...ITEM_QUALITY_OPTIONS]}
              value={quality}
              disabled={pending}
              onValueChange={(next) => {
                if (!isItemQuality(next)) {
                  return;
                }
                setQuality(next);
                emitChange({ name, type, quality: next });
              }}
            >
              <SelectTrigger id={qualityId} className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent alignItemWithTrigger={false}>
                <SelectGroup>
                  {ITEM_QUALITY_OPTIONS.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>
        </FieldGroup>
      </FieldGroup>
      {showCopyHint ? <CopyMiddleDotHintComponent /> : null}
    </form>
  );
}
