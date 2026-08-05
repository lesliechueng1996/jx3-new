import { EyeIcon, EyeOffIcon } from 'lucide-react';
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
import { cn } from '@/lib/utils';
import {
  type AuthCredentials,
  authCredentialsSchema,
} from './auth-credentials-schema';

type FieldErrors = Partial<Record<keyof AuthCredentials, string>>;

type AuthCredentialsFormComponentProps = {
  isPending: boolean;
  serverError?: string;
  onSubmit: (credentials: AuthCredentials) => void;
};

const inputClassName = cn(
  'h-11 rounded-xl border-white/10 bg-white/[0.04] px-3.5 text-[15px] text-white shadow-none',
  'placeholder:text-white/25',
  'focus-visible:border-[oklch(0.58_0.17_28)] focus-visible:ring-[oklch(0.58_0.17_28)]/20',
  'disabled:bg-white/[0.02] disabled:opacity-60',
  'aria-invalid:border-red-400/60 aria-invalid:ring-red-400/15',
);

const labelClassName =
  'text-[11px] font-medium tracking-[0.16em] text-white/40 uppercase';

export function AuthCredentialsFormComponent({
  isPending,
  serverError,
  onSubmit,
}: AuthCredentialsFormComponentProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const result = authCredentialsSchema.safeParse({ email, password });

    if (!result.success) {
      const nextErrors: FieldErrors = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0];
        if (key === 'email' || key === 'password') {
          nextErrors[key] = issue.message;
        }
      }
      setFieldErrors(nextErrors);
      return;
    }

    setFieldErrors({});
    onSubmit(result.data);
  };

  return (
    <form className="flex w-full flex-col gap-8" onSubmit={handleSubmit}>
      <FieldGroup className="gap-5">
        <Field data-invalid={Boolean(fieldErrors.email) || undefined}>
          <FieldLabel htmlFor="email" className={labelClassName}>
            邮箱
          </FieldLabel>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="username"
            placeholder="name@example.com"
            value={email}
            aria-invalid={Boolean(fieldErrors.email)}
            disabled={isPending}
            className={inputClassName}
            onChange={(event) => setEmail(event.target.value)}
          />
          {fieldErrors.email ? (
            <FieldError className="text-red-300/90">
              {fieldErrors.email}
            </FieldError>
          ) : null}
        </Field>

        <Field data-invalid={Boolean(fieldErrors.password) || undefined}>
          <FieldLabel htmlFor="password" className={labelClassName}>
            密码
          </FieldLabel>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              aria-invalid={Boolean(fieldErrors.password)}
              disabled={isPending}
              className={cn(inputClassName, 'pr-10')}
              onChange={(event) => setPassword(event.target.value)}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="absolute top-1/2 right-1.5 -translate-y-1/2 text-white/35 hover:bg-white/5 hover:text-white/70"
              aria-label={showPassword ? '隐藏密码' : '显示密码'}
              disabled={isPending}
              onClick={() => setShowPassword((current) => !current)}
            >
              {showPassword ? <EyeOffIcon /> : <EyeIcon />}
            </Button>
          </div>
          {fieldErrors.password ? (
            <FieldError className="text-red-300/90">
              {fieldErrors.password}
            </FieldError>
          ) : null}
        </Field>

        {serverError ? (
          <Field data-invalid>
            <FieldError className="text-red-300/90">{serverError}</FieldError>
          </Field>
        ) : null}
      </FieldGroup>

      <Button
        type="submit"
        size="lg"
        disabled={isPending}
        className={cn(
          'h-11 w-full rounded-xl border-0 text-[15px] font-medium tracking-wide',
          'bg-[oklch(0.58_0.17_28)] text-white shadow-[0_8px_32px_-8px_oklch(0.58_0.17_28/0.7)]',
          'hover:bg-[oklch(0.54_0.17_28)] active:scale-[0.99]',
          'disabled:opacity-70',
        )}
      >
        {isPending ? <Spinner data-icon="inline-start" /> : null}
        {isPending ? '登录中' : '登录'}
      </Button>
    </form>
  );
}
