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
  AdminSchoolFormValues,
  AdminSchoolListItem,
} from '@/lib/api/admin/admin-schools-api';
import type { SchoolFormValues } from '../-lib/schools-form-schema';
import { formatAliasInput, parseAliasInput } from '../-lib/schools-helpers';
import { SchoolFormComponent } from './SchoolFormComponent';

type SchoolEditDialogComponentProps = {
  school: AdminSchoolListItem | null;
  open: boolean;
  pending: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: AdminSchoolFormValues) => void;
};

export function SchoolEditDialogComponent({
  school,
  open,
  pending,
  onOpenChange,
  onSubmit,
}: SchoolEditDialogComponentProps) {
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
          <DialogTitle>编辑门派</DialogTitle>
          <DialogDescription>修改名称、类型、图标或别名。</DialogDescription>
        </DialogHeader>
        {open && school ? (
          <SchoolFormComponent
            key={school.id}
            formId="school-edit-form"
            initialValues={{
              name: school.name,
              type: school.type,
              icon: school.icon ?? '',
              aliasText: formatAliasInput(school.alias),
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
            form="school-edit-form"
            disabled={pending || !school}
          >
            {pending ? <Spinner data-icon="inline-start" /> : null}
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
