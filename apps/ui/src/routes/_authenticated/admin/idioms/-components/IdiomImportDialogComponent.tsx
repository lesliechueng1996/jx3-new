import { useRef, useState } from 'react';
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

type IdiomImportDialogComponentProps = {
  open: boolean;
  pending: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (file: File) => void;
};

export function IdiomImportDialogComponent({
  open,
  pending,
  onOpenChange,
  onSubmit,
}: IdiomImportDialogComponentProps) {
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

  const handleSubmit = () => {
    const file = inputRef.current?.files?.[0];
    if (!file) {
      return;
    }
    onSubmit(file);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>导入成语</DialogTitle>
          <DialogDescription>
            上传 CSV 文件，必须包含 text 列；pinyin（带声调）和 meaning
            列可选。无 pinyin 时将自动解析拼音。
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="idiom-import-file">CSV 文件</Label>
            <Input
              id="idiom-import-file"
              ref={inputRef}
              type="file"
              accept=".csv,text/csv"
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
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
          >
            取消
          </Button>
          <Button
            type="button"
            disabled={pending || fileName.length === 0}
            onClick={handleSubmit}
          >
            导入
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
