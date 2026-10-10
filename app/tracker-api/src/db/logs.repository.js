import { env } from '../config/env.js';

// Memory mode is for local tests only; normal execution connects to DynamoDB.
const repository = env.DB_ADAPTER === 'memory'
  ? await import('./memory-logs.repository.js')
  : await import('./dynamo-logs.repository.js');

export const { listLogs, getLatestGoal, saveLog, markLogDeleted } = repository;