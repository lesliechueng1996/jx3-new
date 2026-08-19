import { TableLoadingOverlayComponent } from '@/components/TableLoadingOverlayComponent';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { AdminUserListItem } from '@/lib/api/admin/admin-users-api';
import { ROLE_ADMIN } from '@/lib/auth-client';
import {
  canBanOrDeleteUser,
  providerLabel,
  userRoleLabel,
} from '../-lib/users-helpers';

type UserTableComponentProps = {
  items: AdminUserListItem[];
  actorId: string;
  isLoading?: boolean;
  pendingUserId: string | null;
  onEdit: (user: AdminUserListItem) => void;
  onBan: (user: AdminUserListItem) => void;
  onUnban: (user: AdminUserListItem) => void;
  onDelete: (user: AdminUserListItem) => void;
};

const emptyValue = (value: string | null | undefined) =>
  value ? value : <span className="text-muted-foreground">-</span>;

export function UserTableComponent({
  items,
  actorId,
  isLoading = false,
  pendingUserId,
  onEdit,
  onBan,
  onUnban,
  onDelete,
}: UserTableComponentProps) {
  return (
    <div className="relative rounded-lg border border-border">
      <TableLoadingOverlayComponent loading={isLoading} />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>用户名</TableHead>
            <TableHead>邮箱</TableHead>
            <TableHead>角色</TableHead>
            <TableHead>状态</TableHead>
            <TableHead>登录方式</TableHead>
            <TableHead>最近 IP</TableHead>
            <TableHead>创建时间</TableHead>
            <TableHead className="text-right">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {!isLoading && items.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={8}
                className="py-10 text-center text-muted-foreground"
              >
                暂无用户数据
              </TableCell>
            </TableRow>
          ) : (
            items.map((user) => {
              const canManage = canBanOrDeleteUser(user, actorId);
              const pending = pendingUserId === user.id;
              const providers =
                user.providers.length > 0
                  ? user.providers.map(providerLabel).join('、')
                  : null;

              return (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.emailMasked}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        user.role === ROLE_ADMIN ? 'default' : 'secondary'
                      }
                    >
                      {userRoleLabel(user.role)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.banned ? 'destructive' : 'outline'}>
                      {user.banned ? '已封禁' : '正常'}
                    </Badge>
                  </TableCell>
                  <TableCell>{emptyValue(providers)}</TableCell>
                  <TableCell>{emptyValue(user.lastLoginIp)}</TableCell>
                  <TableCell>{user.createdAt}</TableCell>
                  <TableCell>
                    <div className="flex justify-end">
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={<Button variant="outline" size="sm" />}
                          disabled={pending}
                        >
                          操作
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuGroup>
                            <DropdownMenuItem onClick={() => onEdit(user)}>
                              编辑
                            </DropdownMenuItem>
                            {user.banned ? (
                              <DropdownMenuItem onClick={() => onUnban(user)}>
                                解封
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                disabled={!canManage}
                                onClick={() => onBan(user)}
                              >
                                封禁
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              variant="destructive"
                              disabled={!canManage}
                              onClick={() => onDelete(user)}
                            >
                              删除
                            </DropdownMenuItem>
                          </DropdownMenuGroup>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
