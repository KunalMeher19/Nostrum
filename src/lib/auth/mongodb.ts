// Shared MongoClient for Auth.js adapter + credential lookups.
// Singleton across HMR reloads in dev (standard Next.js pattern).
import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
if (!uri) {
  throw new Error("Missing MONGODB_URI environment variable (see .env.example)");
}

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === "development") {
  if (!global._mongoClientPromise) {
    global._mongoClientPromise = new MongoClient(uri).connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  clientPromise = new MongoClient(uri).connect();
}

export default clientPromise;

/** Convenience: the app database (name comes from the connection string). */
export async function getDb() {
  const client = await clientPromise;
  return client.db();
}
