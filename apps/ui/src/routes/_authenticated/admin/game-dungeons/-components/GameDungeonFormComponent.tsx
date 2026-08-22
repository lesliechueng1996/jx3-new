import { useState } from 'react';
import {
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
  type GameDungeonFormValues,
  gameDungeonFormSchema,
} from '../-lib/game-dungeons-form-schema';
import {
  DIFFICULTY_OPTIONS,
  WEEKDAY_OPTIONS,
} from '../-lib/game-dungeons-helpers';
import { ExpansionSeasonSelectComponent } from './ExpansionSeasonSelectComponent';

export type GameDungeonFormFields = GameDungeonFormValues;

type FieldErrors = Partial<Record<keyof GameDungeonFormFields, string>>;

type GameDungeonFormComponentProps = {
  formId: string;
  initialValues: GameDungeonFormFields;
  pending?: boolean;
  onSubmit: (values: GameDungeonFormValues) => void;
};

const emptyErrors = (): FieldErrors => ({});

export function GameDungeonFormComponent({
  formId,
  initialValues,
  pending = false,
  onSubmit,
}: GameDungeonFormComponentProps) {
  const [values, setValues] = useState<GameDungeonFormFields>(initialValues);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>(emptyErrors);

  const nameId = `${formId}-name`;
  const expansionId = `${formId}-expansion`;
  const seasonId = `${formId}-season`;
  const playerLimitId = `${formId}-player-limit`;
  const difficultyId = `${formId}-difficulty`;
  const levelRequirementId = `${formId}-level-requirement`;
  const bossCountId = `${formId}-boss-count`;
  const resetWeekdaysId = `${formId}-reset-weekdays`;

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const result = gameDungeonFormSchema.safeParse(values);
    if (!result.success) {
      const nextErrors: FieldErrors = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0];
        if (typeof key === 'string' && key in values) {
          nextErrors[key as keyof GameDungeonFormFields] = issue.message;
        }
      }
      setFieldErrors(nextErrors);
      return;
    }

    setFieldErrors(emptyErrors());
    onSubmit(result.data);
  };

  return (
    <form
      id={formId}
      className="flex flex-col gap-4"
      noValidate
      onSubmit={handleSubmit}
    >
      <FieldGroup>
        <Field data-invalid={Boolean(fieldErrors.name) || undefined}>
          <FieldLabel htmlFor={nameId}>名称</FieldLabel>
          <Input
            id={nameId}
            name="name"
            value={values.name}
            placeholder="例如：河阳之战"
            aria-invalid={Boolean(fieldErrors.name)}
            disabled={pending}
            onChange={(event) =>
              setValues((current) => ({ ...current, name: event.target.value }))
            }
          />
          {fieldErrors.name ? (
            <FieldError>{fieldErrors.name}</FieldError>
          ) : null}
        </Field>

        <ExpansionSeasonSelectComponent
          expansionFieldId={expansionId}
          seasonFieldId={seasonId}
          expansionId={values.expansionId || undefined}
          seasonId={values.seasonId || undefined}
          expansionError={fieldErrors.expansionId}
          seasonError={fieldErrors.seasonId}
          disabled={pending}
          onChange={({
            expansionId: nextExpansionId,
            seasonId: nextSeasonId,
          }) =>
            setValues((current) => ({
              ...current,
              expansionId: nextExpansionId ?? '',
              seasonId: nextSeasonId ?? '',
            }))
          }
        />

        <Field
          data-invalid={Boolean(fieldErrors.difficulty) || undefined}
          data-disabled={pending || undefined}
        >
          <FieldLabel id={difficultyId}>难度</FieldLabel>
          <ToggleGroup
            variant="outline"
            spacing={0}
            className="w-full"
            aria-labelledby={difficultyId}
            value={[values.difficulty]}
            disabled={pending}
            onValueChange={(value) => {
              const next = value[0];
              if (
                next === 'normal' ||
                next === 'heroic' ||
                next === 'challenge'
              ) {
                setValues((current) => ({ ...current, difficulty: next }));
              }
            }}
          >
            {DIFFICULTY_OPTIONS.map((item) => (
              <ToggleGroupItem
                key={item.value}
                className="flex-1"
                value={item.value}
                disabled={pending}
              >
                {item.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          {fieldErrors.difficulty ? (
            <FieldError>{fieldErrors.difficulty}</FieldError>
          ) : null}
        </Field>

        <Field data-invalid={Boolean(fieldErrors.playerLimit) || undefined}>
          <FieldLabel htmlFor={playerLimitId}>人数</FieldLabel>
          <Input
            id={playerLimitId}
            name="playerLimit"
            type="number"
            min={1}
            max={100}
            value={values.playerLimit}
            placeholder="例如：25"
            aria-invalid={Boolean(fieldErrors.playerLimit)}
            disabled={pending}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                playerLimit: event.target.value,
              }))
            }
          />
          {fieldErrors.playerLimit ? (
            <FieldError>{fieldErrors.playerLimit}</FieldError>
          ) : null}
        </Field>

        <Field
          data-invalid={Boolean(fieldErrors.levelRequirement) || undefined}
        >
          <FieldLabel htmlFor={levelRequirementId}>等级</FieldLabel>
          <Input
            id={levelRequirementId}
            name="levelRequirement"
            type="number"
            min={1}
            max={200}
            value={values.levelRequirement}
            placeholder="例如：120"
            aria-invalid={Boolean(fieldErrors.levelRequirement)}
            disabled={pending}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                levelRequirement: event.target.value,
              }))
            }
          />
          {fieldErrors.levelRequirement ? (
            <FieldError>{fieldErrors.levelRequirement}</FieldError>
          ) : null}
        </Field>

        <Field data-invalid={Boolean(fieldErrors.bossCount) || undefined}>
          <FieldLabel htmlFor={bossCountId}>Boss 数量</FieldLabel>
          <Input
            id={bossCountId}
            name="bossCount"
            type="number"
            min={1}
            max={50}
            value={values.bossCount}
            placeholder="例如：6"
            aria-invalid={Boolean(fieldErrors.bossCount)}
            disabled={pending}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                bossCount: event.target.value,
              }))
            }
          />
          {fieldErrors.bossCount ? (
            <FieldError>{fieldErrors.bossCount}</FieldError>
          ) : null}
        </Field>

        <Field
          data-invalid={Boolean(fieldErrors.resetWeekdays) || undefined}
          data-disabled={pending || undefined}
        >
          <FieldLabel id={resetWeekdaysId}>刷新日</FieldLabel>
          <FieldContent>
            <ToggleGroup
              multiple
              variant="outline"
              spacing={0}
              className="w-full"
              aria-labelledby={resetWeekdaysId}
              value={values.resetWeekdays.map(String)}
              disabled={pending}
              onValueChange={(next) => {
                const days = next
                  .map((item) => Number(item))
                  .filter((day) => day >= 1 && day <= 7)
                  .sort((left, right) => left - right);
                setValues((current) => ({
                  ...current,
                  resetWeekdays: days,
                }));
              }}
            >
              {WEEKDAY_OPTIONS.map((item) => (
                <ToggleGroupItem
                  key={item.value}
                  className="flex-1"
                  value={String(item.value)}
                  disabled={pending}
                >
                  {item.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </FieldContent>
          {fieldErrors.resetWeekdays ? (
            <FieldError>{fieldErrors.resetWeekdays}</FieldError>
          ) : null}
        </Field>
      </FieldGroup>
    </form>
  );
}
