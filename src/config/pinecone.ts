import { Pinecone } from "@pinecone-database/pinecone";
import { env } from "~/env.js";

// Pinecone configuration
export const pineconeConfig = {
  apiKey: env.PINECONE_KEY as string,
  maxConcurrency: 5,
};

// Initialize Pinecone client
export const pinecone = new Pinecone({
  apiKey: pineconeConfig.apiKey,
});

// Return a Pinecone index instance for the provided index name
export function getPineconeIndex(indexName: string) {
  return pinecone.index(indexName);
}
