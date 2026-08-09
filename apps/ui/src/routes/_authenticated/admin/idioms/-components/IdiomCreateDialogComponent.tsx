import { useEffect, useState } from 'react';
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
import type { AdminIdiomCreateFormValues } from '@/lib/api/admin/admin-idioms-api';

type IdiomCreateDialogComponentProps = {
  open: boolean;
  pending: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: AdminIdiomCreateFormValues) => void;
};

const emptyForm = (): AdminIdiomCreateFormValues => ({
  text: '',
  meaning: null,
});

export function IdiomCreateDialogComponent({
  open,
  pending,
  onOpenChange,
  onSubmit,
}: IdiomCreateDialogComponentProps) {
  const [text, setText] = useState('');
  const [meaning, setMeaning] = useState('');

  useEffect(() => {
    if (open) {
      const defaults = emptyForm();
      setText(defaults.text);
      setMeaning('');
    }
  }, [open]);

  const handleSubmit = () => {
    onSubmit({
      text: text.trim(),
      meaning: meaning.trim() ? meaning.trim() : null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>新增成语</DialogTitle>
          <DialogDescription>
            填写成语文字，系统将自动解析拼音、声母、韵母和声调。
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="idiom-text">成语</Label>
            <Input
              id="idiom-text"
              value={text}
              placeholder="例如：阿鼻地狱"
              onChange={(event) => setText(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="idiom-meaning">释义</Label>
            <Textarea
              id="idiom-meaning"
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
            onClick={() => onOpenChange(false)}
          >
            取消
          </Button>
          <Button
            type="button"
            disabled={pending || text.trim().length === 0}
            onClick={handleSubmit}
          >
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
