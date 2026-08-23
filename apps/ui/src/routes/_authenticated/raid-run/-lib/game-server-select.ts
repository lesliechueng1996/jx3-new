export type GameServerSelectOption = {
  id: string;
  zone: string;
  name: string;
  alias: readonly string[];
};

export const formatGameServerLabel = (server: { zone: string; name: string }) =>
  `${server.zone} · ${server.name}`;

export const matchesGameServerQuery = (
  server: GameServerSelectOption,
  query: string,
): boolean => {
  const normalized = query.trim().toLowerCase();
  if (normalized.length === 0) {
    return true;
  }

  if (server.name.toLowerCase().includes(normalized)) {
    return true;
  }

  if (server.zone.toLowerCase().includes(normalized)) {
    return true;
  }

  if (formatGameServerLabel(server).toLowerCase().includes(normalized)) {
    return true;
  }

  return server.alias.some((alias) => alias.toLowerCase().includes(normalized));
};

export const gameServerInputLabel = (
  value: string | undefined,
  servers: readonly GameServerSelectOption[],
): string => {
  if (!value) {
    return '';
  }
  const selected = servers.find((server) => server.id === value);
  return selected ? formatGameServerLabel(selected) : '';
};

export type ResolvedGameServerInput =
  | { action: 'select'; serverId: string }
  | { action: 'clear' }
  | { action: 'revert' };

export const resolveGameServerInput = (
  input: string,
  servers: readonly GameServerSelectOption[],
): ResolvedGameServerInput => {
  const trimmed = input.trim();
  if (trimmed.length === 0) {
    return { action: 'clear' };
  }

  const matched =
    servers.find((server) => formatGameServerLabel(server) === trimmed) ??
    servers.find((server) => server.name === trimmed) ??
    servers.find((server) => server.alias.includes(trimmed));
  if (matched) {
    return { action: 'select', serverId: matched.id };
  }

  return { action: 'revert' };
};
