import { describe, expect, it } from 'vitest';
import {
  APP_DOCUMENT_TITLE,
  getActiveNavTitle,
  getDocumentTitle,
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

  it('resolves the active leaf title from the pathname', () => {
    expect(getActiveNavTitle('/')).toBe('概览');
    expect(getActiveNavTitle('/raid-run/')).toBe('开团');
    expect(getActiveNavTitle('/game-assist/guess-idiom')).toBe('猜成语');
    expect(getActiveNavTitle('/game-assist/minesweeper')).toBe('扫雷');
    expect(getActiveNavTitle('/admin/idioms')).toBe('成语管理');
    expect(getActiveNavTitle('/admin/raid-runs')).toBe('开团管理');
    expect(getActiveNavTitle('/admin/raid-signups')).toBe('报名管理');
    expect(getActiveNavTitle('/login')).toBeUndefined();
  });

  it('builds the document title from the active nav item', () => {
    expect(getDocumentTitle('/raid-run')).toBe(`开团 · ${APP_DOCUMENT_TITLE}`);
    expect(getDocumentTitle('/unknown')).toBe(APP_DOCUMENT_TITLE);
  });
});
