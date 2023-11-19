export type Mark<S extends symbol> = Record<S, S>;
export type Marked<S extends symbol, O> = Mark<S> & O;

export function isMarked<S extends symbol>(
  sym: S,
  obj: unknown,
): obj is Mark<S> {
  return (
    (typeof obj === 'object' || typeof obj === 'function') &&
    obj !== null &&
    obj !== undefined &&
    sym in obj
  );
}

export function mark<S extends symbol, O>(sym: S, obj: O): Marked<S, O> {
  const newObj = obj as Mark<S>;
  newObj[sym] = sym;
  return newObj as Marked<S, O>;
}
