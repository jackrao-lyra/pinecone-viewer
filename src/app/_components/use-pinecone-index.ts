"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "pineconeIndex";

export function usePineconeIndex() {
  const [indexName, setIndexName] = useState<string>("");

  useEffect(() => {
    try {
      const saved = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
      if (saved) {
        setIndexName(saved);
      }
    } catch {
      // ignore storage errors
    }
  }, []);

  const updateIndexName = useCallback((name: string) => {
    setIndexName(name);
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY, name);
      }
    } catch {
      // ignore storage errors
    }
  }, []);

  return { indexName, setIndexName: updateIndexName };
}


