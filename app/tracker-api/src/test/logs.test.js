import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';

// Tests use the in-memory adapter. The API defaults to DynamoDB outside tests.
process.env.DB_ADAPTER = 'memory';
const { putItemIfAbsent, queryItems } = await import('../db/simulated-table.js');
const { default: app } = await import('../app.js');

const testDate = '2099-12-31';
const emptyDate = '2026-08-01';
const meal = (label, k, p, c, f) => ({ label, k, p, c, f });
const activeGoal = { k: 2500, p: 110, c: 180, f: 60 };

//  ACTIVE ITEM MORE RECENT NO DELETED GOAL#<date> BEFORE DATE IF GIVEN AND MAX TODAY
for (const item of [
    { PK: 'USER#U1', SK: 'GOAL#2026-12-01', Details: { k: 2300, p: 90, c: 160, f: 50 }, DeletedAt: '2026-12-02' },
    { PK: 'USER#U1', SK: 'GOAL#2026-12-15', Details: { k: 2500, p: 110, c: 180, f: 60 } },
    { PK: 'USER#U1', SK: 'GOAL#2027-01-01', Details: { k: 3000, p: 150, c: 220, f: 80 } }
]) {
    putItemIfAbsent(item);
}

let server;
let baseUrl;

before(async () => {
    server = app.listen(0);
    await new Promise((resolve) => server.once('listening', resolve));
    baseUrl = `http://127.0.0.1:${server.address().port}/v1`;
});

after(async () => {
    await new Promise((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
    });
});

describe('logs API (contract test.rest)', () => {
    it('1. POST creates a log with the documented response and key', async () => {
        const response = await fetch(`${baseUrl}/logs?date=${testDate}`, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
                Type: 'MEAL',
                Details: meal('100g almonds', 579, 21, 22, 50)
            })
        });
        const result = await response.json();

        assert.equal(response.status, 201);
        assert.deepEqual(Object.keys(result), ['OK', 'SK']);
        assert.equal(result.OK, true);
        assert.match(result.SK, /^LOG#2099-12-31#[a-z0-9]{6}$/);

        const storedLog = queryItems('USER#U1', `LOG#${testDate}#`)
            .find((item) => item.SK === result.SK);
        assert.deepEqual(storedLog, {
            PK: 'USER#U1',
            SK: result.SK,
            Type: 'MEAL',
            Order: 1,
            Details: meal('100g almonds', 579, 21, 22, 50)
        });
    });

    it('rejects malformed meals and invalid or missing dates', async () => {
        const invalidMeal = await fetch(`${baseUrl}/logs?date=${testDate}`, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ Type: 'MEAL', Details: { label: 'almonds', k: '579' } })
        });
        const missingDate = await fetch(`${baseUrl}/logs`);
        const invalidDate = await fetch(`${baseUrl}/logs?date=2026-02-30`);

        assert.equal(invalidMeal.status, 400);
        assert.equal(missingDate.status, 400);
        assert.equal(invalidDate.status, 400);
    });

    it('2. GET returns active meals for the selected day in order', async () => {
        const response = await fetch(`${baseUrl}/logs?date=${testDate}`);

        assert.equal(response.status, 200);
        const storedLog = queryItems('USER#U1', `LOG#${testDate}#`)[0];
        assert.deepEqual(await response.json(), {
            date: testDate,
            totals: { k: 579, p: 21, c: 22, f: 50 },
            logs: [{ type: 'MEAL', ...meal('100g almonds', 579, 21, 22, 50), SK: storedLog.SK, Order: 1 }]
        });
    });

    it('GET catalogs returns active catalog meals in order and API format', async () => {
        const response = await fetch(`${baseUrl}/catalogs`);

        assert.equal(response.status, 200);
        assert.deepEqual(await response.json(), [
            { type: 'MEAL', ...meal('100g almonds', 579, 21, 22, 50), SK: 'CATALOG#a1a1a1', Order: 1 },
            { type: 'MEAL', ...meal('100g orange', 579, 21, 22, 50), SK: 'CATALOG#b2b2b2', Order: 2 }
        ]);
    });

    it('3. PATCH soft-deletes a log and it no longer appears in GET', async () => {
        const createResponse = await fetch(`${baseUrl}/logs?date=${testDate}`, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ Type: 'MEAL', Details: meal('yogurt', 61, 4, 5, 4) })
        });
        const created = await createResponse.json();

        const deleteResponse = await fetch(`${baseUrl}/logs`, {
            method: 'PATCH',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ SK: created.SK })
        });
        const deleted = await deleteResponse.json();

        assert.equal(deleteResponse.status, 200);
        assert.equal(deleted.OK, true);
        assert.equal(deleted.SK, created.SK);
        assert.match(deleted.DeletedAt, /^\d{4}-\d{2}-\d{2}T/);

        const getResponse = await fetch(`${baseUrl}/logs?date=${testDate}`);
        const remainingLog = queryItems('USER#U1', `LOG#${testDate}#`)[0];
        assert.deepEqual(await getResponse.json(), {
            date: testDate,
            totals: { k: 579, p: 21, c: 22, f: 50 },
            logs: [{ type: 'MEAL', ...meal('100g almonds', 579, 21, 22, 50), SK: remainingLog.SK, Order: 1 }]
        });
    });

    it('returns 404 when deleting a nonexistent or already deleted log', async () => {
        const response = await fetch(`${baseUrl}/logs`, {
            method: 'PATCH',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ SK: `LOG#${testDate}#abcdef` })
        });

        assert.equal(response.status, 404);
    });

    it('returns zero totals and an empty logs list when a date has no logs', async () => {
        const response = await fetch(`${baseUrl}/logs?date=${emptyDate}`);

        assert.equal(response.status, 200);
        assert.deepEqual(await response.json(), {
            date: emptyDate,
            totals: { k: 0, p: 0, c: 0, f: 0 },
            logs: []
        });
    });

    it('returns the latest non-deleted goal on or before the selected date', async () => {
        const response = await fetch(`${baseUrl}/goals?date=2026-12-31`);

        assert.equal(response.status, 200);
        assert.deepEqual(await response.json(), activeGoal);
    });

    it('returns null when no goal exists and rejects missing or invalid goal dates', async () => {
        const noGoal = await fetch(`${baseUrl}/goals?date=${emptyDate}`);
        const missingDate = await fetch(`${baseUrl}/goals`);
        const invalidDate = await fetch(`${baseUrl}/goals?date=2026-02-30`);

        assert.equal(noGoal.status, 200);
        assert.equal(await noGoal.json(), null);
        assert.equal(missingDate.status, 400);
        assert.equal(invalidDate.status, 400);
    });

    it('returns the seeded example logs from the simulated table', async () => {
        const response = await fetch(`${baseUrl}/logs?date=2026-10-04`);

        assert.deepEqual(await response.json(), {
            date: '2026-10-04',
            totals: { k: 640, p: 25, c: 27, f: 54 },
            logs: [
                { type: 'MEAL', ...meal('almonds', 579, 21, 22, 50), SK: 'LOG#2026-10-04#c3c3c3', Order: 1 },
                { type: 'MEAL', ...meal('yogurt', 61, 4, 5, 4), SK: 'LOG#2026-10-04#d4d4d4', Order: 2 }
            ]
        });
    });
});