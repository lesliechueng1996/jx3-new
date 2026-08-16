import { type ReactNode, useEffect, useState } from 'react';
import Aurora from '@/components/react-bits/Aurora';
import BlurText from '@/components/react-bits/BlurText';
import CountUp from '@/components/react-bits/CountUp';
import { cn } from '@/lib/utils';

export type BrandedStageMood = 'login' | 'forbidden' | 'error' | 'not-found';

const AURORA_BY_MOOD: Record<
  BrandedStageMood,
  {
    colorStops: string[];
    amplitude: number;
    blend: number;
    speed: number;
    className: string;
  }
> = {
  login: {
    colorStops: ['#3A3D52', '#C46A45', '#7A3A28'],
    amplitude: 0.9,
    blend: 0.55,
    speed: 0.55,
    className: 'opacity-70',
  },
  forbidden: {
    colorStops: ['#2A2D42', '#8B4A38', '#5C2E24'],
    amplitude: 0.65,
    blend: 0.45,
    speed: 0.32,
    className: 'opacity-45',
  },
  error: {
    colorStops: ['#2A2C3A', '#A05040', '#6B3228'],
    amplitude: 0.5,
    blend: 0.4,
    speed: 0.22,
    className: 'opacity-40',
  },
  'not-found': {
    colorStops: ['#2E3148', '#A05A42', '#6A3A2C'],
    amplitude: 0.7,
    blend: 0.5,
    speed: 0.38,
    className: 'opacity-50',
  },
};

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  return reduced;
}

type BrandedStageComponentProps = {
  mood: BrandedStageMood;
  children: ReactNode;
  contentClassName?: string;
};

export function BrandedStageComponent({
  mood,
  children,
  contentClassName,
}: BrandedStageComponentProps) {
  const reduceMotion = usePrefersReducedMotion();
  const aurora = AURORA_BY_MOOD[mood];

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
      {reduceMotion ? null : (
        <div
          aria-hidden
          className={cn(
            'pointer-events-none absolute inset-0',
            aurora.className,
          )}
        >
          <Aurora
            colorStops={aurora.colorStops}
            amplitude={aurora.amplitude}
            blend={aurora.blend}
            speed={aurora.speed}
          />
        </div>
      )}
      <div
        className={cn(
          'relative flex w-full flex-col items-center animate-in duration-700 fade-in slide-in-from-bottom-3',
          contentClassName,
        )}
      >
        {children}
      </div>
    </div>
  );
}

export function BrandedMarkComponent() {
  return (
    <div
      aria-hidden
      className="size-2 rotate-45 border border-[oklch(0.58_0.17_28)] bg-[oklch(0.58_0.17_28/0.15)]"
    />
  );
}

export function BrandedGlassCardComponent({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'relative w-full overflow-hidden rounded-2xl border border-white/[0.07] bg-white/2.5 shadow-[0_32px_64px_-24px_rgba(0,0,0,0.75)] backdrop-blur-2xl',
        className,
      )}
    >
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-[oklch(0.58_0.17_28/0.55)] to-transparent"
      />
      {children}
    </div>
  );
}

export function BrandedBlurTextComponent({
  text,
  className,
  animateBy = 'letters',
  delay = 70,
}: {
  text: string;
  className?: string;
  animateBy?: 'words' | 'letters';
  delay?: number;
}) {
  const reduceMotion = usePrefersReducedMotion();

  if (reduceMotion) {
    return <span className={className}>{text}</span>;
  }

  return (
    <BlurText
      text={text}
      className={className}
      animateBy={animateBy}
      delay={delay}
      direction="bottom"
      stepDuration={0.28}
    />
  );
}

export function BrandedCountUpComponent({
  to,
  className,
  duration = 1.15,
}: {
  to: number;
  className?: string;
  duration?: number;
}) {
  const reduceMotion = usePrefersReducedMotion();

  if (reduceMotion) {
    return <span className={className}>{to}</span>;
  }

  return <CountUp to={to} className={className} duration={duration} />;
}
