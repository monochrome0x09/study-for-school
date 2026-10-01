import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";

/** 화면이 포커스를 얻을 때마다 load를 다시 실행한다. 값이 없으면 data는 undefined. */
export function useFocusLoad<T>(load: () => Promise<T>) {
  const [data, setData] = useState<T | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      setData(await load());
      setError(null);
    } catch (e) {
      setError(String(e));
    }
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );

  return { data, error, reload };
}
