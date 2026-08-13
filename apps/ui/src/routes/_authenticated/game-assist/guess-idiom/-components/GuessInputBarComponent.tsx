import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type GuessInputBarComponentProps = {
  value: string;
  disabled: boolean;
  maxRoundsReached: boolean;
  pending: boolean;
  onChange: (value: string) => void;
  onSubmit: () => void;
};

const GuessInputBarComponent = ({
  value,
  disabled,
  maxRoundsReached,
  pending,
  onChange,
  onSubmit,
}: GuessInputBarComponentProps) => {
  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <Input
        value={value}
        maxLength={4}
        placeholder="输入 4 个汉字"
        disabled={disabled || maxRoundsReached || pending}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            onSubmit();
          }
        }}
      />
      <Button
        type="button"
        disabled={disabled || maxRoundsReached || pending}
        onClick={onSubmit}
      >
        {pending ? '解析中…' : '提交猜测'}
      </Button>
      {maxRoundsReached ? (
        <p className="text-sm text-muted-foreground sm:self-center">
          最多录入 15 轮猜测
        </p>
      ) : null}
    </div>
  );
};

export default GuessInputBarComponent;
