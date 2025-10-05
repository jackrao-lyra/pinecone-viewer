"use client";

import { useRouter } from "next/navigation";
import { NamespaceList } from "~/app/_components/namespace-list";
import { VectorList } from "~/app/_components/vector-list";
import { VectorDetail } from "~/app/_components/vector-detail";
import { api } from "~/trpc/react";
import { use } from "react";

interface PageParams {
  namespace: string;
  vector: string;
}

export default function VectorPage({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const router = useRouter();

  const { namespace, vector } = use(params);
  const selectedNamespace = decodeURIComponent(namespace);
  const selectedVectorId = decodeURIComponent(vector);

  const { data: namespacesData, isLoading: namespacesLoading } =
    api.pinecone.listNamespaces.useQuery();

  const { data: vectorIds, isLoading: vectorsLoading } =
    api.pinecone.listVectorsInNamespace.useQuery(
      { namespace: selectedNamespace },
      { enabled: !!selectedNamespace },
    );

  const navigate = (namespace: string, vector = "") => {
    if (namespace && vector) {
      router.push(
        `/${encodeURIComponent(namespace)}/${encodeURIComponent(vector)}`,
      );
    } else if (namespace) {
      router.push(`/${encodeURIComponent(namespace)}`);
    } else {
      router.push("/");
    }
  };

  const handleNamespaceSelect = (namespace: string) => {
    navigate(namespace); // Clear vector when namespace changes
  };

  const handleVectorSelect = (vectorId: string) => {
    navigate(selectedNamespace, vectorId);
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
              <VectorList
                vectorIds={vectorIds?.vectors ?? []}
                namespace={selectedNamespace}
                isLoading={vectorsLoading}
                selectedVectorId={selectedVectorId}
                onVectorSelect={handleVectorSelect}
              />
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
