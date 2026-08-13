import { useMutation } from '@tanstack/react-query';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { toast } from '@/components/ui/toast';
import { authClient } from '@/lib/auth-client';
import { clearSessionQuery } from '@/lib/auth-session';
import { AuthCredentialsFormComponent } from './-components/AuthCredentialsFormComponent';
import type { AuthCredentials } from './-lib/auth-credentials-schema';
import { authSearchSchema } from './-lib/auth-search-schema';

export const Route = createFileRoute('/login/')({
  validateSearch: authSearchSchema,
  component: LoginComponent,
});

function LoginComponent() {
  const navigate = useNavigate();
  const { redirect } = Route.useSearch();

  const loginMutation = useMutation({
    mutationFn: async (credentials: AuthCredentials) => {
      const { data, error } = await authClient.signIn.email({
        email: credentials.email,
        password: credentials.password,
      });

      if (error) {
        const errorMessage =
          error.status === 401 ? '邮箱或密码错误' : error.message;
        throw new Error(errorMessage);
      }

      return data;
    },
    onSuccess: () => {
      clearSessionQuery();
      navigate({ to: redirect ?? '/' });
    },
    onError: (error: Error) => {
      toast.add({
        type: 'error',
        title: '登录失败',
        description: error.message,
        priority: 'high',
      });
    },
  });

  return (
    <div className="relative isolate flex min-h-svh items-center justify-center overflow-hidden bg-[oklch(0.13_0.018_265)] px-4 py-16 text-white">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_120%_80%_at_50%_120%,oklch(0.22_0.04_265),transparent_55%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute top-[18%] left-1/2 size-[min(90vw,520px)] -translate-x-1/2 rounded-full bg-[oklch(0.48_0.15_28)] opacity-[0.13] blur-[120px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute top-0 right-0 size-72 translate-x-1/3 -translate-y-1/3 rounded-full bg-[oklch(0.35_0.06_265)] opacity-25 blur-[90px]"
      />

      <div className="relative w-full max-w-100 animate-in duration-700 fade-in slide-in-from-bottom-3">
        <div className="mb-10 flex flex-col items-center gap-4">
          <div
            aria-hidden
            className="size-2 rotate-45 border border-[oklch(0.58_0.17_28)] bg-[oklch(0.58_0.17_28/0.15)]"
          />
          <h1 className="font-heading text-[2.75rem] font-light tracking-[0.28em] text-white/95">
            JX3
          </h1>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-white/[0.07] bg-white/2.5 p-8 shadow-[0_32px_64px_-24px_rgba(0,0,0,0.75)] backdrop-blur-2xl">
          <div
            aria-hidden
            className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-[oklch(0.58_0.17_28/0.55)] to-transparent"
          />
          <AuthCredentialsFormComponent
            isPending={loginMutation.isPending}
            onSubmit={(credentials) => loginMutation.mutate(credentials)}
          />
        </div>
      </div>
    </div>
  );
}
