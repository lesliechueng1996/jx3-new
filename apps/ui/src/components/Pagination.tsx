import { Button } from './ui/button';

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
      </div>
    </div>
  );
};

export default Pagination;
