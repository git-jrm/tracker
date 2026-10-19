import express from 'express';
import logsRoutes from './routes/logs.routes.js';
import { globalErrorHandler } from './middlewares/error.middleware.js';

const app = express();

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', 'http://127.0.0.1:5500');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-User-Id');

    if (req.method === 'OPTIONS') return res.sendStatus(204);
    next();
});

app.set('json spaces', 2); // 2-space indentation JSON

app.use(express.json()); // let Express read JSON

app.get('/health', (req, res) => res.status(200).json({ OK: true }));

// Keep the current local prefix and expose the documented versioned API.
//app.use('/tracker-api', logsRoutes);
app.use('/v1', logsRoutes);

// catch all errors
app.use(globalErrorHandler);

export default app;
