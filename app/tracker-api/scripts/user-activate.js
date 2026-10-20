import { UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { env } from '../src/config/env.js';
import { dynamoDB } from '../src/db/dynamo-client.js';

const [activationId, username, deviceName, ...extraArgs] = process.argv.slice(2);
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const usernamePattern = /^[A-Za-z0-9_-]+$/;
const cleanDeviceName = deviceName?.trim();

if (!uuidPattern.test(activationId ?? '') ||
    !usernamePattern.test(username ?? '') ||
    extraArgs.length > 0 ||
    (deviceName !== undefined && (!cleanDeviceName || cleanDeviceName.length > 100))) {
    console.error('Uso: pnpm run user:activate <activationId UUID> <username> [DeviceName]');
    console.error('Ejemplo: pnpm run user:activate <uuid> U11 "Notebook personal"');
    process.exitCode = 1;
} else {
    const values = {
        ':active': 'ACTIVE',
        ':pending': 'PENDING',
        ':device': 'DEVICE',
        ':userId': `USER#${username}`,
        ':now': new Date().toISOString()
    };

    const setDeviceName = cleanDeviceName ? ', DeviceName = :deviceName' : '';
    if (cleanDeviceName) values[':deviceName'] = cleanDeviceName;

    try {
        await dynamoDB.send(new UpdateCommand({
            TableName: env.DYNAMODB_TABLE_NAME,
            Key: {
                PK: `ACTIVATION#${activationId}`,
                SK: 'ACCESS'
            },
            UpdateExpression:
                `SET #status = :active, UserId = :userId, ActivedAt = :now${setDeviceName}`,
            ConditionExpression:
                'attribute_exists(PK) AND #status = :pending AND #type = :device',
            ExpressionAttributeNames: {
                '#status': 'Status',
                '#type': 'Type'
            },
            ExpressionAttributeValues: values
        }));

        console.log(`Activado: ${activationId} -> USER#${username}`);
    } catch (error) {
        if (error.name === 'ConditionalCheckFailedException') {
            console.error('No se activó: debe existir y estar PENDING con Type=DEVICE.');
        } else {
            console.error(`Error DynamoDB: ${error.name}: ${error.message}`);
        }
        process.exitCode = 1;
    } finally {
        dynamoDB.destroy();
    }
}