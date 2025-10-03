"use client";

interface VectorListProps {
  vectorIds: string[];
  namespace: string;
  isLoading?: boolean;
}

export function VectorList({
  vectorIds,
  namespace,
  isLoading,
}: VectorListProps) {
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
        <span className="text-sm text-gray-600">
          {vectorIds.length} vector{vectorIds.length !== 1 ? "s" : ""} found
        </span>
      </div>

      <div className="max-h-96 space-y-2 overflow-y-auto">
        {vectorIds.map((vectorId, index) => (
          <div
            key={vectorId}
            className="rounded-lg border border-gray-200 p-3 hover:bg-gray-50"
          >
            <div className="flex items-center">
              <span className="mr-3 text-sm text-gray-500">#{index + 1}</span>
              <code className="font-mono text-sm text-gray-900">{vectorId}</code>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
