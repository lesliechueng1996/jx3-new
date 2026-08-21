import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import {
  type ProfilePasswordFormValues,
  profilePasswordFormSchema,
} from '../-lib/profile-password-schema';

type FieldErrors = Partial<Record<keyof ProfilePasswordFormValues, string>>;

type ProfilePasswordFormComponentProps = {
  formId: string;
  pending?: boolean;
  onSubmit: (values: ProfilePasswordFormValues) => void;
};

const emptyErrors = (): FieldErrors => ({});

export function ProfilePasswordFormComponent({
  formId,
  pending = false,
  onSubmit,
}: ProfilePasswordFormComponentProps) {
  const [values, setValues] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>(emptyErrors);

  const currentPasswordId = `${formId}-current-password`;
  const newPasswordId = `${formId}-new-password`;
  const confirmPasswordId = `${formId}-confirm-password`;

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const result = profilePasswordFormSchema.safeParse(values);
    if (!result.success) {
      const nextErrors: FieldErrors = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0];
        if (
          key === 'currentPassword' ||
          key === 'newPassword' ||
          key === 'confirmPassword'
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
        <Field data-invalid={Boolean(fieldErrors.currentPassword) || undefined}>
          <FieldLabel htmlFor={currentPasswordId}>当前密码</FieldLabel>
          <Input
            id={currentPasswordId}
            name="currentPassword"
            type="password"
            value={values.currentPassword}
            autoComplete="current-password"
            aria-invalid={Boolean(fieldErrors.currentPassword)}
            disabled={pending}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                currentPassword: event.target.value,
              }))
            }
          />
          {fieldErrors.currentPassword ? (
            <FieldError>{fieldErrors.currentPassword}</FieldError>
          ) : null}
        </Field>

        <Field data-invalid={Boolean(fieldErrors.newPassword) || undefined}>
          <FieldLabel htmlFor={newPasswordId}>新密码</FieldLabel>
          <Input
            id={newPasswordId}
            name="newPassword"
            type="password"
            value={values.newPassword}
            autoComplete="new-password"
            placeholder="至少 8 位"
            aria-invalid={Boolean(fieldErrors.newPassword)}
            disabled={pending}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                newPassword: event.target.value,
              }))
            }
          />
          {fieldErrors.newPassword ? (
            <FieldError>{fieldErrors.newPassword}</FieldError>
          ) : null}
        </Field>

        <Field data-invalid={Boolean(fieldErrors.confirmPassword) || undefined}>
          <FieldLabel htmlFor={confirmPasswordId}>确认新密码</FieldLabel>
          <Input
            id={confirmPasswordId}
            name="confirmPassword"
            type="password"
            value={values.confirmPassword}
            autoComplete="new-password"
            aria-invalid={Boolean(fieldErrors.confirmPassword)}
            disabled={pending}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                confirmPassword: event.target.value,
              }))
            }
          />
          {fieldErrors.confirmPassword ? (
            <FieldError>{fieldErrors.confirmPassword}</FieldError>
          ) : null}
        </Field>
      </FieldGroup>
      <Button type="submit" disabled={pending}>
        {pending ? <Spinner /> : null}
        保存密码
      </Button>
    </form>
  );
}
