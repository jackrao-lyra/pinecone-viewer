import { Pinecone } from "@pinecone-database/pinecone";
import { env } from "~/env.js";

// Pinecone configuration
export const pineconeConfig = {
  apiKey: env.PINECONE_KEY as string,
  indexName: env.PINECONE_INDEX as string,
  maxConcurrency: 5,
};

// Initialize Pinecone client
export const pinecone = new Pinecone({
  apiKey: pineconeConfig.apiKey,
});

export const pineconeIndex = pinecone.index(pineconeConfig.indexName);
