"use client";

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
        <h3 className="mb-4 text-xl font-semibold text-gray-800">
          Namespaces
        </h3>
        <p className="text-gray-600">No namespaces found.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-white p-6 shadow-md">
      <div className="mb-4">
        <h3 className="text-xl font-semibold text-gray-800">Namespaces</h3>
        <p className="text-sm text-gray-600">
          {namespaces.length} namespace{namespaces.length !== 1 ? "s" : ""} found
        </p>
      </div>

      <div className="max-h-96 space-y-2 overflow-y-auto">
        {namespaces.map((namespace) => (
          <button
            key={namespace}
            onClick={() => onNamespaceSelect(namespace)}
            className={`w-full rounded-lg border p-3 text-left transition-colors ${
              selectedNamespace === namespace
                ? "border-blue-500 bg-blue-50 text-blue-900"
                : "border-gray-200 hover:bg-gray-50"
            }`}
          >
            <div className="flex items-center">
              <code className="font-mono text-sm">{namespace}</code>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
