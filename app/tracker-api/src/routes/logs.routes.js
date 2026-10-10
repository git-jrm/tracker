import { Router } from 'express';
import { getLogs, createLog, softDeleteLog, getGoals } from '../controllers/logs.controller.js';

const router = Router();

// GET /v1/logs?date=YYYY-MM-DD
router.get('/logs', getLogs);

// POST /v1/logs?date=YYYY-MM-DD
router.post('/logs', createLog);

// PATCH /v1/logs with { "SK": "LOG#YYYY-MM-DD#xxxxxx" }
router.patch('/logs', softDeleteLog);

// GET /v1/goals?date=YYYY-MM-DD
router.get('/goals', getGoals);

export default router;
