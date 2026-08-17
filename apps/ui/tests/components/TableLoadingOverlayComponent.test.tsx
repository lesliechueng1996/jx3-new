import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { TableLoadingOverlayComponent } from '@/components/TableLoadingOverlayComponent';

describe('TableLoadingOverlayComponent', () => {
  it('renders nothing when not loading', () => {
    const { container } = render(
      <TableLoadingOverlayComponent loading={false} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('announces loading when active', () => {
    render(<TableLoadingOverlayComponent loading />);
    expect(screen.getByText('加载中...')).toBeInTheDocument();
  });
});
