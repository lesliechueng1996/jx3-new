import { type KeyboardEvent, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ROLE_ADMIN, ROLE_USER } from '@/lib/auth-client';
import type { UsersSearch } from '../-lib/users-schema';

type UserFiltersComponentProps = {
  committedFilters: UsersSearch;
  onSearch: (filters: UsersSearch) => void;
  onReset: () => void;
};

const ROLE_FILTER_ITEMS = [
  { label: '全部', value: 'all' },
  { label: '用户', value: ROLE_USER },
  { label: '管理员', value: ROLE_ADMIN },
];

const BANNED_FILTER_ITEMS = [
  { label: '全部', value: 'all' },
  { label: '正常', value: 'false' },
  { label: '已封禁', value: 'true' },
];

const roleFilterValue = (role: UsersSearch['role']) => role ?? 'all';
const bannedFilterValue = (banned: UsersSearch['banned']) => banned ?? 'all';

export function UserFiltersComponent({
  committedFilters,
  onSearch,
  onReset,
}: UserFiltersComponentProps) {
  const [draft, setDraft] = useState<UsersSearch>(committedFilters);

  useEffect(() => {
    setDraft(committedFilters);
  }, [committedFilters]);

  const handleSearch = () => {
    onSearch({ ...draft, page: 1 });
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleSearch();
    }
  };

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border p-4">
      <FieldGroup className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Field>
          <FieldLabel htmlFor="filter-user-name">用户名</FieldLabel>
          <Input
            id="filter-user-name"
            value={draft.name ?? ''}
            placeholder="搜索用户名"
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                name: event.target.value || undefined,
              }))
            }
            onKeyDown={handleKeyDown}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="filter-user-email">邮箱</FieldLabel>
          <Input
            id="filter-user-email"
            value={draft.email ?? ''}
            placeholder="搜索邮箱"
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                email: event.target.value || undefined,
              }))
            }
            onKeyDown={handleKeyDown}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="filter-user-role">角色</FieldLabel>
          <Select
            items={ROLE_FILTER_ITEMS}
            value={roleFilterValue(draft.role)}
            onValueChange={(next) => {
              if (next === ROLE_ADMIN || next === ROLE_USER) {
                setDraft((current) => ({ ...current, role: next }));
                return;
              }
              setDraft((current) => ({ ...current, role: undefined }));
            }}
          >
            <SelectTrigger id="filter-user-role" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent alignItemWithTrigger={false}>
              <SelectGroup>
                {ROLE_FILTER_ITEMS.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>
        <Field>
          <FieldLabel htmlFor="filter-user-banned">状态</FieldLabel>
          <Select
            items={BANNED_FILTER_ITEMS}
            value={bannedFilterValue(draft.banned)}
            onValueChange={(next) => {
              if (next === 'true' || next === 'false') {
                setDraft((current) => ({ ...current, banned: next }));
                return;
              }
              setDraft((current) => ({ ...current, banned: undefined }));
            }}
          >
            <SelectTrigger id="filter-user-banned" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent alignItemWithTrigger={false}>
              <SelectGroup>
                {BANNED_FILTER_ITEMS.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>
      </FieldGroup>
      <div className="flex items-center gap-2">
        <Button type="button" onClick={handleSearch}>
          搜索
        </Button>
        <Button type="button" variant="outline" onClick={onReset}>
          重置
        </Button>
      </div>
    </div>
  );
}
