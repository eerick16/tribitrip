import { useEffect, useState } from "react";
import { api } from "./api";

export function useApiData(path, revision = 0) {
  const [result, setResult] = useState(null);
  useEffect(() => {
    if (!path) return;
    let active = true;
    api(path)
      .then((data) => {
        if (active) setResult({ path, revision, data });
      })
      .catch((error) => {
        if (active) setResult({ path, revision, error: error.message });
      });
    return () => {
      active = false;
    };
  }, [path, revision]);
  return result?.path === path && result.revision === revision ? result : {};
}
