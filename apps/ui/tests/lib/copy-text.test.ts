import { afterEach, describe, expect, it, vi } from 'vitest';
import { copyText } from '@/lib/copy-text';

const originalExecCommand = document.execCommand;

afterEach(() => {
  document.execCommand = originalExecCommand;
  Object.defineProperty(window, 'isSecureContext', {
    configurable: true,
    value: true,
  });
});

describe('copyText', () => {
  it('copies with the clipboard API in a secure context', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(window, 'isSecureContext', {
      configurable: true,
      value: true,
    });
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });

    await expect(copyText('·')).resolves.toBe(true);
    expect(writeText).toHaveBeenCalledWith('·');
  });

  it('falls back when the clipboard API rejects', async () => {
    Object.defineProperty(window, 'isSecureContext', {
      configurable: true,
      value: true,
    });
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: vi.fn().mockRejectedValue(new Error('denied')) },
    });
    document.execCommand = vi.fn(() => true);

    await expect(copyText('·')).resolves.toBe(true);
    expect(document.execCommand).toHaveBeenCalledWith('copy');
  });

  it('falls back when the page is not a secure context', async () => {
    Object.defineProperty(window, 'isSecureContext', {
      configurable: true,
      value: false,
    });
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: vi.fn() },
    });
    document.execCommand = vi.fn(() => true);

    await expect(copyText('·')).resolves.toBe(true);
    expect(navigator.clipboard.writeText).not.toHaveBeenCalled();
  });

  it('returns false when the fallback copy throws', async () => {
    Object.defineProperty(window, 'isSecureContext', {
      configurable: true,
      value: false,
    });
    document.execCommand = vi.fn(() => {
      throw new Error('copy fail');
    });

    await expect(copyText('·')).resolves.toBe(false);
  });

  it('returns false when the fallback copy is rejected', async () => {
    Object.defineProperty(window, 'isSecureContext', {
      configurable: true,
      value: false,
    });
    document.execCommand = vi.fn(() => false);

    await expect(copyText('·')).resolves.toBe(false);
  });
});
