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
import type { AdminSchoolFormValues } from '@/lib/api/admin/admin-schools-api';
import type { SchoolFormValues } from '../-lib/schools-form-schema';
import { parseAliasInput } from '../-lib/schools-helpers';
import {
  SchoolFormComponent,
  type SchoolFormFields,
} from './SchoolFormComponent';

type SchoolCreateDialogComponentProps = {
  open: boolean;
  pending: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: AdminSchoolFormValues) => void;
};

const emptyForm = (): SchoolFormFields => ({
  name: '',
  type: 'school',
  icon: '',
  aliasText: '',
});

export function SchoolCreateDialogComponent({
  open,
  pending,
  onOpenChange,
  onSubmit,
}: SchoolCreateDialogComponentProps) {
  const handleSubmit = (values: SchoolFormValues) => {
    onSubmit({
      name: values.name,
      type: values.type,
      icon: values.icon ? values.icon : null,
      alias: parseAliasInput(values.aliasText),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>新增门派</DialogTitle>
          <DialogDescription>
            填写名称与类型。别名可用中英文逗号分隔。
          </DialogDescription>
        </DialogHeader>
        {open ? (
          <SchoolFormComponent
            formId="school-create-form"
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
          <Button type="submit" form="school-create-form" disabled={pending}>
            {pending ? <Spinner data-icon="inline-start" /> : null}
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
