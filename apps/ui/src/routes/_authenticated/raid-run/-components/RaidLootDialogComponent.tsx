import { useEffect, useState } from 'react';
import { GameItemSearchSelectComponent } from '@/components/GameItemSearchSelectComponent';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import type { GameItemSearchItem } from '@/lib/api/game-items-api';
import {
  ITEM_QUALITY_OPTIONS,
  ITEM_TYPE_OPTIONS,
  type ItemQuality,
  type ItemType,
} from '@/lib/game-item-labels';
import {
  type BrickGoldInputValues,
  goldToInputValues,
  inputValuesToGold,
} from '../-lib/gold';
import {
  DEFAULT_QUICK_CREATE_ITEM_QUALITY,
  DEFAULT_QUICK_CREATE_ITEM_TYPE,
  parseLootQuantity,
  type RaidLootWinnerOption,
  validateRaidLootForm,
} from '../-lib/raid-loot';
import { BrickGoldInputComponent } from './BrickGoldInputComponent';
import { RaidLootWinnerSelectComponent } from './RaidLootWinnerSelectComponent';

export type RaidLootDialogValues = {
  itemId?: string;
  createName?: string;
  createType: ItemType;
  createQuality: ItemQuality;
  quantity: number;
  winnerSignupId?: string;
  price: number | null;
  remark?: string;
};

export type RaidLootDialogInitial = {
  itemId?: string;
  itemName?: string;
  itemType?: ItemType;
  itemQuality?: ItemQuality;
  itemIcon?: string | null;
  quantity: number;
  winnerSignupId?: string | null;
  price: number | null;
  remark?: string | null;
};

type Props = {
  open: boolean;
  pending: boolean;
  title: string;
  winnerOptions: RaidLootWinnerOption[];
  initial?: RaidLootDialogInitial;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: RaidLootDialogValues) => void;
};

const isItemType = (value: string): value is ItemType =>
  ITEM_TYPE_OPTIONS.some((item) => item.value === value);

const isItemQuality = (value: string): value is ItemQuality =>
  ITEM_QUALITY_OPTIONS.some((item) => item.value === value);

const seedFromInitial = (
  initial?: RaidLootDialogInitial,
): GameItemSearchItem | undefined => {
  if (!initial?.itemId || !initial.itemName) {
    return undefined;
  }

  return {
    id: initial.itemId,
    name: initial.itemName,
    type: initial.itemType ?? DEFAULT_QUICK_CREATE_ITEM_TYPE,
    quality: initial.itemQuality ?? DEFAULT_QUICK_CREATE_ITEM_QUALITY,
    icon: initial.itemIcon ?? null,
    alias: [],
  };
};

export const RaidLootDialogComponent = ({
  open,
  pending,
  title,
  winnerOptions,
  initial,
  onOpenChange,
  onSubmit,
}: Props) => {
  const [itemId, setItemId] = useState<string>();
  const [creatingName, setCreatingName] = useState<string>();
  const [createType, setCreateType] = useState<ItemType>(
    DEFAULT_QUICK_CREATE_ITEM_TYPE,
  );
  const [createQuality, setCreateQuality] = useState<ItemQuality>(
    DEFAULT_QUICK_CREATE_ITEM_QUALITY,
  );
  const [quantity, setQuantity] = useState('1');
  const [winnerSignupId, setWinnerSignupId] = useState<string>();
  const [price, setPrice] = useState<BrickGoldInputValues>(
    goldToInputValues(0),
  );
  const [remark, setRemark] = useState('');
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (!open) {
      return;
    }

    setItemId(initial?.itemId);
    setCreatingName(undefined);
    setCreateType(DEFAULT_QUICK_CREATE_ITEM_TYPE);
    setCreateQuality(DEFAULT_QUICK_CREATE_ITEM_QUALITY);
    setQuantity(String(initial?.quantity ?? 1));
    setWinnerSignupId(initial?.winnerSignupId ?? undefined);
    setPrice(goldToInputValues(initial?.price ?? 0));
    setRemark(initial?.remark ?? '');
    setError(undefined);
  }, [initial, open]);

  const seedItem = seedFromInitial(initial);

  const handleSubmit = () => {
    const parsedQuantity = parseLootQuantity(quantity);
    const message = validateRaidLootForm({
      itemId,
      createName: creatingName,
      quantity: parsedQuantity,
    });
    if (message) {
      setError(message);
      return;
    }

    const priceGold = inputValuesToGold(price);
    const trimmedRemark = remark.trim();

    onSubmit({
      itemId,
      createName: creatingName,
      createType,
      createQuality,
      quantity: parsedQuantity as number,
      winnerSignupId,
      price:
        price.brick.length === 0 && price.gold.length === 0
          ? null
          : (priceGold ?? 0),
      remark: trimmedRemark.length > 0 ? trimmedRemark : undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            选择已有物品，或在搜不到时创建物品后记录掉落。
          </DialogDescription>
        </DialogHeader>
        <FieldGroup>
          <GameItemSearchSelectComponent
            id="raid-loot-item"
            label="物品名称"
            value={itemId}
            seedItem={seedItem}
            creatingName={creatingName}
            allowCreate
            disabled={pending}
            onValueChange={(next) => {
              setItemId(next);
              setCreatingName(undefined);
              setError(undefined);
            }}
            onCreateRequest={(name) => {
              setItemId(undefined);
              setCreatingName(name);
              setCreateType(DEFAULT_QUICK_CREATE_ITEM_TYPE);
              setCreateQuality(DEFAULT_QUICK_CREATE_ITEM_QUALITY);
              setError(undefined);
            }}
          />
          {creatingName ? (
            <>
              <Field data-disabled={pending || undefined}>
                <FieldLabel>类型</FieldLabel>
                <ToggleGroup
                  variant="outline"
                  spacing={0}
                  value={[createType]}
                  disabled={pending}
                  onValueChange={(value) => {
                    const next = value[0];
                    if (next && isItemType(next)) {
                      setCreateType(next);
                    }
                  }}
                >
                  {ITEM_TYPE_OPTIONS.map((item) => (
                    <ToggleGroupItem
                      key={item.value}
                      value={item.value}
                      disabled={pending}
                    >
                      {item.label}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </Field>
              <Field data-disabled={pending || undefined}>
                <FieldLabel>品质</FieldLabel>
                <ToggleGroup
                  variant="outline"
                  spacing={0}
                  value={[createQuality]}
                  disabled={pending}
                  onValueChange={(value) => {
                    const next = value[0];
                    if (next && isItemQuality(next)) {
                      setCreateQuality(next);
                    }
                  }}
                >
                  {ITEM_QUALITY_OPTIONS.map((item) => (
                    <ToggleGroupItem
                      key={item.value}
                      value={item.value}
                      disabled={pending}
                    >
                      {item.label}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </Field>
            </>
          ) : null}
          <Field data-invalid={error === '数量须为大于0的整数' || undefined}>
            <FieldLabel htmlFor="raid-loot-quantity">数量</FieldLabel>
            <Input
              id="raid-loot-quantity"
              inputMode="numeric"
              autoComplete="off"
              value={quantity}
              disabled={pending}
              aria-invalid={error === '数量须为大于0的整数' || undefined}
              onChange={(event) => {
                const next = event.target.value;
                if (next.length > 0 && parseLootQuantity(next) === undefined) {
                  return;
                }
                setQuantity(next);
                setError(undefined);
              }}
            />
          </Field>
          <RaidLootWinnerSelectComponent
            id="raid-loot-winner"
            value={winnerSignupId}
            options={winnerOptions}
            disabled={pending}
            onValueChange={setWinnerSignupId}
          />
          <BrickGoldInputComponent
            id="raid-loot-price"
            label="成交价格"
            brick={price.brick}
            gold={price.gold}
            disabled={pending}
            onChange={(brick, gold) => setPrice({ brick, gold })}
          />
          <Field>
            <FieldLabel htmlFor="raid-loot-remark">备注</FieldLabel>
            <Textarea
              id="raid-loot-remark"
              value={remark}
              disabled={pending}
              maxLength={512}
              onChange={(event) => setRemark(event.target.value)}
            />
          </Field>
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
