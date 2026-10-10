const sampleDate = '2026-10-04';
const sampleMeals = [
    { label: 'almonds', k: 579, p: 21, c: 22, f: 50 },
    { label: 'yogurt', k: 61, p: 4, c: 5, f: 4 }
];

const sampleItems = [
    {
        PK: 'USER#U1',
        SK: 'CREDENTIALS',
        Details: { user: 'U1', hash: '$1$2$3' }
    },
    {
        PK: 'USER#U1',
        SK: 'GOAL#2026-10-04',
        Details: { k: 2000, p: 150, c: 200, f: 60 }
    },
    ...[
        ['c3c3c3', sampleMeals[0]],
        ['d4d4d4', sampleMeals[1]]
    ].map(([id, item], index) => ({
        PK: 'USER#U1',
        SK: `LOG#${sampleDate}#${id}`,
        Type: 'MEAL',
        Order: index + 1,
        Details: { item }
    }))
];

// In-memory adapter mirrors DynamoDB's PK/SK item shape for local development.
const items = new Map(sampleItems.map((item) => [`${item.PK}\u0000${item.SK}`, structuredClone(item)]));

export const getItem = (PK, SK) => {
    const item = items.get(`${PK}\u0000${SK}`);
    return item ? structuredClone(item) : undefined;
};

export const putItemIfAbsent = (item) => {
    const key = `${item.PK}\u0000${item.SK}`;
    if (items.has(key)) return false;

    items.set(key, structuredClone(item));
    return true;
};

export const queryItems = (PK, sortKeyPrefix) => [...items.values()]
    .filter((item) => item.PK === PK && item.SK.startsWith(sortKeyPrefix) && !Object.hasOwn(item, 'DeletedAt'))
    .map((item) => structuredClone(item));

export const markItemDeleted = (PK, SK, DeletedAt) => {
    const key = `${PK}\u0000${SK}`;
    const item = items.get(key);
    if (!item || item.DeletedAt) return null;

    item.DeletedAt = DeletedAt;
    return structuredClone(item);
};