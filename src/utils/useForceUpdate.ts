import { useState } from "react";

export default function useForceUpdate() {
  const [, setTick] = useState(0);
  return () => setTick((t) => t + 1);
}
