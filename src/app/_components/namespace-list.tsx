"use client";

import { useMemo } from "react";
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

export function NamespaceList({
  namespaces,
  selectedNamespace,
  onNamespaceSelect,
  isLoading,
}: NamespaceListProps) {
  const { data: starredNamespaces } = api.starredNamespaces.list.useQuery();
  const utils = api.useUtils();
  const scrollContainerRef = useScrollRestoration(SCROLL_STORAGE_KEY, [
    namespaces.length,
  ]);

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
    return [...namespaces].sort((a, b) => {
      const aStarred = starredSet.has(a.name);
      const bStarred = starredSet.has(b.name);

      if (aStarred && !bStarred) return -1;
      if (!aStarred && bStarred) return 1;

      return a.name.localeCompare(b.name);
    });
  }, [namespaces, starredSet]);

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
      <div className="mb-4">
        <h3 className="text-xl font-semibold text-gray-800">Namespaces</h3>
        <p className="text-sm text-gray-600">
          {namespaces.length} namespace{namespaces.length !== 1 ? "s" : ""}{" "}
          found
        </p>
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
