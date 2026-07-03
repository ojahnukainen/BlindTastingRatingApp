/**
 * Dev convenience: boot the API against an ephemeral in-memory MongoDB so the
 * app runs end-to-end without Docker or a local Mongo install.
 * Data is wiped when the process exits. Use a real MONGODB_URI for anything
 * you want to persist.
 */
import { MongoMemoryServer } from 'mongodb-memory-server';

const mongo = await MongoMemoryServer.create();
process.env.MONGODB_URI = mongo.getUri('blind-tasting');
process.env.NODE_ENV ??= 'development';

console.log(`[dev] in-memory MongoDB ready at ${process.env.MONGODB_URI}`);

// Import the server only after MONGODB_URI is set so env validation picks it up.
await import('../src/index.ts');
