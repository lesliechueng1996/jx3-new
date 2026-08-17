import { describe, expect, it } from 'vitest';
import {
  isNavItemActive,
  isNavPathActive,
  navItems,
} from '@/routes/_authenticated/-lib/nav-items';

describe('nav-items', () => {
  it('normalizes trailing slashes when matching paths', () => {
    expect(isNavPathActive('/admin/idioms/', '/admin/idioms')).toBe(true);
    expect(isNavPathActive('/', '/')).toBe(true);
    expect(isNavPathActive('/login', '/')).toBe(false);
  });

  it('treats a branch as active when a child matches', () => {
    const games = navItems.find((item) => item.title === '游戏辅助');
    if (!games) {
      throw new Error('missing 游戏辅助 nav item');
    }
    expect(isNavItemActive('/game-assist/guess-idiom', games)).toBe(true);
    expect(isNavItemActive('/admin/idioms', games)).toBe(false);
  });

  it('matches a leaf item by its own path', () => {
    const home = navItems.find((item) => item.to === '/');
    if (!home) {
      throw new Error('missing home nav item');
    }
    expect(isNavItemActive('/', home)).toBe(true);
    expect(isNavItemActive('/admin/idioms', home)).toBe(false);
  });

  it('returns false when a leaf has no path', () => {
    expect(isNavItemActive('/', { title: '空', icon: navItems[0].icon })).toBe(
      false,
    );
  });
});
