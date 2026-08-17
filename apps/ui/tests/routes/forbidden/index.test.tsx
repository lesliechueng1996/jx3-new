import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderApp } from '../../helpers/render';

describe('forbidden route', () => {
  it('explains the missing permission and links away', async () => {
    await renderApp('/forbidden');
    expect(screen.getByText('无权访问')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /前往登录/ })).toHaveAttribute(
      'href',
      '/login',
    );
    expect(screen.getByRole('button', { name: '返回首页' })).toHaveAttribute(
      'href',
      '/',
    );
  });
});
