import { type KeyboardEvent, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { ROLE_ADMIN, ROLE_USER } from '@/lib/auth-client';
import type { UsersSearch } from '../-lib/users-schema';

type UserFiltersComponentProps = {
  committedFilters: UsersSearch;
  onSearch: (filters: UsersSearch) => void;
  onReset: () => void;
};

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
          <FieldLabel>角色</FieldLabel>
          <ToggleGroup
            variant="outline"
            spacing={0}
            value={[roleFilterValue(draft.role)]}
            onValueChange={(value) => {
              const next = value[0];
              if (next === 'all') {
                setDraft((current) => ({ ...current, role: undefined }));
                return;
              }
              if (next === ROLE_ADMIN || next === ROLE_USER) {
                setDraft((current) => ({ ...current, role: next }));
              }
            }}
          >
            <ToggleGroupItem value="all">全部</ToggleGroupItem>
            <ToggleGroupItem value={ROLE_USER}>用户</ToggleGroupItem>
            <ToggleGroupItem value={ROLE_ADMIN}>管理员</ToggleGroupItem>
          </ToggleGroup>
        </Field>
        <Field>
          <FieldLabel>状态</FieldLabel>
          <ToggleGroup
            variant="outline"
            spacing={0}
            value={[bannedFilterValue(draft.banned)]}
            onValueChange={(value) => {
              const next = value[0];
              if (next === 'all') {
                setDraft((current) => ({ ...current, banned: undefined }));
                return;
              }
              if (next === 'true' || next === 'false') {
                setDraft((current) => ({ ...current, banned: next }));
              }
            }}
          >
            <ToggleGroupItem value="all">全部</ToggleGroupItem>
            <ToggleGroupItem value="false">正常</ToggleGroupItem>
            <ToggleGroupItem value="true">已封禁</ToggleGroupItem>
          </ToggleGroup>
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
