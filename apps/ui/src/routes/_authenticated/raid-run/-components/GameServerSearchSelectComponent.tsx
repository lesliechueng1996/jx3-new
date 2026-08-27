import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from '@/components/ui/combobox';
import { Field, FieldLabel } from '@/components/ui/field';
import {
  gameServersAllQueryKey,
  listAllGameServers,
} from '@/lib/api/game-servers-api';
import {
  formatGameServerLabel,
  type GameServerSelectOption,
  gameServerInputLabel,
  matchesGameServerQuery,
  resolveGameServerInput,
} from '../-lib/game-server-select';

const EMPTY_SERVERS: GameServerSelectOption[] = [];

type GameServerSearchSelectComponentProps = {
  id?: string;
  value?: string;
  disabled?: boolean;
  placeholder?: string;
  onValueChange: (serverId: string | undefined) => void;
};

const isTypingReason = (reason: string) =>
  reason === 'input-change' || reason === 'input-clear';

export function GameServerSearchSelectComponent({
  id,
  value,
  disabled = false,
  placeholder = '输入服务器名称筛选',
  onValueChange,
}: GameServerSearchSelectComponentProps) {
  const serversQuery = useQuery({
    queryKey: gameServersAllQueryKey,
    queryFn: listAllGameServers,
  });
  const servers = serversQuery.data ?? EMPTY_SERVERS;
  const selectedServer = servers.find((server) => server.id === value) ?? null;
  const isDisabled = disabled || serversQuery.isPending;
  const [inputValue, setInputValue] = useState(() =>
    gameServerInputLabel(value, servers),
  );
  const inputValueRef = useRef(inputValue);
  const isFocusedRef = useRef(false);
  const skipBlurCommitRef = useRef(false);
  inputValueRef.current = inputValue;

  useEffect(() => {
    if (isFocusedRef.current) {
      return;
    }
    const next = gameServerInputLabel(value, servers);
    inputValueRef.current = next;
    setInputValue(next);
  }, [servers, value]);

  let emptyMessage = '未找到服务器';
  if (serversQuery.isError) {
    emptyMessage = '加载服务器失败';
  } else if (serversQuery.isPending) {
    emptyMessage = '加载中...';
  }

  const selectedLabel = () => gameServerInputLabel(value, servers);

  const commitSelection = (next: GameServerSelectOption | null) => {
    if (!next) {
      onValueChange(undefined);
      return;
    }
    onValueChange(next.id);
  };

  const commitInput = () => {
    const resolved = resolveGameServerInput(inputValueRef.current, servers);
    if (resolved.action === 'select') {
      onValueChange(resolved.serverId);
      return;
    }
    if (resolved.action === 'clear') {
      onValueChange(undefined);
      return;
    }
    setInputValue(selectedLabel());
  };

  return (
    <Field>
      <FieldLabel htmlFor={id}>服务器</FieldLabel>
      <Combobox
        items={servers}
        value={selectedServer}
        inputValue={inputValue}
        disabled={isDisabled}
        itemToStringLabel={(server) => formatGameServerLabel(server)}
        itemToStringValue={(server) => server.id}
        isItemEqualToValue={(item, selected) => item.id === selected?.id}
        filter={(server, query) => matchesGameServerQuery(server, query)}
        onInputValueChange={setInputValue}
        onValueChange={(next, details) => {
          if (
            isTypingReason(details.reason) ||
            details.reason === 'escape-key'
          ) {
            return;
          }
          skipBlurCommitRef.current = true;
          commitSelection(next);
        }}
        onOpenChange={(open, details) => {
          if (open || details.reason === 'item-press') {
            return;
          }
          if (details.reason === 'escape-key') {
            inputValueRef.current = selectedLabel();
            setInputValue(inputValueRef.current);
            return;
          }
          commitInput();
        }}
      >
        <ComboboxInput
          id={id}
          className="w-full"
          placeholder={placeholder}
          disabled={isDisabled}
          aria-label="服务器"
          onFocus={() => {
            isFocusedRef.current = true;
          }}
          onBlur={() => {
            isFocusedRef.current = false;
            window.setTimeout(() => {
              if (skipBlurCommitRef.current) {
                skipBlurCommitRef.current = false;
                return;
              }
              commitInput();
            }, 0);
          }}
        />
        <ComboboxContent>
          <ComboboxEmpty>{emptyMessage}</ComboboxEmpty>
          <ComboboxList>
            {(server) => (
              <ComboboxItem key={server.id} value={server}>
                {formatGameServerLabel(server)}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </Field>
  );
}
