import { MongoClient } from "mongodb";
import { ensureMongoIndexes } from "./index-definitions";

async function main() {
  const client = new MongoClient(process.env.MONGODB_URI ?? "mongodb://localhost:27017/alfred");
  await client.connect();
  const db = client.db(process.env.MONGODB_DB_NAME ?? "alfred");
  await ensureMongoIndexes(db);
  await client.close();
  console.log("A.L.F.R.E.D. indexes created");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
