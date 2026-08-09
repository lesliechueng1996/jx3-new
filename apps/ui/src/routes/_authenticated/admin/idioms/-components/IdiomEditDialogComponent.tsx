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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import type {
  AdminIdiomCharFormValues,
  AdminIdiomDetail,
  AdminIdiomEditFormValues,
} from '@/lib/api/admin/admin-idioms-api';

type IdiomEditDialogComponentProps = {
  idiom: AdminIdiomDetail | null;
  open: boolean;
  pending: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: AdminIdiomEditFormValues) => void;
};

const toFormValues = (idiom: AdminIdiomDetail): AdminIdiomEditFormValues => ({
  text: idiom.text,
  pinyin: idiom.pinyin,
  tonePattern: idiom.tonePattern,
  meaning: idiom.meaning,
  chars: idiom.chars,
});

export function IdiomEditDialogComponent({
  idiom,
  open,
  pending,
  onOpenChange,
  onSubmit,
}: IdiomEditDialogComponentProps) {
  const [text, setText] = useState('');
  const [pinyin, setPinyin] = useState('');
  const [tonePattern, setTonePattern] = useState('');
  const [meaning, setMeaning] = useState('');
  const [chars, setChars] = useState<AdminIdiomCharFormValues[]>([]);

  useEffect(() => {
    if (open && idiom) {
      const values = toFormValues(idiom);
      setText(values.text);
      setPinyin(values.pinyin);
      setTonePattern(values.tonePattern);
      setMeaning(values.meaning ?? '');
      setChars(values.chars);
    }
  }, [open, idiom]);

  const updateChar = (
    charId: string,
    field: keyof AdminIdiomCharFormValues,
    value: string | number,
  ) => {
    setChars((current) =>
      current.map((item) =>
        item.id === charId ? { ...item, [field]: value } : item,
      ),
    );
  };

  const handleSubmit = () => {
    onSubmit({
      text: text.trim(),
      pinyin: pinyin.trim(),
      tonePattern: tonePattern.trim(),
      meaning: meaning.trim() ? meaning.trim() : null,
      chars,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>编辑成语</DialogTitle>
          <DialogDescription>
            直接修改成语及逐字读音信息，不会重新解析拼音。
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="edit-idiom-text">成语</Label>
              <Input
                id="edit-idiom-text"
                value={text}
                onChange={(event) => setText(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-idiom-pinyin">拼音</Label>
              <Input
                id="edit-idiom-pinyin"
                value={pinyin}
                onChange={(event) => setPinyin(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-idiom-tone-pattern">声调模式</Label>
              <Input
                id="edit-idiom-tone-pattern"
                value={tonePattern}
                onChange={(event) => setTonePattern(event.target.value)}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="edit-idiom-meaning">释义</Label>
              <Textarea
                id="edit-idiom-meaning"
                value={meaning}
                onChange={(event) => setMeaning(event.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>逐字读音</Label>
            <div className="rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>位置</TableHead>
                    <TableHead>字</TableHead>
                    <TableHead>拼音</TableHead>
                    <TableHead>声母</TableHead>
                    <TableHead>韵母</TableHead>
                    <TableHead>声调</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {chars.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.position + 1}</TableCell>
                      <TableCell>
                        <Input
                          value={item.char}
                          onChange={(event) =>
                            updateChar(item.id, 'char', event.target.value)
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={item.pinyin}
                          onChange={(event) =>
                            updateChar(item.id, 'pinyin', event.target.value)
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={item.initial}
                          onChange={(event) =>
                            updateChar(item.id, 'initial', event.target.value)
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={item.final}
                          onChange={(event) =>
                            updateChar(item.id, 'final', event.target.value)
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min={0}
                          max={5}
                          value={item.tone}
                          onChange={(event) =>
                            updateChar(
                              item.id,
                              'tone',
                              Number(event.target.value),
                            )
                          }
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
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
            disabled={
              pending || text.trim().length === 0 || pinyin.trim().length === 0
            }
            onClick={handleSubmit}
          >
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
