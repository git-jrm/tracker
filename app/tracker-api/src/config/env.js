import 'dotenv/config';

export const env = {
  PORT: Number(process.env.PORT) || 3000, // Automatic conversion to number and default value
  JWT_SECRET: process.env.JWT_SECRET,
  NODE_ENV: process.env.NODE_ENV || 'development',
  AWS_REGION: process.env.AWS_REGION || 'us-east-1',
  DYNAMODB_TABLE_NAME: process.env.DYNAMODB_TABLE_NAME || 'Tracker',
  DB_ADAPTER: process.env.DB_ADAPTER || 'dynamodb',
  SIMULATED_USER_ID: process.env.SIMULATED_USER_ID || 'U1',
  ENABLE_ACTIVATIONS: process.env.ENABLE_ACTIVATIONS?.trim().toLowerCase() === 'true',
  CORS_ALLOWED_ORIGINS: (process.env.CORS_ALLOWED_ORIGINS || 'http://127.0.0.1:5500')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
};
