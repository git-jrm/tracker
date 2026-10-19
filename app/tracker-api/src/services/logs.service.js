import { randomInt } from 'node:crypto';
import { env } from '../config/env.js';
import { getActivation, saveActivation, getLatestGoal, listCatalogs, listLogs, markLogDeleted, saveLog } from '../db/logs.repository.js';

//const USER_PK = `USER#${env.SIMULATED_USER_ID}`;
const LOG_FIELDS = ['k', 'p', 'c', 'f'];
const LOG_SK_PATTERN = /^LOG#\d{4}-\d{2}-\d{2}#[a-z0-9]{6}$/;

const createError = (statusCode, message) => Object.assign(new Error(message), { statusCode });

const validateDate = (sDate) => {

    // We need a STRING in YYYY-MM-DD format, it's part of SK and is used to sort logs by date
    if (typeof sDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(sDate)) {
        throw createError(400, 'Date must use YYYY-MM-DD format.');
    }

    // Round-trip: Date "corrige" 2026-02-30 → 2026-03-02, así que si no coincide, era inválida
    const parsed = new Date(`${sDate}T00:00:00Z`);
    if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== sDate) {
        throw createError(400, 'YYYY-MM-DD date is invalid.');
    }

    return sDate;
};

const normalizeMeal = (meal) => {
    if (!meal || typeof meal !== 'object' || Array.isArray(meal) ||
        typeof meal.label !== 'string' || meal.label.trim() === '' ||
        !LOG_FIELDS.every((field) => typeof meal[field] === 'number' && Number.isFinite(meal[field]))) {
        throw createError(400, 'MEAL must include label, k, p, c and f.');
    }

    return {
        label: meal.label.trim(),
        k: meal.k,
        p: meal.p,
        c: meal.c,
        f: meal.f
    };
};

const toMealResponse = ({ Type, SK, Order, Details }) => ({
    type: Type,
    ...((Details?.item && typeof Details.item === 'object') ? Details.item : Details),
    SK,
    Order
});

const getUserPK = (userId) => {
    if (typeof userId !== 'string' || !/^USER#[\w-]+$/.test(userId)) {
        throw createError(400, 'Valid X-User-Id header is required.');
    }
    return userId;
};

// ########################################################
// ###   IMPLEMENET ADR-01 (Passwordless auth) - START  ###
// ########################################################

export const createActivationService = async (stringActivationId) => {
    if (!env.ENABLE_ACTIVATIONS) {
        throw createError(503, 'Activations are temporarily disabled.');
    }
    if (typeof stringActivationId !== 'string' || !stringActivationId) {
        throw createError(400, 'activationId is required.');
    }

    const existing = await getActivation(stringActivationId);
    if (existing) return { Status: existing.Status === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE' };

    const activation = {
        PK: `ACTIVATION#${stringActivationId}`,
        SK: 'ACCESS',
        Type: 'DEVICE',
        Status: 'PENDING',
        CreatedAt: new Date().toISOString()
    };

    const saved = await saveActivation(activation);
    if (saved) return { Status: 'INACTIVE' };

    // Another request may have created it at the same time.
    const createdByOtherRequest = await getActivation(stringActivationId);
    if (createdByOtherRequest) {
        return { Status: createdByOtherRequest.Status === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE' };
    }

    throw createError(500, 'Could not save the activation request.');
};

export const getActivationService = async (stringActivationId) => {
    if (typeof stringActivationId !== 'string' || !stringActivationId) {
        throw createError(400, 'activationId is required.');
    }

    const activation = await getActivation(stringActivationId);
    //if (!activation) return { Status: 'INACTIVE' };
    // return { Status: activation.Status === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE' };
    if (!activation || activation.Status !== 'ACTIVE') {
        return { Status: 'INACTIVE' };
    }

    return {
        Status: 'ACTIVE',
        UserId: activation.UserId
    };
};

// ########################################################
// ###   IMPLEMENET ADR-01 (Passwordless auth) - END    ###
// ########################################################

export const getGoalsForDate = async (stringDateInput, userId) => {
    const date = validateDate(stringDateInput);
    const goal = await getLatestGoal(getUserPK(userId), date);

    return goal?.Details ?? null;
};

export const getCatalogs = async (userId) => {
    const items = await listCatalogs(getUserPK(userId));
    return items.map(toMealResponse);
};

export const getLogsForDate = async (stringDateInput, userId) => {
    const date = validateDate(stringDateInput);
    const items = await listLogs(getUserPK(userId), date);
    const logs = items.map(toMealResponse);
    const totals = logs.reduce((sum, log) => {
        for (const field of LOG_FIELDS) sum[field] += log[field];
        return sum;
    }, { k: 0, p: 0, c: 0, f: 0 });

    return { date, totals, logs };
};

export const createLogForDate = async (stringDateInput, logInput, userId) => {
    const date = validateDate(stringDateInput);
    const type = logInput?.Type ?? 'MEAL';
    if (type !== 'MEAL') throw createError(400, 'Type must be MEAL.');
    const meal = normalizeMeal(logInput?.Details ?? logInput?.MEAL ?? logInput);
    const existingLogs = await listLogs(getUserPK(userId), date);
    const order = existingLogs.reduce((max, item) => Math.max(max, item.Order ?? 0), 0) + 1;

    for (let attempt = 0; attempt < 10; attempt += 1) {
        const id = randomInt(36 ** 6).toString(36).padStart(6, '0');
        const SK = `LOG#${date}#${id}`;
        const saved = await saveLog({
            PK: getUserPK(userId),
            SK,
            Type: type,
            Order: order,
            Details: meal
        });

        if (saved) return SK;
    }

    throw createError(409, 'Could not generate a unique log key.');
};

export const deleteLog = async (SK, userId) => {
    if (typeof SK !== 'string' || !LOG_SK_PATTERN.test(SK)) {
        throw createError(400, 'SK must use LOG#YYYY-MM-DD#<six-character-id> format.');
    }

    const DeletedAt = new Date().toISOString();
    const updatedItem = await markLogDeleted(getUserPK(userId), SK, DeletedAt);
    if (!updatedItem) throw createError(404, 'Log not found or already deleted.');

    return { OK: true, SK, DeletedAt: updatedItem.DeletedAt };
};