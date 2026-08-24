import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { FieldError, FieldGroup } from '@/components/ui/field';
import { Spinner } from '@/components/ui/spinner';
import {
  type BrickGoldInputValues,
  goldToInputValues,
  inputValuesToGold,
} from '../-lib/gold';
import { calculateRaidRunWagePerPerson } from '../-lib/raid-run';
import { BrickGoldInputComponent } from './BrickGoldInputComponent';

export type RaidRunWageValues = {
  totalIncome: number;
  subsidyAmount: number;
  wagePerPerson: number;
};

type Props = {
  open: boolean;
  pending: boolean;
  initialWages: RaidRunWageValues;
  wageShareCount: number;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: RaidRunWageValues) => void;
};

export const RecordWageDialogComponent = ({
  open,
  pending,
  initialWages,
  wageShareCount,
  onOpenChange,
  onSubmit,
}: Props) => {
  const [totalIncome, setTotalIncome] = useState<BrickGoldInputValues>(
    goldToInputValues(0),
  );
  const [subsidyAmount, setSubsidyAmount] = useState<BrickGoldInputValues>(
    goldToInputValues(0),
  );
  const [wagePerPerson, setWagePerPerson] = useState<BrickGoldInputValues>(
    goldToInputValues(0),
  );
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (!open) {
      return;
    }

    setTotalIncome(goldToInputValues(initialWages.totalIncome));
    setSubsidyAmount(goldToInputValues(initialWages.subsidyAmount));
    setWagePerPerson(goldToInputValues(initialWages.wagePerPerson));
    setError(undefined);
  }, [
    open,
    initialWages.totalIncome,
    initialWages.subsidyAmount,
    initialWages.wagePerPerson,
  ]);

  const recalculateWage = (
    nextIncome: BrickGoldInputValues,
    nextSubsidy: BrickGoldInputValues,
  ) => {
    setWagePerPerson(
      goldToInputValues(
        calculateRaidRunWagePerPerson(
          inputValuesToGold(nextIncome) ?? 0,
          inputValuesToGold(nextSubsidy) ?? 0,
          wageShareCount,
        ),
      ),
    );
  };

  const handleSubmit = () => {
    const incomeGold = inputValuesToGold(totalIncome) ?? 0;
    const subsidyGold = inputValuesToGold(subsidyAmount) ?? 0;
    const wageGold = inputValuesToGold(wagePerPerson) ?? 0;

    if (subsidyGold > incomeGold) {
      setError('团队补贴不能大于金团工资');
      return;
    }

    onSubmit({
      totalIncome: incomeGold,
      subsidyAmount: subsidyGold,
      wagePerPerson: wageGold,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>记录工资</DialogTitle>
          <DialogDescription>
            用砖和金填写金额。改金团工资或团队补贴时会按报名人数自动计算个人工资，也可手动修改。
          </DialogDescription>
        </DialogHeader>
        <FieldGroup>
          <BrickGoldInputComponent
            id="raid-run-total-income"
            label="金团工资"
            brick={totalIncome.brick}
            gold={totalIncome.gold}
            invalid={Boolean(error)}
            onChange={(brick, gold) => {
              const next = { brick, gold };
              setTotalIncome(next);
              setError(undefined);
              recalculateWage(next, subsidyAmount);
            }}
          />
          <BrickGoldInputComponent
            id="raid-run-subsidy-amount"
            label="团队补贴"
            brick={subsidyAmount.brick}
            gold={subsidyAmount.gold}
            invalid={Boolean(error)}
            onChange={(brick, gold) => {
              const next = { brick, gold };
              setSubsidyAmount(next);
              setError(undefined);
              recalculateWage(totalIncome, next);
            }}
          />
          <BrickGoldInputComponent
            id="raid-run-wage-per-person"
            label="个人工资"
            brick={wagePerPerson.brick}
            gold={wagePerPerson.gold}
            invalid={Boolean(error)}
            onChange={(brick, gold) => {
              setWagePerPerson({ brick, gold });
              setError(undefined);
            }}
          />
          {error ? <FieldError>{error}</FieldError> : null}
        </FieldGroup>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            取消
          </Button>
          <Button type="button" disabled={pending} onClick={handleSubmit}>
            {pending ? <Spinner data-icon="inline-start" /> : null}
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
