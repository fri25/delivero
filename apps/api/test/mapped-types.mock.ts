export function OmitType<T>(classRef: new () => T, _keys: readonly any[]) {
  return class extends (classRef as any) {};
}

export function PickType<T>(classRef: new () => T, _keys: readonly any[]) {
  return class extends (classRef as any) {};
}

export function PartialType<T>(classRef: new () => T) {
  return class extends (classRef as any) {};
}

export function IntersectionType<A, B>(
  classRefA: new () => A,
  _classRefB: new () => B,
) {
  return class extends (classRefA as any) {};
}
