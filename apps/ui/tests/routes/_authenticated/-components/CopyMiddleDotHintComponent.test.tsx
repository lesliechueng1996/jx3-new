import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { toast } from '@/components/ui/toast';
import { copyText } from '@/lib/copy-text';
import {
  CopyMiddleDotHintComponent,
  ITEM_NAME_MIDDLE_DOT,
} from '@/routes/_authenticated/-components/CopyMiddleDotHintComponent';

vi.mock('@/lib/copy-text', () => ({
  copyText: vi.fn(),
}));

describe('CopyMiddleDotHintComponent', () => {
  beforeEach(() => {
    vi.mocked(copyText).mockReset();
    vi.mocked(toast.add).mockClear();
  });

  it('copies the middle dot and toasts success', async () => {
    const user = userEvent.setup();
    vi.mocked(copyText).mockResolvedValue(true);

    render(
      <form
        onSubmit={(event) => {
          event.preventDefault();
          throw new Error('form submitted');
        }}
      >
        <CopyMiddleDotHintComponent />
      </form>,
    );

    await user.click(
      screen.getByRole('button', { name: '点击 · 即可复制到剪切板' }),
    );

    expect(copyText).toHaveBeenCalledWith(ITEM_NAME_MIDDLE_DOT);
    expect(toast.add).toHaveBeenCalledWith({
      type: 'success',
      description: '已复制到剪切板',
    });
  });

  it('toasts an error when copy fails', async () => {
    const user = userEvent.setup();
    vi.mocked(copyText).mockResolvedValue(false);

    render(<CopyMiddleDotHintComponent />);
    await user.click(
      screen.getByRole('button', { name: '点击 · 即可复制到剪切板' }),
    );

    expect(toast.add).toHaveBeenCalledWith({
      type: 'error',
      description: '复制失败，请手动复制',
    });
  });
});
