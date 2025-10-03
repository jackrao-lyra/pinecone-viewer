import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { db } from "~/server/db";

export const starredNamespacesRouter = createTRPCRouter({
  list: publicProcedure
    .query(async () => {
      try {
        const starredNamespaces = await db.starredNamespace.findMany({
          orderBy: { createdAt: "asc" },
        });
        return {
          starredNamespaces: starredNamespaces.map(sn => sn.namespace),
        };
      } catch (error) {
        console.error("Error fetching starred namespaces:", error);
        throw new Error("Failed to fetch starred namespaces");
      }
    }),

  star: publicProcedure
    .input(z.object({ namespace: z.string() }))
    .mutation(async ({ input }) => {
      try {
        await db.starredNamespace.create({
          data: { namespace: input.namespace },
        });
        return { success: true };
      } catch (error) {
        console.error("Error starring namespace:", error);
        throw new Error("Failed to star namespace");
      }
    }),

  unstar: publicProcedure
    .input(z.object({ namespace: z.string() }))
    .mutation(async ({ input }) => {
      try {
        await db.starredNamespace.delete({
          where: { namespace: input.namespace },
        });
        return { success: true };
      } catch (error) {
        console.error("Error unstarring namespace:", error);
        throw new Error("Failed to unstar namespace");
      }
    }),

  isStarred: publicProcedure
    .input(z.object({ namespace: z.string() }))
    .query(async ({ input }) => {
      try {
        const starred = await db.starredNamespace.findUnique({
          where: { namespace: input.namespace },
        });
        return { isStarred: !!starred };
      } catch (error) {
        console.error("Error checking if namespace is starred:", error);
        throw new Error("Failed to check starred status");
      }
    }),
});

