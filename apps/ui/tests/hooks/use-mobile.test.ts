import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useIsMobile } from '@/hooks/use-mobile';

describe('useIsMobile', () => {
  it('tracks the mobile breakpoint', () => {
    let listener: (() => void) | undefined;
    const media = {
      matches: true,
      media: '(max-width: 767px)',
      addEventListener: vi.fn((_type: string, cb: () => void) => {
        listener = cb;
      }),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
      onchange: null,
    };

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn(() => media),
    });
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      value: 500,
    });

    const { result, unmount } = renderHook(() => useIsMobile());
    expect(result.current).toBe(true);

    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      value: 1024,
    });
    act(() => {
      listener?.();
    });
    expect(result.current).toBe(false);

    unmount();
    expect(media.removeEventListener).toHaveBeenCalled();
  });
});
