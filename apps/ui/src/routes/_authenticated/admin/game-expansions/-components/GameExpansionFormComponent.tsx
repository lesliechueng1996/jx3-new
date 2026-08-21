import { useState } from 'react';
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  type ExpansionFormValues,
  expansionFormSchema,
} from '../-lib/game-expansions-form-schema';

export type ExpansionFormFields = {
  name: string;
  level: string;
  description: string;
  startDate: string;
  endDate: string;
};

type FieldErrors = Partial<Record<keyof ExpansionFormFields, string>>;

type GameExpansionFormComponentProps = {
  formId: string;
  initialValues: ExpansionFormFields;
  pending?: boolean;
  onSubmit: (values: ExpansionFormValues) => void;
};

const emptyErrors = (): FieldErrors => ({});

export function GameExpansionFormComponent({
  formId,
  initialValues,
  pending = false,
  onSubmit,
}: GameExpansionFormComponentProps) {
  const [values, setValues] = useState<ExpansionFormFields>(initialValues);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>(emptyErrors);

  const nameId = `${formId}-name`;
  const levelId = `${formId}-level`;
  const descriptionId = `${formId}-description`;
  const startDateId = `${formId}-start-date`;
  const endDateId = `${formId}-end-date`;

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const result = expansionFormSchema.safeParse(values);
    if (!result.success) {
      const nextErrors: FieldErrors = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0];
        if (
          key === 'name' ||
          key === 'level' ||
          key === 'description' ||
          key === 'startDate' ||
          key === 'endDate'
        ) {
          nextErrors[key] ??= issue.message;
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
            placeholder="例如：江湖"
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

        <Field data-invalid={Boolean(fieldErrors.level) || undefined}>
          <FieldLabel htmlFor={levelId}>等级</FieldLabel>
          <Input
            id={levelId}
            name="level"
            type="number"
            min={1}
            max={200}
            value={values.level}
            aria-invalid={Boolean(fieldErrors.level)}
            disabled={pending}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                level: event.target.value,
              }))
            }
          />
          {fieldErrors.level ? (
            <FieldError>{fieldErrors.level}</FieldError>
          ) : null}
        </Field>

        <Field data-invalid={Boolean(fieldErrors.description) || undefined}>
          <FieldLabel htmlFor={descriptionId}>描述</FieldLabel>
          <Textarea
            id={descriptionId}
            name="description"
            value={values.description}
            placeholder="可选"
            aria-invalid={Boolean(fieldErrors.description)}
            disabled={pending}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                description: event.target.value,
              }))
            }
          />
          {fieldErrors.description ? (
            <FieldError>{fieldErrors.description}</FieldError>
          ) : null}
        </Field>

        <Field data-invalid={Boolean(fieldErrors.startDate) || undefined}>
          <FieldLabel htmlFor={startDateId}>起始日期</FieldLabel>
          <Input
            id={startDateId}
            name="startDate"
            type="date"
            value={values.startDate}
            aria-invalid={Boolean(fieldErrors.startDate)}
            disabled={pending}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                startDate: event.target.value,
              }))
            }
          />
          {fieldErrors.startDate ? (
            <FieldError>{fieldErrors.startDate}</FieldError>
          ) : null}
        </Field>

        <Field data-invalid={Boolean(fieldErrors.endDate) || undefined}>
          <FieldLabel htmlFor={endDateId}>终止日期</FieldLabel>
          <Input
            id={endDateId}
            name="endDate"
            type="date"
            value={values.endDate}
            aria-invalid={Boolean(fieldErrors.endDate)}
            disabled={pending}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                endDate: event.target.value,
              }))
            }
          />
          {fieldErrors.endDate ? (
            <FieldError>{fieldErrors.endDate}</FieldError>
          ) : null}
        </Field>
      </FieldGroup>
    </form>
  );
}
