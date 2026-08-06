import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute(
  '/_authenticated/game-assist/guess-idiom/',
)({
  component: GuessIdiomComponent,
});

function GuessIdiomComponent() {
  return (
    <section className="flex max-w-2xl flex-col gap-3 animate-in duration-500 fade-in slide-in-from-bottom-2">
      <p className="text-xs tracking-[0.18em] text-muted-foreground uppercase">
        游戏辅助
      </p>
      <h1 className="font-heading text-3xl font-medium tracking-tight">
        猜成语
      </h1>
      <p className="text-sm text-muted-foreground">
        猜成语页占位，后续接入数据。
      </p>
    </section>
  );
}
