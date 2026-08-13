import { useEffect, useState } from 'react';
import type { AdminIdiomCreateFormValues } from '#/lib/api/admin/admin-idioms-api';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

type IdiomQuickAddDialogComponentProps = {
  open: boolean;
  pending: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: AdminIdiomCreateFormValues) => void;
};

const IdiomQuickAddDialogComponent = ({
  open,
  pending,
  onOpenChange,
  onSubmit,
}: IdiomQuickAddDialogComponentProps) => {
  const [text, setText] = useState('');
  const [meaning, setMeaning] = useState('');

  useEffect(() => {
    if (open) {
      setText('');
      setMeaning('');
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>添加成语到词库</DialogTitle>
          <DialogDescription>
            填写成语文字，系统将自动解析拼音并写入词库。
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="quick-add-idiom-text">成语</Label>
            <Input
              id="quick-add-idiom-text"
              value={text}
              placeholder="例如：一心一意"
              onChange={(event) => setText(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="quick-add-idiom-meaning">释义</Label>
            <Textarea
              id="quick-add-idiom-meaning"
              value={meaning}
              placeholder="可选"
              onChange={(event) => setMeaning(event.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={() => onOpenChange(false)}
          >
            取消
          </Button>
          <Button
            type="button"
            disabled={pending || text.trim().length === 0}
            onClick={() =>
              onSubmit({
                text: text.trim(),
                meaning: meaning.trim() ? meaning.trim() : null,
              })
            }
          >
            {pending ? '保存中…' : '保存'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default IdiomQuickAddDialogComponent;
