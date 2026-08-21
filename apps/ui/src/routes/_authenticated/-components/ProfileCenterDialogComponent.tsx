import { useRef, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Spinner } from '@/components/ui/spinner';
import type { ProfilePasswordFormValues } from '../-lib/profile-password-schema';
import { ProfilePasswordFormComponent } from './ProfilePasswordFormComponent';

type ProfileUser = {
  name: string;
  email: string;
  image?: string | null;
};

type ProfileCenterDialogComponentProps = {
  user: ProfileUser;
  open: boolean;
  avatarPending: boolean;
  passwordPending: boolean;
  passwordFormKey: number;
  onOpenChange: (open: boolean) => void;
  onUploadAvatar: (file: File) => void;
  onChangePassword: (values: ProfilePasswordFormValues) => void;
};

function getInitials(name: string, email: string): string {
  const source = name.trim() || email.trim();
  if (!source) {
    return '用';
  }
  return source.slice(0, 1).toUpperCase();
}

export function ProfileCenterDialogComponent({
  user,
  open,
  avatarPending,
  passwordPending,
  passwordFormKey,
  onOpenChange,
  onUploadAvatar,
  onChangePassword,
}: ProfileCenterDialogComponentProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState('');

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setFileName('');
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    }
    onOpenChange(nextOpen);
  };

  const handleUpload = () => {
    const file = inputRef.current?.files?.[0];
    if (!file) {
      return;
    }
    onUploadAvatar(file);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>个人中心</DialogTitle>
          <DialogDescription>
            上传头像或修改登录密码。修改密码后其他设备上的登录将会失效。
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-6">
          <section className="flex flex-col gap-3">
            <h3 className="text-sm font-medium">头像</h3>
            <div className="flex items-center gap-3">
              <Avatar size="lg">
                {user.image ? (
                  <AvatarImage src={user.image} alt={user.name} />
                ) : null}
                <AvatarFallback>
                  {getInitials(user.name, user.email)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1 space-y-2">
                <Label htmlFor="profile-avatar-file">选择图片</Label>
                <Input
                  id="profile-avatar-file"
                  ref={inputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
                  disabled={avatarPending}
                  onChange={(event) => {
                    setFileName(event.target.files?.[0]?.name ?? '');
                  }}
                />
                {fileName ? (
                  <p className="text-sm text-muted-foreground">
                    已选择：{fileName}
                  </p>
                ) : null}
              </div>
            </div>
            <Button
              type="button"
              disabled={avatarPending || fileName.length === 0}
              onClick={handleUpload}
            >
              {avatarPending ? <Spinner /> : null}
              上传头像
            </Button>
          </section>

          <Separator />

          <section className="flex flex-col gap-3">
            <h3 className="text-sm font-medium">修改密码</h3>
            <ProfilePasswordFormComponent
              key={passwordFormKey}
              formId="profile-password-form"
              pending={passwordPending}
              onSubmit={onChangePassword}
            />
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
