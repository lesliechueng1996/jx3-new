import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_authenticated/')({
  component: HomeComponent,
});

function HomeComponent() {
  return (
    <section className="flex max-w-2xl flex-col gap-3 animate-in duration-500 fade-in slide-in-from-bottom-2">
      <h1 className="font-heading text-3xl font-medium tracking-tight text-foreground">
        欢迎回来
      </h1>
    </section>
  );
}
