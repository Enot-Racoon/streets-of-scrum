export default function storeValue<T = string>(
  key: string,
  encode: (value: T) => string = String,
  decode: (value: string) => T = (v) => v as T,
) {
  function accessor(): T | null;
  function accessor(value: T): T;

  function accessor(value?: T) {
    if (arguments.length === 0) {
      const raw = localStorage.getItem(key);
      return raw === null ? null : decode(raw);
    }

    localStorage.setItem(key, encode(value!));

    return value;
  }

  return accessor;
}
