"use client";

import { api } from "~/trpc/react";

interface VectorDetailProps {
  vectorId: string;
  namespace: string;
}

export function VectorDetail({ vectorId, namespace }: VectorDetailProps) {
  const {
    data: vectorData,
    isLoading,
    error,
  } = api.pinecone.fetchVector.useQuery(
    { namespace, vectorId },
    { enabled: !!vectorId && !!namespace },
  );
  if (isLoading) {
    return (
      <div className="rounded-lg bg-white p-6 shadow-md">
        <div className="animate-pulse">
          <div className="mb-4 h-6 w-1/3 rounded bg-gray-200"></div>
          <div className="space-y-3">
            <div className="h-4 rounded bg-gray-200"></div>
            <div className="h-4 rounded bg-gray-200"></div>
            <div className="h-32 rounded bg-gray-200"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-white p-6 shadow-md">
        <h3 className="mb-4 text-xl font-semibold text-gray-800">
          Vector Details
        </h3>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-red-600">Error loading vector: {error.message}</p>
        </div>
      </div>
    );
  }

  if (!vectorId) {
    return (
      <div className="rounded-lg bg-white p-6 shadow-md">
        <h3 className="mb-4 text-xl font-semibold text-gray-800">
          Vector Details
        </h3>
        <p className="text-gray-600">Select a vector to view its details.</p>
      </div>
    );
  }

  if (!vectorData) {
    return (
      <div className="rounded-lg bg-white p-6 shadow-md">
        <h3 className="mb-4 text-xl font-semibold text-gray-800">
          Vector Details
        </h3>
        <div className="mb-4">
          <p className="text-sm text-gray-600">
            Loading details for vector:{" "}
            <code className="font-mono">{vectorId}</code>
          </p>
        </div>
      </div>
    );
  }

  // Log the raw data for debugging
  console.log("Vector data received:", vectorData);

  return (
    <div className="rounded-lg bg-white p-6 shadow-md">
      <div className="mb-4">
        <h3 className="text-xl font-semibold text-gray-800">Vector Details</h3>
        <p className="text-sm text-gray-600">
          Vector: <code className="font-mono text-xs">{vectorId}</code>
        </p>
        <p className="text-sm text-gray-600">
          Namespace: <code className="font-mono text-xs">{namespace}</code>
        </p>
      </div>

      {/* JSON Data */}
      <div>
        <h4 className="mb-2 font-medium text-gray-700">JSON Data</h4>
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
          <pre className="max-h-96 overflow-y-auto overflow-x-hidden break-words whitespace-pre-wrap text-xs text-gray-800">
            {(vectorData as { stringified?: string })?.stringified ??
              "No data available"}
          </pre>
        </div>
      </div>
    </div>
  );
}
