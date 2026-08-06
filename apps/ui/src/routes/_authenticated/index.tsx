import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_authenticated/')({
  component: HomeComponent,
});

function HomeComponent() {
  return (
    <section className="flex max-w-2xl flex-col gap-3 animate-in duration-500 fade-in slide-in-from-bottom-2">
      <p className="text-xs tracking-[0.18em] text-muted-foreground uppercase">
        概览
      </p>
      <h1 className="font-heading text-3xl font-medium tracking-tight text-foreground">
        欢迎回来
      </h1>
      <p className="text-sm leading-relaxed text-muted-foreground">
        从左侧菜单进入成语管理与游戏辅助。当前页会在菜单中高亮，含子菜单的项目可展开查看。
      </p>
    </section>
  );
}
