/** Value guaranteed not to be `undefined`. */
type Defined<T> = Exclude<T, undefined>;

/**
 * Subset of `T` after dropping `IgnoreKey`.
 * Every included property is optional (may be omitted), but its value is `Defined`.
 */
export type PickDefinedProperties<T, IgnoreKey extends keyof T = never> = {
  [Key in Exclude<keyof T, IgnoreKey>]?: Defined<T[Key]>;
};

/**
 * Pick entries from `obj` whose key is not in `ignoreKeys`
 * and whose value is not `undefined`.
 */
export const pickDefinedProperties = <
  T extends object,
  IgnoreKey extends keyof T = never,
>(
  obj: T,
  ignoreKeys: readonly IgnoreKey[] = [],
): PickDefinedProperties<T, IgnoreKey> => {
  const ignored = new Set<PropertyKey>(ignoreKeys);
  const result: Record<string, unknown> = {};

  for (const key of Object.keys(obj) as (keyof T & string)[]) {
    if (ignored.has(key)) {
      continue;
    }

    const value = obj[key];
    if (value !== undefined) {
      result[key] = value;
    }
  }

  return result as PickDefinedProperties<T, IgnoreKey>;
};
