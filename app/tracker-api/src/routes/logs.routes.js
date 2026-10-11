import { Router } from 'express';
import { getLogs, createLog, softDeleteLog, getGoals, getCatalogs } from '../controllers/logs.controller.js';

const router = Router();

// GOALS ROUTES: WORKING OK

// GET /v1/goals?date=YYYY-MM-DD
router.get('/goals', getGoals);

// CATALOGS ROUTES

// GET /v1/catalogs?date=YYYY-MM-DD
router.get('/catalogs', getCatalogs);

// LOGS ROUTES

// POST /v1/logs?date=YYYY-MM-DD
router.post('/logs', createLog);

// GET /v1/logs?date=YYYY-MM-DD
router.get('/logs', getLogs);

// PATCH /v1/logs with { "SK": "LOG#YYYY-MM-DD#xxxxxx" }
router.patch('/logs', softDeleteLog);



export default router;
