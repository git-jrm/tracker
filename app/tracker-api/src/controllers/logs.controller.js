import { createLogForDate, deleteLog, getCatalogs as getCatalogsFromService, getGoalsForDate, getLogsForDate } from '../services/logs.service.js';

export const getCatalogs = async (req, res, next) => {
    try {
        const catalogs = await getCatalogsFromService();
        return res.status(200).json(catalogs);
    } catch (error) {
        return next(error);
    }
};

export const getLogs = async (req, res, next) => {
    try {
        const logs = await getLogsForDate(req.query.date);
        return res.status(200).json(logs);
    } catch (error) {
        return next(error);
    }
};

export const createLog = async (req, res, next) => {
    try {
        const SK = await createLogForDate(req.query.date, req.body);
        return res.status(201).json({ OK: true, SK });
    } catch (error) {
        return next(error);
    }
};

export const softDeleteLog = async (req, res, next) => {
    try {
        const result = await deleteLog(req.body?.SK);
        return res.status(200).json(result);
    } catch (error) {
        return next(error);
    }
};

export const getGoals = async (req, res, next) => {
    try {
        const goals = await getGoalsForDate(req.query.date);
        return res.status(200).json(goals);
    } catch (error) {
        return next(error);
    }
};