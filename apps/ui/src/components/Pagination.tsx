import { type KeyboardEvent, useEffect, useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';

type Props = {
  total: number;
  page: number;
  totalPages: number;
  isPreviousPageDisabled: boolean;
  isNextPageDisabled: boolean;
  onPageChange: (page: number) => void;
};

const Pagination = ({
  total,
  page,
  totalPages,
  isPreviousPageDisabled,
  isNextPageDisabled,
  onPageChange,
}: Props) => {
  const [draftPage, setDraftPage] = useState(String(page));
  const isJumpDisabled = isPreviousPageDisabled && isNextPageDisabled;

  useEffect(() => {
    setDraftPage(String(page));
  }, [page]);

  const jumpToPage = () => {
    const parsed = Number.parseInt(draftPage, 10);
    if (Number.isNaN(parsed)) {
      setDraftPage(String(page));
      return;
    }

    const nextPage = Math.min(totalPages, Math.max(1, parsed));
    setDraftPage(String(nextPage));
    if (nextPage !== page) {
      onPageChange(nextPage);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      jumpToPage();
    }
  };

  return (
    <div className="flex items-center justify-between gap-4">
      <p className="text-sm text-muted-foreground">
        共 {total} 条，第 {page} / {totalPages} 页
      </p>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isPreviousPageDisabled}
          onClick={() => onPageChange(page - 1)}
        >
          上一页
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isNextPageDisabled}
          onClick={() => onPageChange(page + 1)}
        >
          下一页
        </Button>
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <span>跳至</span>
          <Input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            aria-label="跳转到页码"
            className="w-14 text-center"
            value={draftPage}
            disabled={isJumpDisabled}
            onChange={(event) => setDraftPage(event.target.value)}
            onBlur={jumpToPage}
            onKeyDown={handleKeyDown}
          />
          <span>页</span>
        </div>
      </div>
    </div>
  );
};

export default Pagination;
