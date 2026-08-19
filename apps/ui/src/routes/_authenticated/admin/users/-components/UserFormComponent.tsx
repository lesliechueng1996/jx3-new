import { useState } from 'react';
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { ROLE_ADMIN, ROLE_USER } from '@/lib/auth-client';
import {
  type CreateUserFormValues,
  createUserFormSchema,
  type EditUserFormValues,
  editUserFormSchema,
} from '../-lib/users-form-schema';

export type UserFormFields = {
  name: string;
  email: string;
  password: string;
  role: 'user' | 'admin';
};

type FieldErrors = Partial<Record<keyof UserFormFields, string>>;

type UserFormComponentProps = {
  formId: string;
  initialValues: UserFormFields;
  emailOptional?: boolean;
  passwordOptional?: boolean;
  roleDisabled?: boolean;
  pending?: boolean;
  onSubmit: (values: CreateUserFormValues | EditUserFormValues) => void;
};

const emptyErrors = (): FieldErrors => ({});

export function UserFormComponent({
  formId,
  initialValues,
  emailOptional = false,
  passwordOptional = false,
  roleDisabled = false,
  pending = false,
  onSubmit,
}: UserFormComponentProps) {
  const [values, setValues] = useState<UserFormFields>(initialValues);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>(emptyErrors);

  const nameId = `${formId}-name`;
  const emailId = `${formId}-email`;
  const passwordId = `${formId}-password`;

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const schema = emailOptional ? editUserFormSchema : createUserFormSchema;
    const result = schema.safeParse(values);

    if (!result.success) {
      const nextErrors: FieldErrors = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0];
        if (
          key === 'name' ||
          key === 'email' ||
          key === 'password' ||
          key === 'role'
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
          <FieldLabel htmlFor={nameId}>用户名</FieldLabel>
          <Input
            id={nameId}
            name="name"
            value={values.name}
            placeholder="显示名称"
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

        <Field data-invalid={Boolean(fieldErrors.email) || undefined}>
          <FieldLabel htmlFor={emailId}>邮箱</FieldLabel>
          <Input
            id={emailId}
            name="email"
            type="email"
            value={values.email}
            placeholder={emailOptional ? '不修改请留空' : 'name@example.com'}
            aria-invalid={Boolean(fieldErrors.email)}
            disabled={pending}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                email: event.target.value,
              }))
            }
          />
          {fieldErrors.email ? (
            <FieldError>{fieldErrors.email}</FieldError>
          ) : null}
        </Field>

        <Field data-invalid={Boolean(fieldErrors.password) || undefined}>
          <FieldLabel htmlFor={passwordId}>密码</FieldLabel>
          <Input
            id={passwordId}
            name="password"
            type="password"
            value={values.password}
            placeholder={passwordOptional ? '不修改请留空' : '至少 8 位'}
            aria-invalid={Boolean(fieldErrors.password)}
            disabled={pending}
            autoComplete="new-password"
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                password: event.target.value,
              }))
            }
          />
          {fieldErrors.password ? (
            <FieldError>{fieldErrors.password}</FieldError>
          ) : null}
        </Field>

        <Field
          data-invalid={Boolean(fieldErrors.role) || undefined}
          data-disabled={roleDisabled || undefined}
        >
          <FieldLabel>角色</FieldLabel>
          <ToggleGroup
            variant="outline"
            spacing={0}
            value={[values.role]}
            disabled={roleDisabled || pending}
            onValueChange={(value) => {
              const nextRole = value[0];
              if (nextRole === ROLE_USER || nextRole === ROLE_ADMIN) {
                setValues((current) => ({ ...current, role: nextRole }));
              }
            }}
          >
            <ToggleGroupItem value={ROLE_USER} disabled={roleDisabled}>
              用户
            </ToggleGroupItem>
            <ToggleGroupItem value={ROLE_ADMIN} disabled={roleDisabled}>
              管理员
            </ToggleGroupItem>
          </ToggleGroup>
          {fieldErrors.role ? (
            <FieldError>{fieldErrors.role}</FieldError>
          ) : null}
        </Field>
      </FieldGroup>
    </form>
  );
}
