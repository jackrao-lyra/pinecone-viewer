import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { getPineconeIndex } from "~/config/pinecone";

export async function fetchByIds(indexName: string, subdomain: string, ids: string[]) {
  return getPineconeIndex(indexName).namespace(subdomain).fetch(ids);
}

export async function listPaginated(
  indexName: string,
  subdomain: string,
  options: { paginationToken?: string; limit?: number },
) {
  return getPineconeIndex(indexName).namespace(subdomain).listPaginated(options);
}

interface NamespaceSummary {
  name: string;
  vectorCount: number;
}

async function collectNamespaceNames(indexName: string) {
  const namespaceNames = new Set<string>();
  let currentPage = await getPineconeIndex(indexName).listNamespaces();

  while (currentPage) {
    if (currentPage.namespaces) {
      for (const namespace of currentPage.namespaces) {
        if (namespace?.name) {
          namespaceNames.add(namespace.name);
        }
      }
    }

    if (!currentPage.pagination?.next) {
      break;
    }

    currentPage = await getPineconeIndex(indexName).listNamespaces(
      100,
      currentPage.pagination.next,
    );
  }

  return namespaceNames;
}

export async function getAllNamespaces(indexName: string): Promise<NamespaceSummary[]> {
  const index = getPineconeIndex(indexName);
  const [namespaceNames, stats] = await Promise.all([
    collectNamespaceNames(indexName),
    index.describeIndexStats(),
  ]);

  const namespaces: NamespaceSummary[] = [];
  const statsNamespaces = stats.namespaces ?? {};

  for (const [name, summary] of Object.entries(statsNamespaces)) {
    namespaces.push({
      name,
      vectorCount: summary?.recordCount ?? 0,
    });
    namespaceNames.delete(name);
  }

  for (const name of namespaceNames) {
    namespaces.push({
      name,
      vectorCount: 0,
    });
  }

  return namespaces;
}

export async function getVectorsPage(
  indexName: string,
  subdomain: string,
  options: { paginationToken?: string; limit?: number },
) {
  const page = await listPaginated(indexName, subdomain, options);
  const vectors = (page.vectors ?? [])
    .map((vector) => vector.id)
    .filter((id): id is string => Boolean(id));

  return {
    vectors,
    nextPageToken: page.pagination?.next ?? null,
  };
}

export const pineconeRouter = createTRPCRouter({
  listNamespaces: publicProcedure
    .input(z.object({ indexName: z.string() }))
    .query(async ({ input }) => {
      try {
        const namespaces = await getAllNamespaces(input.indexName);
        return {
          namespaces,
          totalNamespaces: namespaces.length,
        };
      } catch (error) {
        console.error("Error fetching namespaces:", error);
        throw new Error("Failed to fetch namespaces");
      }
    }),

  deleteVector: publicProcedure
    .input(
      z.object({
        indexName: z.string(),
        namespace: z.string(),
        vectorId: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      try {
        await getPineconeIndex(input.indexName)
          .namespace(input.namespace)
          .deleteOne(input.vectorId);
        return { success: true };
      } catch (error) {
        console.error("Error deleting vector:", error);
        throw new Error("Failed to delete vector");
      }
    }),

  deleteAllVectors: publicProcedure
    .input(
      z.object({
        indexName: z.string(),
        namespace: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      try {
        await getPineconeIndex(input.indexName)
          .namespace(input.namespace)
          .deleteAll();
        return { success: true };
      } catch (error) {
        console.error("Error deleting all vectors:", error);
        throw new Error("Failed to delete all vectors");
      }
    }),

  listVectorsInNamespace: publicProcedure
    .input(
      z.object({
        indexName: z.string(),
        namespace: z.string(),
        paginationToken: z.string().optional(),
        limit: z.number().min(1).max(100).optional(),
      }),
    )
    .query(async ({ input }) => {
      const { indexName, namespace, paginationToken, limit } = input;
      const vectorsPage = await getVectorsPage(indexName, namespace, {
        paginationToken,
        limit,
      });

      return vectorsPage;
    }),

  fetchVector: publicProcedure
    .input(
      z.object({
        indexName: z.string(),
        namespace: z.string(),
        vectorId: z.string(),
      }),
    )
    .query(async ({ input }) => {
      try {
        const result = await fetchByIds(
          input.indexName,
          input.namespace,
          [input.vectorId],
        );
        const record = result.records[input.vectorId];
        if (!record) {
          return {
            stringified: "not found",
          };
        }

        const formattedRecord = {
          id: record.id,
          metadata: record.metadata,
          values: record.values,
          sparseValues: record.sparseValues,
        };

        // const fs = require("fs");
        // fs.writeFileSync("formattedRecord.json", JSON.stringify(formattedRecord, null, 2));
        return {
          stringified: JSON.stringify(formattedRecord, null, 2),
        };
      } catch (error) {
        console.error("Error fetching vector:", error);
        throw new Error("Failed to fetch vector");
      }
    }),
});
