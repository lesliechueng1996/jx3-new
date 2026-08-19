import { useState } from 'react';
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import type { SchoolType } from '@/lib/api/admin/admin-schools-api';
import {
  type SchoolFormValues,
  schoolFormSchema,
} from '../-lib/schools-form-schema';

export type SchoolFormFields = {
  name: string;
  type: SchoolType;
  icon: string;
  aliasText: string;
};

type FieldErrors = Partial<Record<keyof SchoolFormFields, string>>;

type SchoolFormComponentProps = {
  formId: string;
  initialValues: SchoolFormFields;
  pending?: boolean;
  onSubmit: (values: SchoolFormValues) => void;
};

const emptyErrors = (): FieldErrors => ({});

export function SchoolFormComponent({
  formId,
  initialValues,
  pending = false,
  onSubmit,
}: SchoolFormComponentProps) {
  const [values, setValues] = useState<SchoolFormFields>(initialValues);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>(emptyErrors);

  const nameId = `${formId}-name`;
  const iconId = `${formId}-icon`;
  const aliasId = `${formId}-alias`;

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const result = schoolFormSchema.safeParse(values);
    if (!result.success) {
      const nextErrors: FieldErrors = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0];
        if (
          key === 'name' ||
          key === 'type' ||
          key === 'icon' ||
          key === 'aliasText'
        ) {
          nextErrors[key] = issue.message;
        }
      }
      setFieldErrors(nextErrors);
      return;
    }

    setFieldErrors(emptyErrors());
    onSubmit(result.data);
  };

  return (
    <form
      id={formId}
      className="flex flex-col gap-4"
      noValidate
      onSubmit={handleSubmit}
    >
      <FieldGroup>
        <Field data-invalid={Boolean(fieldErrors.name) || undefined}>
          <FieldLabel htmlFor={nameId}>名称</FieldLabel>
          <Input
            id={nameId}
            name="name"
            value={values.name}
            placeholder="例如：纯阳"
            aria-invalid={Boolean(fieldErrors.name)}
            disabled={pending}
            onChange={(event) =>
              setValues((current) => ({ ...current, name: event.target.value }))
            }
          />
          {fieldErrors.name ? (
            <FieldError>{fieldErrors.name}</FieldError>
          ) : null}
        </Field>

        <Field
          data-invalid={Boolean(fieldErrors.type) || undefined}
          data-disabled={pending || undefined}
        >
          <FieldLabel>类型</FieldLabel>
          <ToggleGroup
            variant="outline"
            spacing={0}
            value={[values.type]}
            disabled={pending}
            onValueChange={(value) => {
              const nextType = value[0];
              if (nextType === 'school' || nextType === 'genre') {
                setValues((current) => ({ ...current, type: nextType }));
              }
            }}
          >
            <ToggleGroupItem value="school" disabled={pending}>
              门派
            </ToggleGroupItem>
            <ToggleGroupItem value="genre" disabled={pending}>
              流派
            </ToggleGroupItem>
          </ToggleGroup>
          {fieldErrors.type ? (
            <FieldError>{fieldErrors.type}</FieldError>
          ) : null}
        </Field>

        <Field data-invalid={Boolean(fieldErrors.icon) || undefined}>
          <FieldLabel htmlFor={iconId}>图标</FieldLabel>
          <Input
            id={iconId}
            name="icon"
            value={values.icon}
            placeholder="可选，图标 URL"
            aria-invalid={Boolean(fieldErrors.icon)}
            disabled={pending}
            onChange={(event) =>
              setValues((current) => ({ ...current, icon: event.target.value }))
            }
          />
          {fieldErrors.icon ? (
            <FieldError>{fieldErrors.icon}</FieldError>
          ) : null}
        </Field>

        <Field data-invalid={Boolean(fieldErrors.aliasText) || undefined}>
          <FieldLabel htmlFor={aliasId}>别名</FieldLabel>
          <Input
            id={aliasId}
            name="aliasText"
            value={values.aliasText}
            placeholder="多个别名用逗号分隔"
            aria-invalid={Boolean(fieldErrors.aliasText)}
            disabled={pending}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                aliasText: event.target.value,
              }))
            }
          />
          {fieldErrors.aliasText ? (
            <FieldError>{fieldErrors.aliasText}</FieldError>
          ) : null}
        </Field>
      </FieldGroup>
    </form>
  );
}
