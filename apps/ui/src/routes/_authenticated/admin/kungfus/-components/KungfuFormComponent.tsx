import { useState } from 'react';
import { SchoolSelectComponent } from '@/components/SchoolSelectComponent';
import {
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
  FORMATION_EFFECT_LEVEL_LABELS,
  type FormationEffectLevels,
  type KungfuFormValues,
  kungfuFormSchema,
} from '../-lib/kungfus-form-schema';

export type KungfuFormFields = KungfuFormValues;

type FieldErrors = Partial<Record<keyof KungfuFormFields, string>>;

type KungfuFormComponentProps = {
  formId: string;
  initialValues: KungfuFormFields;
  pending?: boolean;
  onSubmit: (values: KungfuFormValues) => void;
};

const emptyErrors = (): FieldErrors => ({});

const HORIZONTAL_FIELD_CLASS =
  'grid grid-cols-[6rem_minmax(0,1fr)] gap-x-3 gap-y-1 *:w-auto';
const FIELD_LABEL_CLASS = 'col-start-1 row-start-1 self-center';

type HorizontalFieldProps = {
  label: string;
  labelId?: string;
  htmlFor?: string;
  error?: string;
  invalid?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
};

function HorizontalField({
  label,
  labelId,
  htmlFor,
  error,
  invalid,
  disabled,
  children,
}: HorizontalFieldProps) {
  return (
    <Field
      className={HORIZONTAL_FIELD_CLASS}
      data-invalid={invalid || undefined}
      data-disabled={disabled || undefined}
    >
      <FieldLabel id={labelId} htmlFor={htmlFor} className={FIELD_LABEL_CLASS}>
        {label}
      </FieldLabel>
      <FieldContent className="col-start-2 row-start-1 min-w-0">
        {children}
      </FieldContent>
      {error ? (
        <FieldError className="col-start-2 row-start-2">{error}</FieldError>
      ) : null}
    </Field>
  );
}

export function KungfuFormComponent({
  formId,
  initialValues,
  pending = false,
  onSubmit,
}: KungfuFormComponentProps) {
  const [values, setValues] = useState<KungfuFormFields>(initialValues);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>(emptyErrors);

  const nameId = `${formId}-name`;
  const schoolId = `${formId}-school`;
  const formationNameId = `${formId}-formation-name`;
  const iconId = `${formId}-icon`;
  const aliasId = `${formId}-alias`;
  const unlimitedId = `${formId}-unlimited`;
  const pveExternalId = `${formId}-pve-external`;
  const pveInternalId = `${formId}-pve-internal`;
  const kungfuTypeId = `${formId}-kungfu-type`;
  const attackTypeId = `${formId}-attack-type`;
  const attackMethodId = `${formId}-attack-method`;

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const result = kungfuFormSchema.safeParse(values);
    if (!result.success) {
      const nextErrors: FieldErrors = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0];
        if (typeof key === 'string' && key in values) {
          nextErrors[key as keyof KungfuFormFields] = issue.message;
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
      className="flex flex-col gap-6"
      noValidate
      onSubmit={handleSubmit}
    >
      <FieldGroup>
        <HorizontalField
          label="名称"
          htmlFor={nameId}
          error={fieldErrors.name}
          invalid={Boolean(fieldErrors.name)}
        >
          <Input
            id={nameId}
            name="name"
            value={values.name}
            placeholder="例如：紫霞功"
            aria-invalid={Boolean(fieldErrors.name)}
            disabled={pending}
            onChange={(event) =>
              setValues((current) => ({ ...current, name: event.target.value }))
            }
          />
        </HorizontalField>

        <HorizontalField
          label="门派"
          htmlFor={schoolId}
          error={fieldErrors.schoolId}
          invalid={Boolean(fieldErrors.schoolId)}
        >
          <SchoolSelectComponent
            id={schoolId}
            value={values.schoolId || undefined}
            disabled={pending}
            aria-invalid={Boolean(fieldErrors.schoolId) || undefined}
            onValueChange={(next) =>
              setValues((current) => ({ ...current, schoolId: next ?? '' }))
            }
          />
        </HorizontalField>

        <HorizontalField
          label="心法类型"
          labelId={kungfuTypeId}
          error={fieldErrors.kungfuType}
          invalid={Boolean(fieldErrors.kungfuType)}
          disabled={pending}
        >
          <ToggleGroup
            variant="outline"
            spacing={0}
            className="w-full"
            aria-labelledby={kungfuTypeId}
            value={[values.kungfuType]}
            disabled={pending}
            onValueChange={(value) => {
              const nextType = value[0];
              if (
                nextType === 'defense' ||
                nextType === 'heal' ||
                nextType === 'attack'
              ) {
                setValues((current) => ({ ...current, kungfuType: nextType }));
              }
            }}
          >
            <ToggleGroupItem
              className="flex-1"
              value="defense"
              disabled={pending}
            >
              防御
            </ToggleGroupItem>
            <ToggleGroupItem className="flex-1" value="heal" disabled={pending}>
              治疗
            </ToggleGroupItem>
            <ToggleGroupItem
              className="flex-1"
              value="attack"
              disabled={pending}
            >
              攻击
            </ToggleGroupItem>
          </ToggleGroup>
        </HorizontalField>

        <HorizontalField
          label="攻击类型"
          labelId={attackTypeId}
          error={fieldErrors.attackType}
          invalid={Boolean(fieldErrors.attackType)}
          disabled={pending}
        >
          <ToggleGroup
            variant="outline"
            spacing={0}
            className="w-full"
            aria-labelledby={attackTypeId}
            value={values.attackType ? [values.attackType] : []}
            disabled={pending}
            onValueChange={(value) => {
              const nextType = value[0];
              if (nextType === 'internal' || nextType === 'external') {
                setValues((current) => ({ ...current, attackType: nextType }));
                return;
              }
              setValues((current) => ({ ...current, attackType: '' }));
            }}
          >
            <ToggleGroupItem
              className="flex-1"
              value="internal"
              disabled={pending}
            >
              内功
            </ToggleGroupItem>
            <ToggleGroupItem
              className="flex-1"
              value="external"
              disabled={pending}
            >
              外功
            </ToggleGroupItem>
          </ToggleGroup>
        </HorizontalField>

        <HorizontalField
          label="攻击方式"
          labelId={attackMethodId}
          error={fieldErrors.attackMethod}
          invalid={Boolean(fieldErrors.attackMethod)}
          disabled={pending}
        >
          <ToggleGroup
            variant="outline"
            spacing={0}
            className="w-full"
            aria-labelledby={attackMethodId}
            value={values.attackMethod ? [values.attackMethod] : []}
            disabled={pending}
            onValueChange={(value) => {
              const nextMethod = value[0];
              if (nextMethod === 'melee' || nextMethod === 'ranged') {
                setValues((current) => ({
                  ...current,
                  attackMethod: nextMethod,
                }));
                return;
              }
              setValues((current) => ({ ...current, attackMethod: '' }));
            }}
          >
            <ToggleGroupItem
              className="flex-1"
              value="melee"
              disabled={pending}
            >
              近战
            </ToggleGroupItem>
            <ToggleGroupItem
              className="flex-1"
              value="ranged"
              disabled={pending}
            >
              远程
            </ToggleGroupItem>
          </ToggleGroup>
        </HorizontalField>

        <HorizontalField
          label="图标"
          htmlFor={iconId}
          error={fieldErrors.icon}
          invalid={Boolean(fieldErrors.icon)}
        >
          <Input
            id={iconId}
            name="icon"
            value={values.icon}
            placeholder="可选，图标 URL"
            aria-invalid={Boolean(fieldErrors.icon)}
            disabled={pending}
            onChange={(event) =>
              setValues((current) => ({ ...current, icon: event.target.value }))
            }
          />
        </HorizontalField>

        <HorizontalField
          label="别名"
          htmlFor={aliasId}
          error={fieldErrors.aliasText}
          invalid={Boolean(fieldErrors.aliasText)}
        >
          <Input
            id={aliasId}
            name="aliasText"
            value={values.aliasText}
            placeholder="多个别名用逗号分隔"
            aria-invalid={Boolean(fieldErrors.aliasText)}
            disabled={pending}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                aliasText: event.target.value,
              }))
            }
          />
        </HorizontalField>

        <FieldGroup className="flex-row flex-wrap gap-x-6">
          <Field orientation="horizontal" className="w-fit">
            <Switch
              id={unlimitedId}
              checked={values.isUnlimited}
              disabled={pending}
              onCheckedChange={(checked) =>
                setValues((current) => ({ ...current, isUnlimited: checked }))
              }
            />
            <FieldLabel htmlFor={unlimitedId}>无界</FieldLabel>
          </Field>

          <Field orientation="horizontal" className="w-fit">
            <Switch
              id={pveExternalId}
              checked={values.isPveExternalRecommended}
              disabled={pending}
              onCheckedChange={(checked) =>
                setValues((current) => ({
                  ...current,
                  isPveExternalRecommended: checked,
                }))
              }
            />
            <FieldLabel htmlFor={pveExternalId}>PVE 外功推荐</FieldLabel>
          </Field>

          <Field orientation="horizontal" className="w-fit">
            <Switch
              id={pveInternalId}
              checked={values.isPveInternalRecommended}
              disabled={pending}
              onCheckedChange={(checked) =>
                setValues((current) => ({
                  ...current,
                  isPveInternalRecommended: checked,
                }))
              }
            />
            <FieldLabel htmlFor={pveInternalId}>PVE 内功推荐</FieldLabel>
          </Field>
        </FieldGroup>
      </FieldGroup>

      <FieldSet
        data-invalid={Boolean(fieldErrors.formationEffects) || undefined}
      >
        <FieldLegend>阵眼</FieldLegend>
        <FieldGroup className="gap-3">
          <HorizontalField
            label="阵眼名称"
            htmlFor={formationNameId}
            error={fieldErrors.formationName}
            invalid={Boolean(fieldErrors.formationName)}
          >
            <Input
              id={formationNameId}
              name="formationName"
              value={values.formationName}
              placeholder="可选"
              aria-invalid={Boolean(fieldErrors.formationName)}
              disabled={pending}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  formationName: event.target.value,
                }))
              }
            />
          </HorizontalField>

          {FORMATION_EFFECT_LEVEL_LABELS.map((label, index) => {
            const inputId = `${formId}-formation-effect-${index}`;
            return (
              <HorizontalField key={label} label={label} htmlFor={inputId}>
                <Input
                  id={inputId}
                  name={`formationEffects.${index}`}
                  value={values.formationEffects[index]}
                  placeholder="可选"
                  aria-invalid={Boolean(fieldErrors.formationEffects)}
                  disabled={pending}
                  onChange={(event) =>
                    setValues((current) => {
                      const nextEffects = [
                        ...current.formationEffects,
                      ] as FormationEffectLevels;
                      nextEffects[index] = event.target.value;
                      return {
                        ...current,
                        formationEffects: nextEffects,
                      };
                    })
                  }
                />
              </HorizontalField>
            );
          })}
        </FieldGroup>
        {fieldErrors.formationEffects ? (
          <FieldError>{fieldErrors.formationEffects}</FieldError>
        ) : null}
      </FieldSet>
    </form>
  );
}
