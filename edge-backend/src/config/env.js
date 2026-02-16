
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

export const config = {
    port: process.env.PORT || 5000,
    env: process.env.NODE_ENV || 'development',
    apiPrefix: '/api',
    rulePrefix: '/rules'
};
