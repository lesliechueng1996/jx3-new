import { createFileRoute, Link } from '@tanstack/react-router';
import { ArrowRightIcon, ShieldOffIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const Route = createFileRoute('/forbidden/')({
  component: ForbiddenComponent,
});

function ForbiddenComponent() {
  return (
    <div className="relative isolate flex min-h-svh items-center justify-center overflow-hidden bg-[oklch(0.13_0.018_265)] px-4 py-16 text-white">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_120%_80%_at_50%_120%,oklch(0.22_0.04_265),transparent_55%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute top-[12%] left-1/2 size-[min(90vw,560px)] -translate-x-1/2 rounded-full bg-[oklch(0.48_0.15_28)] opacity-[0.11] blur-[130px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute right-0 bottom-0 size-80 translate-x-1/4 translate-y-1/4 rounded-full bg-[oklch(0.35_0.06_265)] opacity-30 blur-[100px]"
      />

      <div className="relative flex w-full max-w-md flex-col items-center gap-10 animate-in duration-700 fade-in slide-in-from-bottom-3">
        <div className="flex flex-col items-center gap-4">
          <div
            aria-hidden
            className="size-2 rotate-45 border border-[oklch(0.58_0.17_28)] bg-[oklch(0.58_0.17_28/0.15)]"
          />
          <p className="font-heading text-sm font-light tracking-[0.32em] text-white/55">
            JX3
          </p>
        </div>

        <div className="relative w-full overflow-hidden rounded-2xl border border-white/[0.07] bg-white/2.5 px-8 pt-10 pb-8 shadow-[0_32px_64px_-24px_rgba(0,0,0,0.75)] backdrop-blur-2xl">
          <div
            aria-hidden
            className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-[oklch(0.58_0.17_28/0.55)] to-transparent"
          />

          <div className="mb-8 flex flex-col items-center gap-5 text-center">
            <div
              aria-hidden
              className="flex size-12 items-center justify-center rounded-xl border border-white/10 bg-white/4 text-[oklch(0.72_0.12_28)]"
            >
              <ShieldOffIcon className="size-5" strokeWidth={1.5} />
            </div>

            <div className="flex flex-col gap-2">
              <p
                aria-hidden
                className="font-heading text-[4.5rem] leading-none font-light tracking-[-0.04em] text-white/90"
              >
                403
              </p>
              <h1 className="text-lg font-medium tracking-wide text-white/90">
                无权访问
              </h1>
              <p className="mx-auto max-w-xs text-sm leading-relaxed text-white/45">
                当前账号没有访问此页面的权限。请更换有权限的账号登录，或返回首页继续浏览。
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Button
              size="lg"
              render={<Link to="/login" />}
              className="h-11 w-full rounded-xl border-0 text-[15px] font-medium tracking-wide bg-[oklch(0.58_0.17_28)] text-white shadow-[0_8px_32px_-8px_oklch(0.58_0.17_28/0.7)] hover:bg-[oklch(0.54_0.17_28)] active:scale-[0.99]"
            >
              前往登录
              <ArrowRightIcon data-icon="inline-end" />
            </Button>
            <Button
              size="lg"
              variant="ghost"
              render={<Link to="/" />}
              className="h-11 w-full rounded-xl text-[15px] font-medium tracking-wide text-white/55 hover:bg-white/5 hover:text-white/85"
            >
              返回首页
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
