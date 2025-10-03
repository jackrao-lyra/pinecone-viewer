"use client";

import { useState } from "react";
import { api } from "~/trpc/react";

interface VectorListProps {
  vectorIds: string[];
  namespace: string;
  isLoading?: boolean;
  selectedVectorId?: string;
  onVectorSelect?: (vectorId: string) => void;
  onVectorsChange?: () => void;
}

export function VectorList({
  vectorIds,
  namespace,
  isLoading,
  selectedVectorId,
  onVectorSelect,
  onVectorsChange,
}: VectorListProps) {
  const [showDeleteAllDialog, setShowDeleteAllDialog] = useState(false);

  const utils = api.useUtils();

  const deleteVectorMutation = api.pinecone.deleteVector.useMutation({
    onMutate: async ({ vectorId, namespace }) => {
      // Cancel any outgoing refetches
      await utils.pinecone.listVectorsInNamespace.cancel({ namespace });

      // Snapshot the previous value
      const previousVectors = utils.pinecone.listVectorsInNamespace.getData({
        namespace,
      });

      // Optimistically update to the new value
      if (previousVectors) {
        utils.pinecone.listVectorsInNamespace.setData(
          { namespace },
          {
            vectors: previousVectors.vectors.filter((id) => id !== vectorId),
          },
        );
      }

      // Return a context object with the snapshotted value
      return { previousVectors };
    },
    onError: (err, variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousVectors) {
        utils.pinecone.listVectorsInNamespace.setData(
          { namespace: variables.namespace },
          context.previousVectors,
        );
      }
    },
    onSettled: (data, error, variables) => {
      // Always refetch after error or success to ensure consistency
      void utils.pinecone.listVectorsInNamespace.invalidate({
        namespace: variables.namespace,
      });
    },
  });

  const deleteAllVectorsMutation = api.pinecone.deleteAllVectors.useMutation({
    onSuccess: () => {
      setShowDeleteAllDialog(false);
      onVectorsChange?.();
    },
  });

  const handleDeleteVector = (vectorId: string) => {
    deleteVectorMutation.mutate({
      namespace,
      vectorId,
    });
  };

  const handleDeleteAll = () => {
    deleteAllVectorsMutation.mutate({
      namespace,
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

  if (vectorIds.length === 0) {
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
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-xl font-semibold text-gray-800">
          Vectors in &ldquo;{namespace}&rdquo;
        </h3>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">
            {vectorIds.length} vector{vectorIds.length !== 1 ? "s" : ""} found
          </span>
          {vectorIds.length > 0 && (
            <button
              onClick={() => setShowDeleteAllDialog(true)}
              className="rounded-md bg-red-600 px-3 py-1 text-sm text-white transition-colors hover:bg-red-700"
            >
              Delete All
            </button>
          )}
        </div>
      </div>

      <div className="max-h-96 space-y-2 overflow-y-auto">
        {vectorIds.map((vectorId, index) => (
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
                <span className="mr-3 text-sm text-gray-500">#{index + 1}</span>
                <code className="font-mono text-sm">{vectorId}</code>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteVector(vectorId);
                }}
                className="ml-2 rounded p-1 text-red-600 transition-colors hover:bg-red-100 disabled:opacity-50"
                title="Delete vector"
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

      {/* Delete All Confirmation Dialog */}
      {showDeleteAllDialog && (
        <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black">
          <div className="mx-4 w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">
              Delete All Vectors
            </h3>
            <p className="mb-6 text-gray-600">
              Are you sure you want to delete all {vectorIds.length} vectors in
              the &ldquo;{namespace}&rdquo; namespace? This action cannot be
              undone.
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
                {deleteAllVectorsMutation.isPending
                  ? "Deleting..."
                  : "Delete All"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
