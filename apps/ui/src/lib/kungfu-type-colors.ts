export type KungfuTypeColor = 'defense' | 'heal' | 'attack';

export const kungfuTypeBadgeClassName = (type: KungfuTypeColor): string => {
  if (type === 'defense') {
    return 'border-transparent bg-red-500 text-white';
  }
  if (type === 'attack') {
    return 'border-transparent bg-blue-500 text-white';
  }
  return 'border-transparent bg-green-500 text-white';
};

export const kungfuTypeTextClassName = (type: KungfuTypeColor): string => {
  if (type === 'defense') {
    return 'text-red-500';
  }
  if (type === 'attack') {
    return 'text-blue-500';
  }
  return 'text-green-500';
};
