import mongoose from "mongoose";

mongoose.set("bufferCommands", false);

export function createDatabaseConnector({ mongooseClient = mongoose, env = process.env } = {}) {
  let connectionPromise = null;
  return async function connectDatabase() {
    if (mongooseClient.connection.readyState === 1) return mongooseClient;
    if (!env.MONGODB_URI) throw new Error("MONGODB_URI is required");
    if (!connectionPromise) {
      connectionPromise = mongooseClient.connect(env.MONGODB_URI, {
        serverSelectionTimeoutMS: 8000,
        connectTimeoutMS: 8000,
        socketTimeoutMS: 20000,
        maxPoolSize: 5,
        retryWrites: false,
        w: "majority",
      }).then((connection) => {
        console.log(`Connected to MongoDB: ${connection.connection.name}`);
        return connection;
      }).catch((error) => {
        connectionPromise = null;
        throw error;
      });
    }
    return connectionPromise;
  };
}

export const connectDatabase = createDatabaseConnector();

export function createDatabaseMiddleware(connect = connectDatabase) {
  return async function databaseMiddleware(req, res, next) {
    try {
      await connect();
      next();
    } catch (error) {
      next(error);
    }
  };
}

export const databaseMiddleware = createDatabaseMiddleware();
