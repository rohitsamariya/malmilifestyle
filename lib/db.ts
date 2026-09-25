import mongoose from "mongoose";

export const LOCAL_MONGODB_URI = "mongodb://127.0.0.1:27017/malmi_lifestyle";

interface MongooseCache {
  conn: mongoose.Mongoose | null;
  promise: Promise<mongoose.Mongoose> | null;
}

declare global {
  var mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = globalThis.mongooseCache || {
  conn: null,
  promise: null,
};

if (!globalThis.mongooseCache) {
  globalThis.mongooseCache = cached;
}

function isLocalMongoUri(uri: string): boolean {
  try {
    const url = new URL(uri);
    return ["127.0.0.1", "localhost", "::1"].includes(url.hostname);
  } catch {
    return false;
  }
}

export function resolveMongoUri(override?: string): string {
  const uri = override || process.env.MONGODB_URI;

  if (!uri) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("MONGODB_URI is required in production.");
    }
    return LOCAL_MONGODB_URI;
  }

  if (
    process.env.NODE_ENV !== "production" &&
    !isLocalMongoUri(uri) &&
    process.env.ALLOW_REMOTE_MONGODB !== "true"
  ) {
    throw new Error(
      "Remote MongoDB connections are disabled in development. Set ALLOW_REMOTE_MONGODB=true explicitly to enable them."
    );
  }

  return uri;
}

export async function connectToDatabase(override?: string): Promise<mongoose.Mongoose> {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const uri = resolveMongoUri(override);
    cached.promise = mongoose
      .connect(uri, {
        bufferCommands: false,
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 10000,
      })
      .then((connection) => connection);
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null;
    throw error;
  }

  return cached.conn;
}

export async function createIsolatedDatabaseConnection(
  uri: string,
): Promise<mongoose.Connection> {
  if (!uri) {
    throw new Error("A MongoDB connection string is required.");
  }

  return mongoose.createConnection(uri, {
    bufferCommands: false,
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 10000,
  }).asPromise();
}

export async function disconnectDatabase(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  cached.conn = null;
  cached.promise = null;
}

export default connectToDatabase;
