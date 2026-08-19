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
import type { AdminUserCreateFormValues } from '@/lib/api/admin/admin-users-api';
import type {
  CreateUserFormValues,
  EditUserFormValues,
} from '../-lib/users-form-schema';
import { UserFormComponent, type UserFormFields } from './UserFormComponent';

type UserCreateDialogComponentProps = {
  open: boolean;
  pending: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: AdminUserCreateFormValues) => void;
};

const emptyForm = (): UserFormFields => ({
  name: '',
  email: '',
  password: '',
  role: 'user',
});

export function UserCreateDialogComponent({
  open,
  pending,
  onOpenChange,
  onSubmit,
}: UserCreateDialogComponentProps) {
  const handleSubmit = (values: CreateUserFormValues | EditUserFormValues) => {
    onSubmit({
      name: values.name,
      email: values.email ?? '',
      password: values.password ?? '',
      role: values.role,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>新增用户</DialogTitle>
          <DialogDescription>
            使用邮箱和密码创建账号，并可指定角色。
          </DialogDescription>
        </DialogHeader>
        {open ? (
          <UserFormComponent
            formId="user-create-form"
            initialValues={emptyForm()}
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
          <Button type="submit" form="user-create-form" disabled={pending}>
            {pending ? <Spinner data-icon="inline-start" /> : null}
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
