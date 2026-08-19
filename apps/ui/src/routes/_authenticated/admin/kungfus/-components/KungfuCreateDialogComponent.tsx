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
import type { AdminKungfuFormValues } from '@/lib/api/admin/admin-kungfus-api';
import {
  emptyFormationEffects,
  type KungfuFormValues,
} from '../-lib/kungfus-form-schema';
import { toAdminKungfuFormValues } from '../-lib/kungfus-helpers';
import {
  KungfuFormComponent,
  type KungfuFormFields,
} from './KungfuFormComponent';

type KungfuCreateDialogComponentProps = {
  open: boolean;
  pending: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: AdminKungfuFormValues) => void;
};

const emptyForm = (): KungfuFormFields => ({
  name: '',
  schoolId: '',
  kungfuType: 'attack',
  attackType: '',
  attackMethod: '',
  formationName: '',
  formationEffects: emptyFormationEffects(),
  isPveExternalRecommended: false,
  isPveInternalRecommended: false,
  isUnlimited: false,
  icon: '',
  aliasText: '',
});

export function KungfuCreateDialogComponent({
  open,
  pending,
  onOpenChange,
  onSubmit,
}: KungfuCreateDialogComponentProps) {
  const handleSubmit = (values: KungfuFormValues) => {
    onSubmit(toAdminKungfuFormValues(values));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>新增心法</DialogTitle>
          <DialogDescription>
            填写名称、门派与类型。别名可用中英文逗号分隔。
          </DialogDescription>
        </DialogHeader>
        {open ? (
          <KungfuFormComponent
            formId="kungfu-create-form"
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
          <Button type="submit" form="kungfu-create-form" disabled={pending}>
            {pending ? <Spinner data-icon="inline-start" /> : null}
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
