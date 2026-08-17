import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { RouteErrorComponent } from '@/components/RouteErrorComponent';
import { RouteNotFoundComponent } from '@/components/RouteNotFoundComponent';
import { Route } from '@/routes/__root';
import { renderApp } from '../helpers/render';

describe('root route', () => {
  it('registers error and not-found components', () => {
    expect(Route.options.errorComponent).toBe(RouteErrorComponent);
    expect(Route.options.notFoundComponent).toBe(RouteNotFoundComponent);
  });

  it('renders the not-found page for unknown paths', async () => {
    await renderApp('/this-path-does-not-exist');
    expect(screen.getByText('页面不存在')).toBeInTheDocument();
  });
});
