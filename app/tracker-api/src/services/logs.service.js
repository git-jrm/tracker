import { randomInt } from 'node:crypto';
import { env } from '../config/env.js';
import { getLatestGoal, listLogs, markLogDeleted, saveLog } from '../db/logs.repository.js';

const USER_PK = `USER#${env.SIMULATED_USER_ID}`;
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

export const getLogsForDate = async (stringDateInput) => {
    const date = validateDate(stringDateInput);
    const items = await listLogs(USER_PK, date);
    const logs = items.map(({ Type, Details }) => ({
        type: Type,
        ...Details.item
    }));
    const totals = logs.reduce((sum, log) => {
        for (const field of LOG_FIELDS) sum[field] += log[field];
        return sum;
    }, { k: 0, p: 0, c: 0, f: 0 });

    return { date, totals, logs };
};

export const getGoalsForDate = async (stringDateInput) => {
    const date = validateDate(stringDateInput);
    const goal = await getLatestGoal(USER_PK, date);

    return goal?.Details ?? null;
};

export const createLogForDate = async (stringDateInput, mealInput) => {
    const date = validateDate(stringDateInput);
    const meal = normalizeMeal(mealInput);
    const existingLogs = await listLogs(USER_PK, date);
    const order = existingLogs.reduce((max, item) => Math.max(max, item.Order ?? 0), 0) + 1;

    for (let attempt = 0; attempt < 10; attempt += 1) {
        const id = randomInt(36 ** 6).toString(36).padStart(6, '0');
        const SK = `LOG#${date}#${id}`;
        const saved = await saveLog({
            PK: USER_PK,
            SK,
            Type: 'MEAL',
            Order: order,
            Details: { item: meal }
        });

        if (saved) return SK;
    }

    throw createError(409, 'Could not generate a unique log key.');
};

export const deleteLog = async (SK) => {
    if (typeof SK !== 'string' || !LOG_SK_PATTERN.test(SK)) {
        throw createError(400, 'SK must use LOG#YYYY-MM-DD#<six-character-id> format.');
    }

    const DeletedAt = new Date().toISOString();
    const updatedItem = await markLogDeleted(USER_PK, SK, DeletedAt);
    if (!updatedItem) throw createError(404, 'Log not found or already deleted.');

    return { OK: true, SK, DeletedAt: updatedItem.DeletedAt };
};