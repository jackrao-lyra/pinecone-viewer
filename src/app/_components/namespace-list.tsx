"use client";

import { api } from "~/trpc/react";

interface NamespaceListProps {
  namespaces: string[];
  selectedNamespace: string;
  onNamespaceSelect: (namespace: string) => void;
  isLoading?: boolean;
}

export function NamespaceList({
  namespaces,
  selectedNamespace,
  onNamespaceSelect,
  isLoading,
}: NamespaceListProps) {
  const { data: starredNamespaces } = api.starredNamespaces.list.useQuery();
  const utils = api.useUtils();

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

  // Sort namespaces: starred first, then alphabetically
  const starredSet = new Set(starredNamespaces?.starredNamespaces ?? []);
  const sortedNamespaces = [...namespaces].sort((a, b) => {
    const aStarred = starredSet.has(a);
    const bStarred = starredSet.has(b);

    if (aStarred && !bStarred) return -1;
    if (!aStarred && bStarred) return 1;

    return a.localeCompare(b);
  });

  return (
    <div className="rounded-lg bg-white p-6 shadow-md">
      <div className="mb-4">
        <h3 className="text-xl font-semibold text-gray-800">Namespaces</h3>
        <p className="text-sm text-gray-600">
          {namespaces.length} namespace{namespaces.length !== 1 ? "s" : ""}{" "}
          found
        </p>
      </div>

      <div className="max-h-96 space-y-2 overflow-y-auto">
        {sortedNamespaces.map((namespace) => {
          const isStarred = starredSet.has(namespace);
          return (
            <div
              key={namespace}
              className={`w-full rounded-lg border p-3 transition-colors ${
                selectedNamespace === namespace
                  ? "border-blue-500 bg-blue-50 text-blue-900"
                  : "border-gray-200 hover:bg-gray-50"
              }`}
            >
              <div className="flex items-center justify-between">
                <button
                  onClick={() => onNamespaceSelect(namespace)}
                  className="flex-1 text-left"
                >
                  <code className="font-mono text-sm">{namespace}</code>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStarToggle(namespace, isStarred);
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
