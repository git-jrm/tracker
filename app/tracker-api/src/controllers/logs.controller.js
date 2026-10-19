import { getActivationService, createActivationService, createLogForDate, deleteLog, getCatalogs as getCatalogsFromService, getGoalsForDate, getLogsForDate } from '../services/logs.service.js';

// ########################################################
// ###   IMPLEMENET ADR-01 (Passwordless auth) - START  ###
// ########################################################

export const createActivation = async (req, res, next) => {
    try {
        const activation = await createActivationService(req.body?.activationId);
        return res.status(202).json(activation);
    } catch (error) {
        return next(error);
    }
};

export const getActivation = async (req, res, next) => {
    try {
        const activation = await getActivationService(req.query?.activationId);
        return res.status(200).json(activation);
    } catch (error) {
        return next(error);
    }
};

// ########################################################
// ###   IMPLEMENET ADR-01 (Passwordless auth) - END    ###
// ########################################################

export const getGoals = async (req, res, next) => {
    try {
        const userId = req.get('X-User-Id');
        const goals = await getGoalsForDate(req.query.date, userId);
        return res.status(200).json(goals);
    } catch (error) {
        return next(error);
    }
};

export const getCatalogs = async (req, res, next) => {
    try {
        const userId = req.get('X-User-Id');
        const catalogs = await getCatalogsFromService(userId);
        return res.status(200).json(catalogs);
    } catch (error) {
        return next(error);
    }
};

export const getLogs = async (req, res, next) => {
    try {
        const userId = req.get('X-User-Id');
        const logs = await getLogsForDate(req.query.date, userId);
        return res.status(200).json(logs);
    } catch (error) {
        return next(error);
    }
};

export const createLog = async (req, res, next) => {
    try {
        const userId = req.get('X-User-Id');
        const SK = await createLogForDate(req.query.date, req.body, userId);
        return res.status(201).json({ OK: true, SK });
    } catch (error) {
        return next(error);
    }
};

export const softDeleteLog = async (req, res, next) => {
    try {
        const userId = req.get('X-User-Id');
        const result = await deleteLog(req.body?.SK, userId);
        return res.status(200).json(result);
    } catch (error) {
        return next(error);
    }
};