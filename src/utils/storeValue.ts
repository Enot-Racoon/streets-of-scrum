export default function storeValue<T extends string = string>(key: string) {
  return (value?: T): T | null =>
    value === undefined
      ? ((localStorage.getItem(key) ?? null) as T)
      : ((localStorage.setItem(key, value), value) as T);
}
