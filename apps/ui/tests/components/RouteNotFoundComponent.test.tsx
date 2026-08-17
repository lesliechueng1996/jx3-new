import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { RouteNotFoundComponent } from '@/components/RouteNotFoundComponent';

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@tanstack/react-router')>();
  return {
    ...actual,
    Link: ({
      to,
      children,
      ...props
    }: {
      to: string;
      children?: React.ReactNode;
    }) => (
      <a href={to} {...props}>
        {children}
      </a>
    ),
  };
});

describe('RouteNotFoundComponent', () => {
  it('shows the not-found copy and a home link', () => {
    render(<RouteNotFoundComponent />);
    expect(screen.getByText('页面不存在')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /返回首页/ })).toHaveAttribute(
      'href',
      '/',
    );
  });
});
