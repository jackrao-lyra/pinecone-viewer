# Pinecone Viewer

View your Pinecone vector database namespaces and vectors with only an API key

## Prerequisites

- Node.js 20+ and npm
- Postgresql
- A Pinecone API key with access to the target index

## Quick Start

1. Install dependencies

```bash
npm install
```

2. Environment variables

Minimum required variables:

```bash
NODE_ENV=development
DATABASE_URL=<your-postgresql-url>
PINECONE_KEY=<your-pinecone-api-key>
PINECONE_INDEX=<your-index-name>
```

4. Initialize the database (Prisma)

```bash
npm run db:push     
```

5. Run the app (dev on port 3009)

```bash
npm run dev
```

Open `http://localhost:3009`.

## Environment Variables

- `NODE_ENV`: typically `development` for local.
- `DATABASE_URL`: Postgres connection string. The helper script expects the standard Postgres format, for example `postgresql://user@localhost:5432/pinecone-viewer`.
- `PINECONE_KEY`: Your Pinecone API key.
- `PINECONE_INDEX`: The Pinecone index to inspect.
 
## Using the App

1. Ensure `PINECONE_KEY` and `PINECONE_INDEX` are set and valid.
2. Start the app (`npm run dev`).
3. In the UI:
   - Left panel lists Pinecone namespaces.
   - Select a namespace to see vectors.
   - Select a vector to inspect its values and metadata.
