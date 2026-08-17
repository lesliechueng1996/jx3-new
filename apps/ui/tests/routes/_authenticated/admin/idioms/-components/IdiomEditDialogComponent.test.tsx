import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { AdminIdiomDetail } from '@/lib/api/admin/admin-idioms-api';
import { IdiomEditDialogComponent } from '@/routes/_authenticated/admin/idioms/-components/IdiomEditDialogComponent';

const idiom: AdminIdiomDetail = {
  id: '1',
  text: '一心一意',
  pinyin: 'yi1 xin1 yi1 yi4',
  tonePattern: '1114',
  meaning: '专心',
  charCount: 4,
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
  chars: [
    {
      id: 'c1',
      idiomId: '1',
      position: 0,
      char: '一',
      pinyin: 'yi1',
      initial: '',
      final: 'i',
      tone: 1,
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    },
  ],
};

describe('IdiomEditDialogComponent', () => {
  it('saves trimmed fields and updated chars', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const onOpenChange = vi.fn();

    render(
      <IdiomEditDialogComponent
        idiom={idiom}
        open
        pending={false}
        onOpenChange={onOpenChange}
        onSubmit={onSubmit}
      />,
    );

    await user.clear(screen.getByLabelText('成语'));
    await user.type(screen.getByLabelText('成语'), ' 三心二意 ');
    await user.clear(screen.getByLabelText('释义'));
    await user.click(screen.getByRole('button', { name: '保存' }));
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        text: '三心二意',
        meaning: null,
      }),
    );

    await user.click(screen.getByRole('button', { name: '取消' }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('updates a character field', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <IdiomEditDialogComponent
        idiom={{ ...idiom, meaning: null }}
        open
        pending={false}
        onOpenChange={vi.fn()}
        onSubmit={onSubmit}
      />,
    );

    const charInput = screen.getByDisplayValue('一');
    await user.clear(charInput);
    await user.type(charInput, '壹');
    await user.click(screen.getByRole('button', { name: '保存' }));
    expect(onSubmit.mock.calls[0][0].chars[0].char).toBe('壹');
  });

  it('updates remaining character fields', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <IdiomEditDialogComponent
        idiom={idiom}
        open
        pending={false}
        onOpenChange={vi.fn()}
        onSubmit={onSubmit}
      />,
    );

    await user.clear(screen.getByLabelText('拼音'));
    await user.type(screen.getByLabelText('拼音'), 'yi1');
    await user.clear(screen.getByLabelText('声调模式'));
    await user.type(screen.getByLabelText('声调模式'), '1114');

    const pinyinInputs = screen.getAllByDisplayValue('yi1');
    await user.clear(pinyinInputs[1]);
    await user.type(pinyinInputs[1], 'er4');

    const finalInput = screen.getByDisplayValue('i');
    await user.clear(finalInput);
    await user.type(finalInput, 'an');

    const toneInput = screen.getByRole('spinbutton');
    await user.clear(toneInput);
    await user.type(toneInput, '3');

    await user.click(screen.getByRole('button', { name: '保存' }));
    expect(onSubmit.mock.calls[0][0].chars[0]).toEqual(
      expect.objectContaining({
        pinyin: 'er4',
        final: 'an',
        tone: 3,
      }),
    );
  });
});
