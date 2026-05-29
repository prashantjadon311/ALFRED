export const mongodbConfig = () => ({
  uri: process.env.MONGODB_URI ?? "mongodb://localhost:27017/alfred",
  dbName: process.env.MONGODB_DB_NAME ?? "alfred"
});
