/**
 * Worker entry point — run this as a separate process alongside the API server.
 * The BullMQ worker picks jobs from Redis and processes documents (officeparser + Docling fallback),
 * chunking, and embedding before writing chunks to PostgreSQL.
 *
 * Dev:   npm run worker
 * Prod:  npm run worker:start
 */
import 'dotenv/config';
import './workers/documentWorker';
