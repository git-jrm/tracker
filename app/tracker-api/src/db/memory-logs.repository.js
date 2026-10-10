import { markItemDeleted, putItemIfAbsent, queryItems } from './simulated-table.js';

export const listLogs = async (PK, date) => queryItems(PK, `LOG#${date}#`)
  .sort((left, right) => left.Order - right.Order);

export const getLatestGoal = async (PK, date) => queryItems(PK, 'GOAL#')
  .filter((item) => item.SK <= `GOAL#${date}`)
  .sort((left, right) => right.SK.localeCompare(left.SK))[0] ?? null;

export const saveLog = async (item) => putItemIfAbsent(item);

export const markLogDeleted = async (PK, SK, DeletedAt) => markItemDeleted(PK, SK, DeletedAt);