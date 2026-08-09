import { type KeyboardEvent, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { IdiomsSearch } from '../-lib/idioms-schema';

type IdiomFiltersComponentProps = {
  committedFilters: IdiomsSearch;
  onSearch: (filters: IdiomsSearch) => void;
  onReset: () => void;
};

const IdiomFiltersComponent = ({
  committedFilters,
  onSearch,
  onReset,
}: IdiomFiltersComponentProps) => {
  const [draft, setDraft] = useState<IdiomsSearch>(committedFilters);

  useEffect(() => {
    setDraft(committedFilters);
  }, [committedFilters]);

  const handleSearch = () => {
    onSearch({ ...draft, page: 1 });
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleSearch();
    }
  };

  return (
    <div className="space-y-4 rounded-lg border border-border p-4">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="filter-idiom-text">成语</Label>
          <Input
            id="filter-idiom-text"
            value={draft.text ?? ''}
            placeholder="搜索成语"
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                text: event.target.value || undefined,
              }))
            }
            onKeyDown={handleKeyDown}
          />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button type="button" onClick={handleSearch}>
          搜索
        </Button>
        <Button type="button" variant="outline" onClick={onReset}>
          重置
        </Button>
      </div>
    </div>
  );
};

export default IdiomFiltersComponent;
