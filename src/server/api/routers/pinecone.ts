import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { pineconeIndex } from "~/config/pinecone";

export async function fetchByIds(subdomain: string, ids: string[]) {
  return pineconeIndex.namespace(subdomain).fetch(ids);
}
export async function listPaginated(
  subdomain: string,
  options: { paginationToken?: string; limit?: number },
) {
  return pineconeIndex.namespace(subdomain).listPaginated(options);
}

export async function getAllVectors(subdomain: string) {
  const allVectors: string[] = [];

  let currentPage = await listPaginated(subdomain, {});

  while (currentPage) {
    if (currentPage.vectors) {
      for (const vectorItem of currentPage.vectors) {
        if (vectorItem.id) {
          allVectors.push(vectorItem.id);
        }
      }
    }

    if (!currentPage.pagination?.next) {
      break;
    }

    currentPage = await listPaginated(subdomain, {
      paginationToken: currentPage.pagination.next,
    });
  }

  return allVectors;
}

export const pineconeRouter = createTRPCRouter({
  listNamespaces: publicProcedure.query(async () => {
    try {
      const stats = await pineconeIndex.describeIndexStats();
      const namespaces = Object.keys(stats.namespaces ?? {});
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
        namespace: z.string(),
        vectorId: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      try {
        await pineconeIndex
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
        namespace: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      try {
        await pineconeIndex.namespace(input.namespace).deleteAll();
        return { success: true };
      } catch (error) {
        console.error("Error deleting all vectors:", error);
        throw new Error("Failed to delete all vectors");
      }
    }),

  listVectorsInNamespace: publicProcedure
    .input(
      z.object({
        namespace: z.string(),
      }),
    )
    .query(async ({ input }) => {
      const vectors = await getAllVectors(input.namespace);

      return {
        vectors,
      };
    }),

  fetchVector: publicProcedure
    .input(
      z.object({
        namespace: z.string(),
        vectorId: z.string(),
      }),
    )
    .query(async ({ input }) => {
      try {
        const result = await fetchByIds(input.namespace, [input.vectorId]);
        const record = result.records[input.vectorId];
        if (!record) {
          throw new Error("Vector not found");
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
