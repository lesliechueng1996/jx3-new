import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Spinner } from '@/components/ui/spinner';
import type {
  AdminUserEditFormValues,
  AdminUserListItem,
} from '@/lib/api/admin/admin-users-api';
import { ROLE_ADMIN, ROLE_USER } from '@/lib/auth-client';
import type {
  CreateUserFormValues,
  EditUserFormValues,
} from '../-lib/users-form-schema';
import { UserFormComponent } from './UserFormComponent';

type UserEditDialogComponentProps = {
  user: AdminUserListItem | null;
  actorId: string;
  open: boolean;
  pending: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: AdminUserEditFormValues) => void;
};

export function UserEditDialogComponent({
  user,
  actorId,
  open,
  pending,
  onOpenChange,
  onSubmit,
}: UserEditDialogComponentProps) {
  const handleSubmit = (values: CreateUserFormValues | EditUserFormValues) => {
    onSubmit({
      name: values.name,
      email: values.email,
      password: values.password,
      role: values.role,
    });
  };

  const role = user?.role === ROLE_ADMIN ? ROLE_ADMIN : ROLE_USER;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>编辑用户</DialogTitle>
          <DialogDescription>
            邮箱和密码留空表示不修改。当前邮箱为脱敏显示，无法回填明文。
          </DialogDescription>
        </DialogHeader>
        {open && user ? (
          <UserFormComponent
            key={user.id}
            formId="user-edit-form"
            initialValues={{
              name: user.name,
              email: '',
              password: '',
              role,
            }}
            emailOptional
            passwordOptional
            roleDisabled={user.id === actorId}
            pending={pending}
            onSubmit={handleSubmit}
          />
        ) : null}
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            取消
          </Button>
          <Button
            type="submit"
            form="user-edit-form"
            disabled={pending || !user}
          >
            {pending ? <Spinner data-icon="inline-start" /> : null}
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
