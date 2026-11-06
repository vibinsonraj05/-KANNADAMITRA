import "server-only";
import { MongoClient, type Db } from "mongodb";

const globalMongo = globalThis as typeof globalThis & { kannadaMongo?: { client: MongoClient; db: Promise<Db> } };
export async function getDb(): Promise<Db> {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("Set MONGODB_URI to your MongoDB Atlas connection string.");
  let connection = globalMongo.kannadaMongo;
  if (!connection) {
    const client = new MongoClient(uri, { maxPoolSize: 10, serverSelectionTimeoutMS: 2500 });
    const db = client.connect().then(() => client.db(process.env.MONGODB_DB || "kannada_mitra"));
    connection = { client, db };
    globalMongo.kannadaMongo = connection;
    void db.catch(async () => {
      if (globalMongo.kannadaMongo !== connection) return;
      delete globalMongo.kannadaMongo;
      try {
        await client.close();
      } catch (closeError) {
        console.error("Failed to close MongoDB client after connection failure", closeError);
      }
    });
  }
  return connection.db;
}
