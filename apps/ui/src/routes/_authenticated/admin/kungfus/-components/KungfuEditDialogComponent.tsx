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
  AdminKungfuFormValues,
  AdminKungfuListItem,
} from '@/lib/api/admin/admin-kungfus-api';
import {
  type KungfuFormValues,
  splitFormationEffect,
} from '../-lib/kungfus-form-schema';
import {
  formatAliasInput,
  toAdminKungfuFormValues,
} from '../-lib/kungfus-helpers';
import { KungfuFormComponent } from './KungfuFormComponent';

type KungfuEditDialogComponentProps = {
  kungfu: AdminKungfuListItem | null;
  open: boolean;
  pending: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: AdminKungfuFormValues) => void;
};

export function KungfuEditDialogComponent({
  kungfu,
  open,
  pending,
  onOpenChange,
  onSubmit,
}: KungfuEditDialogComponentProps) {
  const handleSubmit = (values: KungfuFormValues) => {
    onSubmit(toAdminKungfuFormValues(values));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>编辑心法</DialogTitle>
          <DialogDescription>修改心法信息与推荐标记。</DialogDescription>
        </DialogHeader>
        {open && kungfu ? (
          <KungfuFormComponent
            key={kungfu.id}
            formId="kungfu-edit-form"
            initialValues={{
              name: kungfu.name,
              schoolId: kungfu.schoolId,
              kungfuType: kungfu.kungfuType,
              attackType: kungfu.attackType ?? '',
              attackMethod: kungfu.attackMethod ?? '',
              formationName: kungfu.formationName ?? '',
              formationEffects: splitFormationEffect(
                kungfu.formationEffect ?? '',
              ),
              isPveExternalRecommended: kungfu.isPveExternalRecommended,
              isPveInternalRecommended: kungfu.isPveInternalRecommended,
              isUnlimited: kungfu.isUnlimited,
              icon: kungfu.icon ?? '',
              aliasText: formatAliasInput(kungfu.alias),
            }}
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
            form="kungfu-edit-form"
            disabled={pending || !kungfu}
          >
            {pending ? <Spinner data-icon="inline-start" /> : null}
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
