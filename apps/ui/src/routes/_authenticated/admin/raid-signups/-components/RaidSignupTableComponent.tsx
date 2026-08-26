import { TableLoadingOverlayComponent } from '@/components/TableLoadingOverlayComponent';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { AdminRaidSignupListItem } from '@/lib/api/admin/admin-raid-signups-api';
import {
  raidSignupFlagLabel,
  raidSignupFlagsFromItem,
  raidSignupRoleBadgeClassName,
  raidSignupRoleLabel,
  raidSignupStatusBadgeClassName,
  raidSignupStatusLabel,
} from '../-lib/raid-signups-helpers';

type RaidSignupTableComponentProps = {
  items: AdminRaidSignupListItem[];
  isLoading?: boolean;
  onView: (signup: AdminRaidSignupListItem) => void;
};

const emptyValue = (value: string | number | null | undefined) =>
  value === null || value === undefined || value === '' ? (
    <span className="text-muted-foreground">-</span>
  ) : (
    value
  );

const COLUMN_COUNT = 10;

export function RaidSignupTableComponent({
  items,
  isLoading = false,
  onView,
}: RaidSignupTableComponentProps) {
  return (
    <div className="relative overflow-x-auto rounded-lg border border-border">
      <TableLoadingOverlayComponent loading={isLoading} />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>角色名</TableHead>
            <TableHead>开团</TableHead>
            <TableHead>副本</TableHead>
            <TableHead>开团时间</TableHead>
            <TableHead>区服</TableHead>
            <TableHead>心法</TableHead>
            <TableHead>职能</TableHead>
            <TableHead>状态</TableHead>
            <TableHead>标记</TableHead>
            <TableHead className="text-right">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {!isLoading && items.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={COLUMN_COUNT}
                className="py-10 text-center text-muted-foreground"
              >
                暂无报名数据
              </TableCell>
            </TableRow>
          ) : (
            items.map((signup) => {
              const flags = raidSignupFlagsFromItem(signup);
              return (
                <TableRow key={signup.id}>
                  <TableCell className="font-medium">
                    <Button
                      type="button"
                      variant="link"
                      size="sm"
                      className="h-auto px-0"
                      onClick={() => onView(signup)}
                    >
                      {signup.characterName}
                    </Button>
                  </TableCell>
                  <TableCell>{emptyValue(signup.raidRunName)}</TableCell>
                  <TableCell>{emptyValue(signup.dungeonName)}</TableCell>
                  <TableCell>{emptyValue(signup.startTime)}</TableCell>
                  <TableCell>{emptyValue(signup.serverName)}</TableCell>
                  <TableCell>{emptyValue(signup.kungfuName)}</TableCell>
                  <TableCell>
                    <Badge
                      className={raidSignupRoleBadgeClassName(signup.role)}
                    >
                      {raidSignupRoleLabel(signup.role)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={raidSignupStatusBadgeClassName(signup.status)}
                    >
                      {raidSignupStatusLabel(signup.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {flags.length === 0 ? (
                      emptyValue(null)
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {flags.map((flag) => (
                          <Badge key={flag} variant="secondary">
                            {raidSignupFlagLabel(flag)}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => onView(signup)}
                      >
                        查看开团
                      </Button>
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
