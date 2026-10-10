import serverless from 'serverless-http';
import app from './app.js';

// Set the Lambda handler to src/lambda.handler.
export const handler = serverless(app);