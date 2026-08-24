import { Field, FieldLabel } from '@/components/ui/field';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from '@/components/ui/input-group';
import { parseGoldCount } from '../-lib/gold';

type Props = {
  id: string;
  label: string;
  brick: string;
  gold: string;
  invalid?: boolean;
  disabled?: boolean;
  onChange: (brick: string, gold: string) => void;
};

export const BrickGoldInputComponent = ({
  id,
  label,
  brick,
  gold,
  invalid = false,
  disabled = false,
  onChange,
}: Props) => {
  const brickId = `${id}-brick`;
  const goldId = `${id}-gold`;

  return (
    <Field
      data-invalid={invalid || undefined}
      data-disabled={disabled || undefined}
    >
      <FieldLabel htmlFor={brickId}>{label}</FieldLabel>
      <div className="flex gap-2">
        <InputGroup>
          <InputGroupInput
            id={brickId}
            inputMode="numeric"
            autoComplete="off"
            aria-invalid={invalid || undefined}
            disabled={disabled}
            value={brick}
            onChange={(event) => {
              const next = event.target.value;
              if (parseGoldCount(next) === undefined) {
                return;
              }
              onChange(next, gold);
            }}
          />
          <InputGroupAddon align="inline-end">
            <InputGroupText>砖</InputGroupText>
          </InputGroupAddon>
        </InputGroup>
        <InputGroup>
          <InputGroupInput
            id={goldId}
            inputMode="numeric"
            autoComplete="off"
            aria-invalid={invalid || undefined}
            disabled={disabled}
            value={gold}
            onChange={(event) => {
              const next = event.target.value;
              if (parseGoldCount(next) === undefined) {
                return;
              }
              onChange(brick, next);
            }}
          />
          <InputGroupAddon align="inline-end">
            <InputGroupText>金</InputGroupText>
          </InputGroupAddon>
        </InputGroup>
      </div>
    </Field>
  );
};
