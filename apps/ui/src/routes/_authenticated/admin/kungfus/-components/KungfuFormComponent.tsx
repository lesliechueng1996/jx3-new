import { useState } from 'react';
import { SchoolSelectComponent } from '@/components/SchoolSelectComponent';
import {
  Field,
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
      className="flex flex-col gap-4"
      noValidate
      onSubmit={handleSubmit}
    >
      <FieldGroup className="grid gap-4 md:grid-cols-2">
        <Field data-invalid={Boolean(fieldErrors.name) || undefined}>
          <FieldLabel htmlFor={nameId}>名称</FieldLabel>
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
          {fieldErrors.name ? (
            <FieldError>{fieldErrors.name}</FieldError>
          ) : null}
        </Field>

        <Field data-invalid={Boolean(fieldErrors.schoolId) || undefined}>
          <FieldLabel htmlFor={schoolId}>门派</FieldLabel>
          <SchoolSelectComponent
            id={schoolId}
            value={values.schoolId || undefined}
            disabled={pending}
            aria-invalid={Boolean(fieldErrors.schoolId) || undefined}
            onValueChange={(next) =>
              setValues((current) => ({ ...current, schoolId: next ?? '' }))
            }
          />
          {fieldErrors.schoolId ? (
            <FieldError>{fieldErrors.schoolId}</FieldError>
          ) : null}
        </Field>

        <Field
          data-invalid={Boolean(fieldErrors.kungfuType) || undefined}
          data-disabled={pending || undefined}
        >
          <FieldLabel>心法类型</FieldLabel>
          <ToggleGroup
            variant="outline"
            spacing={0}
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
            <ToggleGroupItem value="defense" disabled={pending}>
              防御
            </ToggleGroupItem>
            <ToggleGroupItem value="heal" disabled={pending}>
              治疗
            </ToggleGroupItem>
            <ToggleGroupItem value="attack" disabled={pending}>
              攻击
            </ToggleGroupItem>
          </ToggleGroup>
          {fieldErrors.kungfuType ? (
            <FieldError>{fieldErrors.kungfuType}</FieldError>
          ) : null}
        </Field>

        <Field
          data-invalid={Boolean(fieldErrors.attackType) || undefined}
          data-disabled={pending || undefined}
        >
          <FieldLabel>攻击类型</FieldLabel>
          <ToggleGroup
            variant="outline"
            spacing={0}
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
            <ToggleGroupItem value="internal" disabled={pending}>
              内功
            </ToggleGroupItem>
            <ToggleGroupItem value="external" disabled={pending}>
              外功
            </ToggleGroupItem>
          </ToggleGroup>
          {fieldErrors.attackType ? (
            <FieldError>{fieldErrors.attackType}</FieldError>
          ) : null}
        </Field>

        <Field
          data-invalid={Boolean(fieldErrors.attackMethod) || undefined}
          data-disabled={pending || undefined}
        >
          <FieldLabel>攻击方式</FieldLabel>
          <ToggleGroup
            variant="outline"
            spacing={0}
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
            <ToggleGroupItem value="melee" disabled={pending}>
              近战
            </ToggleGroupItem>
            <ToggleGroupItem value="ranged" disabled={pending}>
              远程
            </ToggleGroupItem>
          </ToggleGroup>
          {fieldErrors.attackMethod ? (
            <FieldError>{fieldErrors.attackMethod}</FieldError>
          ) : null}
        </Field>

        <Field data-invalid={Boolean(fieldErrors.icon) || undefined}>
          <FieldLabel htmlFor={iconId}>图标</FieldLabel>
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
          {fieldErrors.icon ? (
            <FieldError>{fieldErrors.icon}</FieldError>
          ) : null}
        </Field>

        <Field data-invalid={Boolean(fieldErrors.formationName) || undefined}>
          <FieldLabel htmlFor={formationNameId}>阵眼名称</FieldLabel>
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
          {fieldErrors.formationName ? (
            <FieldError>{fieldErrors.formationName}</FieldError>
          ) : null}
        </Field>

        <FieldSet
          className="md:col-span-2"
          data-invalid={Boolean(fieldErrors.formationEffects) || undefined}
        >
          <FieldLegend variant="label">阵眼效果</FieldLegend>
          <FieldGroup className="grid gap-4 md:grid-cols-2">
            {FORMATION_EFFECT_LEVEL_LABELS.map((label, index) => {
              const inputId = `${formId}-formation-effect-${index}`;
              return (
                <Field key={label}>
                  <FieldLabel htmlFor={inputId}>{label}</FieldLabel>
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
                </Field>
              );
            })}
          </FieldGroup>
          {fieldErrors.formationEffects ? (
            <FieldError>{fieldErrors.formationEffects}</FieldError>
          ) : null}
        </FieldSet>

        <Field
          className="md:col-span-2"
          data-invalid={Boolean(fieldErrors.aliasText) || undefined}
        >
          <FieldLabel htmlFor={aliasId}>别名</FieldLabel>
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
          {fieldErrors.aliasText ? (
            <FieldError>{fieldErrors.aliasText}</FieldError>
          ) : null}
        </Field>

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
    </form>
  );
}
