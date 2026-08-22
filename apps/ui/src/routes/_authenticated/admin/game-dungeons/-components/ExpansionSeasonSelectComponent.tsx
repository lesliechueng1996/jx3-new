import { useQuery } from '@tanstack/react-query';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { adminListGameExpansions } from '@/lib/api/admin/admin-game-expansions-api';
import { adminListGameSeasons } from '@/lib/api/admin/admin-game-seasons-api';

const EMPTY_EXPANSIONS: Array<{ id: string; name: string }> = [];
const EMPTY_SEASONS: Array<{ id: string; name: string }> = [];
const ALL_VALUE = 'all';

type ExpansionSeasonSelectComponentProps = {
  expansionFieldId: string;
  seasonFieldId: string;
  expansionId?: string;
  seasonId?: string;
  expansionError?: string;
  seasonError?: string;
  allowEmpty?: boolean;
  disabled?: boolean;
  onChange: (next: { expansionId?: string; seasonId?: string }) => void;
};

export function ExpansionSeasonSelectComponent({
  expansionFieldId,
  seasonFieldId,
  expansionId,
  seasonId,
  expansionError,
  seasonError,
  allowEmpty = false,
  disabled = false,
  onChange,
}: ExpansionSeasonSelectComponentProps) {
  const expansionsQuery = useQuery({
    queryKey: ['admin-game-expansions'],
    queryFn: adminListGameExpansions,
  });
  const seasonsQuery = useQuery({
    queryKey: ['admin-game-seasons', expansionId],
    queryFn: () => adminListGameSeasons(expansionId ?? ''),
    enabled: Boolean(expansionId),
  });

  const expansions = expansionsQuery.data?.items ?? EMPTY_EXPANSIONS;
  const seasons = expansionId
    ? (seasonsQuery.data?.items ?? EMPTY_SEASONS)
    : EMPTY_SEASONS;

  const expansionItems = allowEmpty
    ? [{ value: ALL_VALUE, label: '全部' }, ...expansions.map(toItem)]
    : expansions.map(toItem);
  const seasonItems = allowEmpty
    ? [{ value: ALL_VALUE, label: '全部' }, ...seasons.map(toItem)]
    : seasons.map(toItem);

  const expansionValue = allowEmpty ? (expansionId ?? ALL_VALUE) : expansionId;
  const seasonValue = allowEmpty ? (seasonId ?? ALL_VALUE) : seasonId;
  const expansionDisabled = disabled || expansionsQuery.isPending;
  const seasonDisabled = disabled || !expansionId || seasonsQuery.isPending;

  let expansionEmptyMessage = '暂无资料片';
  if (expansionsQuery.isError) {
    expansionEmptyMessage = '加载资料片失败';
  }

  let seasonEmptyMessage = '请先选择资料片';
  if (expansionId && seasonsQuery.isError) {
    seasonEmptyMessage = '加载赛季失败';
  } else if (expansionId) {
    seasonEmptyMessage = '该资料片下暂无赛季';
  }

  return (
    <>
      <Field data-invalid={Boolean(expansionError) || undefined}>
        <FieldLabel htmlFor={expansionFieldId}>资料片</FieldLabel>
        <Select
          items={expansionItems}
          value={expansionValue}
          disabled={expansionDisabled}
          onValueChange={(next) => {
            const nextExpansionId =
              next === ALL_VALUE || next === null ? undefined : next;
            onChange({
              expansionId: nextExpansionId,
              seasonId: undefined,
            });
          }}
        >
          <SelectTrigger
            id={expansionFieldId}
            className="w-full"
            aria-invalid={Boolean(expansionError) || undefined}
          >
            <SelectValue placeholder="请选择资料片" />
          </SelectTrigger>
          <SelectContent alignItemWithTrigger={false}>
            <SelectGroup>
              {expansionItems.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        {expansionError ? <FieldError>{expansionError}</FieldError> : null}
        {expansionsQuery.isError && !expansionError ? (
          <FieldError>{expansionEmptyMessage}</FieldError>
        ) : null}
      </Field>
      <Field data-invalid={Boolean(seasonError) || undefined}>
        <FieldLabel htmlFor={seasonFieldId}>赛季</FieldLabel>
        <Select
          items={seasonItems}
          value={seasonValue}
          disabled={seasonDisabled}
          onValueChange={(next) => {
            const nextSeasonId =
              next === ALL_VALUE || next === null ? undefined : next;
            onChange({
              expansionId,
              seasonId: nextSeasonId,
            });
          }}
        >
          <SelectTrigger
            id={seasonFieldId}
            className="w-full"
            aria-invalid={Boolean(seasonError) || undefined}
          >
            <SelectValue placeholder="请选择赛季" />
          </SelectTrigger>
          <SelectContent alignItemWithTrigger={false}>
            <SelectGroup>
              {seasonItems.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        {seasonError ? <FieldError>{seasonError}</FieldError> : null}
        {expansionId && seasonsQuery.isError && !seasonError ? (
          <FieldError>{seasonEmptyMessage}</FieldError>
        ) : null}
      </Field>
    </>
  );
}

const toItem = (item: { id: string; name: string }) => ({
  value: item.id,
  label: item.name,
});
