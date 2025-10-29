"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "~/trpc/react";
import { usePineconeIndex } from "~/app/_components/use-pinecone-index";
import { useScrollRestoration } from "~/app/_components/use-scroll-restoration";

interface VectorListProps {
  namespace: string;
  totalCount?: number;
  selectedVectorId?: string;
  onVectorSelect?: (vectorId: string) => void;
}

const PAGE_SIZE = 50;
const EMPTY_QUERY_INPUT = {
  indexName: "",
  namespace: "",
  limit: PAGE_SIZE,
} as const;
const numberFormatter = new Intl.NumberFormat();

export function VectorList({
  namespace,
  totalCount,
  selectedVectorId,
  onVectorSelect,
}: VectorListProps) {
  const [showDeleteAllDialog, setShowDeleteAllDialog] = useState(false);
  const [paginationToken, setPaginationToken] = useState<string | undefined>();
  const [previousTokens, setPreviousTokens] = useState<(string | undefined)[]>([]);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);

  const utils = api.useUtils();
  const { indexName } = usePineconeIndex();
  const scrollStorageKey = useMemo(
    () => `pinecone:vectorList:${indexName ?? "_"}:${namespace || "__none__"}`,
    [indexName, namespace],
  );

  const resetPagination = useCallback(() => {
    setPaginationToken(undefined);
    setPreviousTokens([]);
    setCurrentPageIndex(0);
  }, []);

  useEffect(() => {
    resetPagination();
  }, [namespace, indexName, resetPagination]);

  const queryInput = useMemo(() => {
    if (!indexName || !namespace) {
      return null;
    }

    const base = {
      indexName,
      namespace,
      limit: PAGE_SIZE,
    } as const;

    return paginationToken ? { ...base, paginationToken } : base;
  }, [indexName, namespace, paginationToken]);

  const vectorsQuery = api.pinecone.listVectorsInNamespace.useQuery(
    queryInput ?? EMPTY_QUERY_INPUT,
    {
      enabled: Boolean(queryInput),
      keepPreviousData: true,
    },
  );

  const { data, isLoading, isFetching } = vectorsQuery;
  const scrollContainerRef = useScrollRestoration(scrollStorageKey, [data?.vectors?.length ?? 0]);
  const vectors = data?.vectors ?? [];
  const hasNextPage = Boolean(data?.nextPageToken);
  const hasPreviousPage = previousTokens.length > 0;

  const resolvedTotalCount = useMemo(() => {
    if (typeof totalCount === "number") {
      return totalCount;
    }

    if (!hasNextPage) {
      return vectors.length + currentPageIndex * PAGE_SIZE;
    }

    return undefined;
  }, [totalCount, hasNextPage, vectors.length, currentPageIndex]);

  const pageStartIndex = currentPageIndex * PAGE_SIZE;
  const visibleRangeStart = vectors.length > 0 ? pageStartIndex + 1 : 0;
  const visibleRangeEnd = pageStartIndex + vectors.length;

  const deleteVectorMutation = api.pinecone.deleteVector.useMutation({
    onMutate: async ({ vectorId }) => {
      if (!queryInput) {
        return { previousVectors: undefined };
      }

      await utils.pinecone.listVectorsInNamespace.cancel(queryInput);

      const previousVectors = utils.pinecone.listVectorsInNamespace.getData(queryInput);

      if (previousVectors) {
        utils.pinecone.listVectorsInNamespace.setData(queryInput, {
          ...previousVectors,
          vectors: previousVectors.vectors.filter((id) => id !== vectorId),
        });
      }

      return { previousVectors };
    },
    onError: (_err, _variables, context) => {
      if (!queryInput || !context?.previousVectors) {
        return;
      }

      utils.pinecone.listVectorsInNamespace.setData(queryInput, context.previousVectors);
    },
    onSettled: async () => {
      if (queryInput) {
        await utils.pinecone.listVectorsInNamespace.invalidate(queryInput);
      }

      if (indexName) {
        await utils.pinecone.listNamespaces.invalidate({ indexName });
      }
    },
  });

  const deleteAllVectorsMutation = api.pinecone.deleteAllVectors.useMutation({
    onMutate: async () => {
      if (!queryInput) {
        return { previousVectors: undefined };
      }

      await utils.pinecone.listVectorsInNamespace.cancel(queryInput);

      const previousVectors = utils.pinecone.listVectorsInNamespace.getData(queryInput);

      if (previousVectors) {
        utils.pinecone.listVectorsInNamespace.setData(queryInput, {
          ...previousVectors,
          vectors: [],
        });
      }

      return { previousVectors };
    },
    onSuccess: async () => {
      setShowDeleteAllDialog(false);
      resetPagination();

      if (queryInput) {
        await utils.pinecone.listVectorsInNamespace.invalidate(queryInput);
      }

      if (indexName) {
        await utils.pinecone.listNamespaces.invalidate({ indexName });
      }
    },
    onError: (_err, _variables, context) => {
      if (!queryInput || !context?.previousVectors) {
        return;
      }

      utils.pinecone.listVectorsInNamespace.setData(queryInput, context.previousVectors);
    },
  });

  const handleDeleteVector = (vectorId: string) => {
    if (!indexName || !namespace) {
      return;
    }

    deleteVectorMutation.mutate({
      indexName,
      namespace,
      vectorId,
    });
  };

  const handleDeleteAll = () => {
    if (!indexName || !namespace) {
      return;
    }

    deleteAllVectorsMutation.mutate({
      indexName,
      namespace,
    });
  };

  const goToNextPage = () => {
    if (!data?.nextPageToken) {
      return;
    }

    setPreviousTokens((prev) => [...prev, paginationToken]);
    setPaginationToken(data.nextPageToken ?? undefined);
    setCurrentPageIndex((prev) => prev + 1);
  };

  const goToPreviousPage = () => {
    setPreviousTokens((prev) => {
      if (prev.length === 0) {
        return prev;
      }

      const nextTokens = [...prev];
      const previousToken = nextTokens.pop();

      setPaginationToken(previousToken);
      setCurrentPageIndex((index) => Math.max(0, index - 1));

      return nextTokens;
    });
  };

  if (isLoading) {
    return (
      <div className="rounded-lg bg-white p-6 shadow-md">
        <div className="animate-pulse">
          <div className="mb-4 h-6 w-1/4 rounded bg-gray-200"></div>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-4 rounded bg-gray-200"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const isEmpty = vectors.length === 0 && !hasNextPage;

  if (isEmpty) {
    return (
      <div className="rounded-lg bg-white p-6 shadow-md">
        <h3 className="mb-4 text-xl font-semibold text-gray-800">
          Vectors in &ldquo;{namespace}&rdquo;
        </h3>
        <p className="text-gray-600">No vectors found in this namespace.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-white p-6 shadow-md">
      <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-xl font-semibold text-gray-800">
            Vectors in &ldquo;{namespace}&rdquo;
          </h3>
          <p className="text-sm text-gray-600">
            {typeof resolvedTotalCount === "number"
              ? `${numberFormatter.format(resolvedTotalCount)} total vectors`
              : `Showing ${numberFormatter.format(visibleRangeStart)}–${numberFormatter.format(
                  visibleRangeEnd,
                )}${hasNextPage ? "+" : ""}`}
          </p>
        </div>
        <div className="flex items-center gap-4">
          {vectors.length > 0 && (
            <button
              onClick={() => setShowDeleteAllDialog(true)}
              className="rounded-md bg-red-600 px-3 py-1 text-sm text-white transition-colors hover:bg-red-700"
            >
              Delete All
            </button>
          )}
        </div>
      </div>

      <div ref={scrollContainerRef} className="max-h-96 space-y-2 overflow-y-auto">
        {vectors.map((vectorId, index) => (
          <div
            key={vectorId}
            className={`w-full rounded-lg border p-3 transition-colors ${
              selectedVectorId === vectorId
                ? "border-blue-500 bg-blue-50 text-blue-900"
                : "border-gray-200 hover:bg-gray-50"
            }`}
          >
            <div className="flex items-center justify-between">
              <button
                onClick={() => onVectorSelect?.(vectorId)}
                className="flex flex-1 items-center text-left"
              >
                <span className="mr-3 text-sm text-gray-500">
                  #{numberFormatter.format(pageStartIndex + index + 1)}
                </span>
                <code className="font-mono text-sm">{vectorId}</code>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteVector(vectorId);
                }}
                className="ml-2 rounded p-1 text-red-600 transition-colors hover:bg-red-100 disabled:opacity-50"
                title="Delete vector"
                disabled={deleteVectorMutation.isPending}
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
        <button
          onClick={goToPreviousPage}
          disabled={!hasPreviousPage || isFetching}
          className="rounded-md border border-gray-200 px-3 py-1 transition-colors enabled:hover:bg-gray-100 disabled:opacity-50"
        >
          Previous
        </button>
        <span>
          Page {currentPageIndex + 1}
          {typeof resolvedTotalCount === "number"
            ? ` • ${numberFormatter.format(visibleRangeStart)}–${numberFormatter.format(
                visibleRangeEnd,
              )} of ${numberFormatter.format(resolvedTotalCount)}`
            : ""}
        </span>
        <button
          onClick={goToNextPage}
          disabled={!hasNextPage || isFetching}
          className="rounded-md border border-gray-200 px-3 py-1 transition-colors enabled:hover:bg-gray-100 disabled:opacity-50"
        >
          Next
        </button>
      </div>

      {showDeleteAllDialog && (
        <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black">
          <div className="mx-4 w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">
              Delete All Vectors
            </h3>
            <p className="mb-6 text-gray-600">
              Are you sure you want to delete all vectors in the &ldquo;{namespace}&rdquo;
              namespace? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteAllDialog(false)}
                className="rounded-md bg-gray-200 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAll}
                disabled={deleteAllVectorsMutation.isPending}
                className="rounded-md bg-red-600 px-4 py-2 text-white transition-colors hover:bg-red-700 disabled:opacity-50"
              >
                {deleteAllVectorsMutation.isPending ? "Deleting..." : "Delete All"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
