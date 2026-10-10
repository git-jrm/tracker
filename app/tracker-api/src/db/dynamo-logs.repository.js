import {
    PutCommand,
    QueryCommand,
    UpdateCommand
} from '@aws-sdk/lib-dynamodb';
import { env } from '../config/env.js';
import { dynamoDB } from './dynamo-client.js';

export const listLogs = async (PK, date) => {
    const Items = [];
    let ExclusiveStartKey;

    do {
        const response = await dynamoDB.send(new QueryCommand({
            TableName: env.DYNAMODB_TABLE_NAME,
            KeyConditionExpression: 'PK = :pk AND begins_with(SK, :prefix)',
            FilterExpression: 'attribute_not_exists(DeletedAt)',
            ExpressionAttributeValues: {
                ':pk': PK,
                ':prefix': `LOG#${date}#`
            },
            ExclusiveStartKey
        }));

        Items.push(...(response.Items ?? []));
        ExclusiveStartKey = response.LastEvaluatedKey;
    } while (ExclusiveStartKey);

    return Items.sort((left, right) => left.Order - right.Order);
};

export const getLatestGoal = async (PK, date) => {
    let ExclusiveStartKey;

    do {
        const response = await dynamoDB.send(new QueryCommand({
            TableName: env.DYNAMODB_TABLE_NAME,
            KeyConditionExpression: 'PK = :pk AND SK BETWEEN :lowerBound AND :upperBound',
            FilterExpression: 'attribute_not_exists(DeletedAt)',
            ExpressionAttributeValues: {
                ':pk': PK,
                ':lowerBound': 'GOAL#',
                ':upperBound': `GOAL#${date}`
            },
            ScanIndexForward: false,
            Limit: 1,
            ExclusiveStartKey
        }));

        if (response.Items?.length) return response.Items[0];
        ExclusiveStartKey = response.LastEvaluatedKey;
    } while (ExclusiveStartKey);

    return null;
};

export const saveLog = async (item) => {
    try {
        await dynamoDB.send(new PutCommand({
            TableName: env.DYNAMODB_TABLE_NAME,
            Item: item,
            ConditionExpression: 'attribute_not_exists(PK) AND attribute_not_exists(SK)'
        }));
        return true;
    } catch (error) {
        if (error.name === 'ConditionalCheckFailedException') return false;
        throw error;
    }
};

export const markLogDeleted = async (PK, SK, DeletedAt) => {
    try {
        const response = await dynamoDB.send(new UpdateCommand({
            TableName: env.DYNAMODB_TABLE_NAME,
            Key: { PK, SK },
            UpdateExpression: 'SET DeletedAt = :deletedAt',
            ConditionExpression: 'attribute_exists(PK) AND attribute_exists(SK) AND attribute_not_exists(DeletedAt)',
            ExpressionAttributeValues: { ':deletedAt': DeletedAt },
            ReturnValues: 'ALL_NEW'
        }));
        return response.Attributes;
    } catch (error) {
        if (error.name === 'ConditionalCheckFailedException') return null;
        throw error;
    }
};