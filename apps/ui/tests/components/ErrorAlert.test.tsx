import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import ErrorAlert from '@/components/ErrorAlert';

describe('ErrorAlert', () => {
  it('renders the title and description', () => {
    render(<ErrorAlert title="错误" description="加载失败" />);
    expect(screen.getByText('错误')).toBeInTheDocument();
    expect(screen.getByText('加载失败')).toBeInTheDocument();
  });
});
