import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { env } from '../config/env.js';

// AWS SDK automatically uses the Lambda execution role in AWS, or the local AWS profile.
const client = new DynamoDBClient({ region: env.AWS_REGION });

export const dynamoDB = DynamoDBDocumentClient.from(client);