export default function rand(a: number, b?: number): number {
  if (b) {
    return Math.random() * (b - a) + a;
  }
  return Math.random() * a;
}
