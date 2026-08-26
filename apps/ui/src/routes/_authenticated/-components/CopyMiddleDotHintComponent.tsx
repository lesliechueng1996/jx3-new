import { Button } from '@/components/ui/button';
import { Kbd } from '@/components/ui/kbd';
import { toast } from '@/components/ui/toast';
import { copyText } from '@/lib/copy-text';

export const ITEM_NAME_MIDDLE_DOT = '·';

export function CopyMiddleDotHintComponent() {
  const handleCopy = async () => {
    const copied = await copyText(ITEM_NAME_MIDDLE_DOT);
    toast.add({
      type: copied ? 'success' : 'error',
      description: copied ? '已复制到剪切板' : '复制失败，请手动复制',
    });
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="xs"
      className="self-start text-muted-foreground"
      aria-label="点击 · 即可复制到剪切板"
      onClick={handleCopy}
    >
      点击
      <Kbd>{ITEM_NAME_MIDDLE_DOT}</Kbd>
      即可复制到剪切板
    </Button>
  );
}
