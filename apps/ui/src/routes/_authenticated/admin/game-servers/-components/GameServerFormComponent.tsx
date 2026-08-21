import { useState } from 'react';
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  type GameServerFormValues,
  gameServerFormSchema,
} from '../-lib/game-servers-form-schema';

export type GameServerFormFields = {
  serverId: string;
  zone: string;
  name: string;
  aliasText: string;
};

type FieldErrors = Partial<Record<keyof GameServerFormFields, string>>;

type GameServerFormComponentProps = {
  formId: string;
  initialValues: GameServerFormFields;
  pending?: boolean;
  onSubmit: (values: GameServerFormValues) => void;
};

const emptyErrors = (): FieldErrors => ({});

export function GameServerFormComponent({
  formId,
  initialValues,
  pending = false,
  onSubmit,
}: GameServerFormComponentProps) {
  const [values, setValues] = useState<GameServerFormFields>(initialValues);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>(emptyErrors);

  const serverIdId = `${formId}-server-id`;
  const zoneId = `${formId}-zone`;
  const nameId = `${formId}-name`;
  const aliasId = `${formId}-alias`;

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const result = gameServerFormSchema.safeParse(values);
    if (!result.success) {
      const nextErrors: FieldErrors = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0];
        if (
          key === 'serverId' ||
          key === 'zone' ||
          key === 'name' ||
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
        <Field data-invalid={Boolean(fieldErrors.serverId) || undefined}>
          <FieldLabel htmlFor={serverIdId}>服务器 ID</FieldLabel>
          <Input
            id={serverIdId}
            name="serverId"
            value={values.serverId}
            placeholder="例如：mengjiangnan"
            aria-invalid={Boolean(fieldErrors.serverId)}
            disabled={pending}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                serverId: event.target.value,
              }))
            }
          />
          {fieldErrors.serverId ? (
            <FieldError>{fieldErrors.serverId}</FieldError>
          ) : null}
        </Field>

        <Field data-invalid={Boolean(fieldErrors.zone) || undefined}>
          <FieldLabel htmlFor={zoneId}>大区</FieldLabel>
          <Input
            id={zoneId}
            name="zone"
            value={values.zone}
            placeholder="例如：电信一区"
            aria-invalid={Boolean(fieldErrors.zone)}
            disabled={pending}
            onChange={(event) =>
              setValues((current) => ({ ...current, zone: event.target.value }))
            }
          />
          {fieldErrors.zone ? (
            <FieldError>{fieldErrors.zone}</FieldError>
          ) : null}
        </Field>

        <Field data-invalid={Boolean(fieldErrors.name) || undefined}>
          <FieldLabel htmlFor={nameId}>名称</FieldLabel>
          <Input
            id={nameId}
            name="name"
            value={values.name}
            placeholder="例如：梦江南"
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
