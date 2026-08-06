import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_authenticated/idioms/')({
  component: IdiomsComponent,
});

function IdiomsComponent() {
  return (
    <section className="flex max-w-2xl flex-col gap-3 animate-in duration-500 fade-in slide-in-from-bottom-2">
      <p className="text-xs tracking-[0.18em] text-muted-foreground uppercase">
        成语管理
      </p>
      <h1 className="font-heading text-3xl font-medium tracking-tight">
        成语管理
      </h1>
      <p className="text-sm text-muted-foreground">
        成语管理页占位，后续接入数据。
      </p>
    </section>
  );
}
