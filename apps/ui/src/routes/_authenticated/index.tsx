import { createFileRoute } from '@tanstack/react-router';
import RaidCalendarComponent from './-components/RaidCalendarComponent';

export const Route = createFileRoute('/_authenticated/')({
  component: HomeComponent,
});

function HomeComponent() {
  return (
    <section className="flex flex-col gap-6 animate-in duration-500 fade-in slide-in-from-bottom-2">
      <h1 className="font-heading text-3xl font-medium tracking-tight text-foreground">
        概览
      </h1>
      <RaidCalendarComponent />
    </section>
  );
}
