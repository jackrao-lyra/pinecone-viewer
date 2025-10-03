"use client";

import { useState } from "react";
import { NamespaceList } from "~/app/_components/namespace-list";
import { VectorList } from "~/app/_components/vector-list";
import { VectorDetail } from "~/app/_components/vector-detail";
import { api } from "~/trpc/react";

export default function Home() {
  const [selectedNamespace, setSelectedNamespace] = useState<string>("");
  const [selectedVectorId, setSelectedVectorId] = useState<string>("");

  const { data: namespacesData, isLoading: namespacesLoading } =
    api.pinecone.listNamespaces.useQuery();

  const { data: vectorIds, isLoading: vectorsLoading } =
    api.pinecone.listVectorsInNamespace.useQuery(
      { namespace: selectedNamespace },
      { enabled: !!selectedNamespace },
    );

  const handleNamespaceSelect = (namespace: string) => {
    setSelectedNamespace(namespace);
    setSelectedVectorId(""); // Clear selected vector when namespace changes
  };

  const handleVectorSelect = (vectorId: string) => {
    setSelectedVectorId(vectorId);
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="mb-4 text-4xl font-bold text-gray-900">
            Pinecone Viewer
          </h1>
          <p className="text-lg text-gray-600">
            Explore and visualize your Pinecone vector database
          </p>
        </div>

        <div className="mx-auto max-w-none px-4">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Left column - Namespaces */}
            <div className="lg:col-span-4">
              <NamespaceList
                namespaces={namespacesData?.namespaces ?? []}
                selectedNamespace={selectedNamespace}
                onNamespaceSelect={handleNamespaceSelect}
                isLoading={namespacesLoading}
              />
            </div>

            {/* Middle column - Vectors */}
            <div className="lg:col-span-4">
              {selectedNamespace ? (
                <VectorList
                  vectorIds={vectorIds?.vectors ?? []}
                  namespace={selectedNamespace}
                  isLoading={vectorsLoading}
                  selectedVectorId={selectedVectorId}
                  onVectorSelect={handleVectorSelect}
                />
              ) : (
                <div className="rounded-lg bg-white p-6 shadow-md">
                  <h3 className="mb-4 text-xl font-semibold text-gray-800">
                    Select a Namespace
                  </h3>
                  <p className="text-gray-600">
                    Choose a namespace from the left panel to view its vectors.
                  </p>
                </div>
              )}
            </div>

            {/* Right column - Vector Details */}
            <div className="lg:col-span-4">
              <VectorDetail
                vectorId={selectedVectorId}
                namespace={selectedNamespace}
              />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
