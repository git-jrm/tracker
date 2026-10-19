import { Router } from 'express';
import { createActivation, getActivation, getLogs, createLog, softDeleteLog, getGoals, getCatalogs } from '../controllers/logs.controller.js';

const router = Router();

// ########################################################
// ###   IMPLEMENET ADR-01 (Passwordless auth) - START  ###
// ########################################################

// ****************************************************
// ACTIVATIONS ROUTES
router.post('/activations', createActivation);
router.get('/activations', getActivation);
// ****************************************************

// ########################################################
// ###   IMPLEMENET ADR-01 (Passwordless auth) - END    ###
// ########################################################


// ****************************************************
// GOALS ROUTES
// GET /v1/goals?date=YYYY-MM-DD
router.get('/goals', getGoals);
// ****************************************************


// ****************************************************
// CATALOGS ROUTES
// GET /v1/catalogs?date=YYYY-MM-DD
router.get('/catalogs', getCatalogs);
// ****************************************************


// ****************************************************
// LOGS ROUTES
// GET /v1/logs?date=YYYY-MM-DD
router.get('/logs', getLogs);
// POST /v1/logs?date=YYYY-MM-DD
router.post('/logs', createLog);
// PATCH /v1/logs with { "SK": "LOG#YYYY-MM-DD#xxxxxx" }
router.patch('/logs', softDeleteLog);
// ****************************************************

export default router;
