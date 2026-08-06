// Shared MongoClient for Auth.js adapter + credential lookups.
// Singleton across HMR reloads in dev (standard Next.js pattern).
// Lazy: the client is only created (and MONGODB_URI only required) on
// first use, so `next build` can collect page data without a database.
import { MongoClient } from "mongodb";

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

let clientPromise: Promise<MongoClient> | undefined;

export function getClientPromise(): Promise<MongoClient> {
  if (process.env.NODE_ENV === "development") {
    if (!global._mongoClientPromise) {
      global._mongoClientPromise = new MongoClient(requireUri()).connect();
    }
    return global._mongoClientPromise;
  }
  if (!clientPromise) {
    clientPromise = new MongoClient(requireUri()).connect();
  }
  return clientPromise;
}

function requireUri(): string {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("Missing MONGODB_URI environment variable (see .env.example)");
  }
  return uri;
}

/** Convenience: the app database (name comes from the connection string). */
export async function getDb() {
  const client = await getClientPromise();
  return client.db();
}
