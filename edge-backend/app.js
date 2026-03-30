
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import healthRoutes from './routes/health.routes.js';
import apiRoutes from './routes/api.routes.js';
import ruleRoutes from './routes/rule.routes.js';
import { ruleEngineMiddleware } from './middleware/ruleEngine.middleware.js';
import { errorHandler } from './middleware/error.middleware.js';
import { notFoundHandler } from './middleware/notFoundHandler.js';
import { config } from './config/env.js'; // Imports env variables

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
if (config.env !== 'production') {
    app.use(morgan('dev'));
}
app.use(express.json());

// Global Rule Engine Middleware
app.use(ruleEngineMiddleware);

// Routes
app.use('/', healthRoutes);
app.use('/api', apiRoutes);
app.use('/rules', ruleRoutes);

// Error Handling
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
