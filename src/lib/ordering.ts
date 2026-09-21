/** sorts by an id array, unlisted items use fallbackCompare */
export function applyOrder<T>(
  items: T[],
  getId: (item: T) => string,
  orderIds: string[] | undefined,
  fallbackCompare: (a: T, b: T) => number
): T[] {
  if (!orderIds || orderIds.length === 0) {
    return [...items].sort(fallbackCompare);
  }
  const rank = new Map(orderIds.map((id, index) => [id, index]));
  const known: T[] = [];
  const unknown: T[] = [];
  for (const item of items) {
    (rank.has(getId(item)) ? known : unknown).push(item);
  }
  known.sort((a, b) => rank.get(getId(a))! - rank.get(getId(b))!);
  unknown.sort(fallbackCompare);
  return [...known, ...unknown];
}
