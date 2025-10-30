"use client";

import { useCallback, useMemo, useState } from "react";
import { api } from "~/trpc/react";
import { useScrollRestoration } from "~/app/_components/use-scroll-restoration";

interface NamespaceSummary {
  name: string;
  vectorCount: number;
}

interface NamespaceListProps {
  namespaces: NamespaceSummary[];
  selectedNamespace: string;
  onNamespaceSelect: (namespace: string) => void;
  isLoading?: boolean;
}

const numberFormatter = new Intl.NumberFormat();
const SCROLL_STORAGE_KEY = "pinecone:namespaceList:scrollTop";
const SORT_STORAGE_KEY = "pinecone:namespaceList:sort";
type NamespaceSortOption = "alpha" | "vectorAsc" | "vectorDesc";

export function NamespaceList({
  namespaces,
  selectedNamespace,
  onNamespaceSelect,
  isLoading,
}: NamespaceListProps) {
  const { data: starredNamespaces } = api.starredNamespaces.list.useQuery();
  const utils = api.useUtils();
  const [sortOption, setSortOption] = useState<NamespaceSortOption>(() => {
    if (typeof window === "undefined") {
      return "alpha";
    }

    const stored = window.sessionStorage.getItem(SORT_STORAGE_KEY);
    if (stored === "alpha" || stored === "vectorAsc" || stored === "vectorDesc") {
      return stored;
    }

    return "alpha";
  });
  const scrollStorageKey = `${SCROLL_STORAGE_KEY}:${sortOption}`;
  const scrollContainerRef = useScrollRestoration(scrollStorageKey, [
    namespaces.length,
  ]);

  const handleSortChange = useCallback((value: NamespaceSortOption) => {
    setSortOption(value);
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(SORT_STORAGE_KEY, value);
    }
  }, []);

  const starMutation = api.starredNamespaces.star.useMutation({
    onMutate: async ({ namespace }) => {
      // Cancel any outgoing refetches
      await utils.starredNamespaces.list.cancel();

      // Snapshot the previous value
      const previousStarred = utils.starredNamespaces.list.getData();

      // Optimistically update to add the namespace
      if (previousStarred) {
        utils.starredNamespaces.list.setData(undefined, {
          starredNamespaces: [...previousStarred.starredNamespaces, namespace],
        });
      }

      // Return a context object with the snapshotted value
      return { previousStarred };
    },
    onError: (err, variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousStarred) {
        utils.starredNamespaces.list.setData(
          undefined,
          context.previousStarred,
        );
      }
    },
    onSettled: () => {
      // Always refetch after error or success to ensure consistency
      void utils.starredNamespaces.list.invalidate();
    },
  });

  const unstarMutation = api.starredNamespaces.unstar.useMutation({
    onMutate: async ({ namespace }) => {
      // Cancel any outgoing refetches
      await utils.starredNamespaces.list.cancel();

      // Snapshot the previous value
      const previousStarred = utils.starredNamespaces.list.getData();

      // Optimistically update to remove the namespace
      if (previousStarred) {
        utils.starredNamespaces.list.setData(undefined, {
          starredNamespaces: previousStarred.starredNamespaces.filter(
            (ns) => ns !== namespace,
          ),
        });
      }

      // Return a context object with the snapshotted value
      return { previousStarred };
    },
    onError: (err, variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousStarred) {
        utils.starredNamespaces.list.setData(
          undefined,
          context.previousStarred,
        );
      }
    },
    onSettled: () => {
      // Always refetch after error or success to ensure consistency
      void utils.starredNamespaces.list.invalidate();
    },
  });

  const handleStarToggle = (namespace: string, isStarred: boolean) => {
    if (isStarred) {
      unstarMutation.mutate({ namespace });
    } else {
      starMutation.mutate({ namespace });
    }
  };

  const starredSet = useMemo(
    () => new Set(starredNamespaces?.starredNamespaces ?? []),
    [starredNamespaces?.starredNamespaces],
  );

  const sortedNamespaces = useMemo(() => {
    const sorted = [...namespaces].sort((a, b) => {
      if (sortOption === "vectorAsc") {
        if (a.vectorCount !== b.vectorCount) {
          return a.vectorCount - b.vectorCount;
        }
      }

      if (sortOption === "vectorDesc") {
        if (a.vectorCount !== b.vectorCount) {
          return b.vectorCount - a.vectorCount;
        }
      }

      return a.name.localeCompare(b.name);
    });

    const starredList = sorted.filter((namespace) => starredSet.has(namespace.name));
    const regularList = sorted.filter((namespace) => !starredSet.has(namespace.name));

    return [...starredList, ...regularList];
  }, [namespaces, sortOption, starredSet]);

  if (isLoading) {
    return (
      <div className="rounded-lg bg-white p-6 shadow-md">
        <div className="animate-pulse">
          <div className="mb-4 h-6 w-1/2 rounded bg-gray-200"></div>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-8 rounded bg-gray-200"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (namespaces.length === 0) {
    return (
      <div className="rounded-lg bg-white p-6 shadow-md">
        <h3 className="mb-4 text-xl font-semibold text-gray-800">Namespaces</h3>
        <p className="text-gray-600">No namespaces found.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-white p-6 shadow-md">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-xl font-semibold text-gray-800">Namespaces</h3>
          <p className="text-sm text-gray-600">
            {namespaces.length} namespace{namespaces.length !== 1 ? "s" : ""}{" "}
            found
          </p>
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-600">
          <span>Sort by</span>
          <select
            value={sortOption}
            onChange={(event) =>
              handleSortChange(event.target.value as NamespaceSortOption)
            }
            className="rounded-md border border-gray-300 bg-white px-2 py-1 text-sm text-gray-700 transition-shadow focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="alpha">Alphabetical (A→Z)</option>
            <option value="vectorAsc">Vector count (low→high)</option>
            <option value="vectorDesc">Vector count (high→low)</option>
          </select>
        </label>
      </div>

      <div
        ref={scrollContainerRef}
        className="max-h-96 space-y-2 overflow-y-auto"
      >
        {sortedNamespaces.map((namespace) => {
          const isStarred = starredSet.has(namespace.name);
          return (
            <div
              key={namespace.name}
              className={`w-full rounded-lg border p-3 transition-colors ${
                selectedNamespace === namespace.name
                  ? "border-blue-500 bg-blue-50 text-blue-900"
                  : "border-gray-200 hover:bg-gray-50"
              }`}
            >
              <div className="flex items-center justify-between">
                <button
                  onClick={() => onNamespaceSelect(namespace.name)}
                  className="flex-1 text-left"
                >
                  <div className="flex flex-col">
                    <code className="font-mono text-sm">{namespace.name}</code>
                    <span className="text-xs text-gray-500">
                      {numberFormatter.format(namespace.vectorCount)} vector
                      {namespace.vectorCount !== 1 ? "s" : ""}
                    </span>
                  </div>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStarToggle(namespace.name, isStarred);
                  }}
                  className="ml-2 rounded p-1 transition-colors hover:bg-gray-200"
                  title={isStarred ? "Unstar namespace" : "Star namespace"}
                >
                  <span
                    className={`text-lg ${isStarred ? "text-yellow-500" : "text-gray-400"}`}
                  >
                    {isStarred ? "★" : "☆"}
                  </span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
