import { PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { env } from '../src/config/env.js';
import { dynamoDB } from '../src/db/dynamo-client.js';

export const normalizeUserId = (value) => {
    const username = value?.startsWith('USER#') ? value.slice(5) : value;
    if (!username || !/^[A-Za-z0-9_-]+$/.test(username)) {
        throw new Error('Los usuarios deben usar solo letras, números, guion y guion bajo.');
    }
    return `USER#${username}`;
};

const listItems = async (PK, prefix) => {
    const items = [];
    let ExclusiveStartKey;

    do {
        const response = await dynamoDB.send(new QueryCommand({
            TableName: env.DYNAMODB_TABLE_NAME,
            KeyConditionExpression: 'PK = :pk AND begins_with(SK, :prefix)',
            ExpressionAttributeValues: { ':pk': PK, ':prefix': prefix },
            ConsistentRead: true,
            ExclusiveStartKey
        }));

        items.push(...(response.Items ?? []));
        ExclusiveStartKey = response.LastEvaluatedKey;
    } while (ExclusiveStartKey);

    return items;
};

export const copyUserItems = async (sourceId, destinationId, prefix, kind) => {
    const sourcePK = normalizeUserId(sourceId);
    const destinationPK = normalizeUserId(destinationId);

    if (sourcePK === destinationPK) throw new Error('El usuario origen y destino deben ser distintos.');

    try {
        const sourceItems = await listItems(sourcePK, prefix);
        if (sourceItems.length === 0) {
            console.log(`No hay registros ${kind} para ${sourcePK}. No se copiaron elementos.`);
            return;
        }

        const existingItems = await listItems(destinationPK, prefix);
        if (existingItems.length > 0) {
            throw new Error(`El destino ${destinationPK} ya tiene registros ${kind}; no se modificó ninguno.`);
        }

        for (const item of sourceItems) {
            await dynamoDB.send(new PutCommand({
                TableName: env.DYNAMODB_TABLE_NAME,
                Item: { ...item, PK: destinationPK },
                ConditionExpression: 'attribute_not_exists(PK) AND attribute_not_exists(SK)'
            }));
        }

        console.log(`Copiados ${sourceItems.length} registros ${kind}: ${sourcePK} -> ${destinationPK}.`);
    } finally {
        dynamoDB.destroy();
    }
};
