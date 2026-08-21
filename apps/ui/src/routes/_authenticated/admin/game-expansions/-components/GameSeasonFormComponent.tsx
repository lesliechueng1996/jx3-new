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
  type SeasonFormValues,
  seasonFormSchema,
} from '../-lib/game-seasons-form-schema';

export type SeasonFormFields = {
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  sortOrder: string;
};

type FieldErrors = Partial<Record<keyof SeasonFormFields, string>>;

type GameSeasonFormComponentProps = {
  formId: string;
  initialValues: SeasonFormFields;
  pending?: boolean;
  onSubmit: (values: SeasonFormValues) => void;
};

const emptyErrors = (): FieldErrors => ({});

export function GameSeasonFormComponent({
  formId,
  initialValues,
  pending = false,
  onSubmit,
}: GameSeasonFormComponentProps) {
  const [values, setValues] = useState<SeasonFormFields>(initialValues);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>(emptyErrors);

  const nameId = `${formId}-name`;
  const descriptionId = `${formId}-description`;
  const startDateId = `${formId}-start-date`;
  const endDateId = `${formId}-end-date`;
  const sortOrderId = `${formId}-sort-order`;

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const result = seasonFormSchema.safeParse(values);
    if (!result.success) {
      const nextErrors: FieldErrors = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0];
        if (
          key === 'name' ||
          key === 'description' ||
          key === 'startDate' ||
          key === 'endDate' ||
          key === 'sortOrder'
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
            placeholder="例如：S1"
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

        <Field data-invalid={Boolean(fieldErrors.sortOrder) || undefined}>
          <FieldLabel htmlFor={sortOrderId}>排序</FieldLabel>
          <Input
            id={sortOrderId}
            name="sortOrder"
            type="number"
            value={values.sortOrder}
            aria-invalid={Boolean(fieldErrors.sortOrder)}
            disabled={pending}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                sortOrder: event.target.value,
              }))
            }
          />
          {fieldErrors.sortOrder ? (
            <FieldError>{fieldErrors.sortOrder}</FieldError>
          ) : null}
        </Field>
      </FieldGroup>
    </form>
  );
}
