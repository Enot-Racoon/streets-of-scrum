export default function storeValue(key: string) {
  return (value?: string): string | null =>
    value === undefined
      ? (localStorage.getItem(key) ?? null)
      : (localStorage.setItem(key, value), value);
}
