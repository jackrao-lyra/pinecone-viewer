"use client";

import { useState, useEffect } from "react";
import { usePineconeIndex } from "~/app/_components/use-pinecone-index";

export function IndexInput({ compact = false }: { compact?: boolean }) {
  const { indexName, setIndexName } = usePineconeIndex();
  const [draft, setDraft] = useState<string>("");

  useEffect(() => {
    setDraft(indexName ?? "");
  }, [indexName]);

  return (
    <div className={compact ? "flex items-center gap-2" : "bg-white rounded-lg shadow-md p-4"}>
      {!compact && (
        <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="indexName">
          Pinecone Index
        </label>
      )}
      <input
        id="indexName"
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder="Enter Pinecone index name"
        className={
          compact
            ? "px-2 py-1 border border-gray-300 rounded-md text-sm"
            : "w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        }
      />
      <button
        type="button"
        onClick={() => setIndexName(draft.trim())}
        disabled={!draft.trim()}
        className={
          compact
            ? "px-2 py-1 bg-blue-600 text-white rounded-md text-sm disabled:opacity-50"
            : "mt-2 w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        }
      >
        {compact ? "Set" : "Save Index"}
      </button>
    </div>
  );
}


