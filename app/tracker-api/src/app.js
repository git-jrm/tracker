import express from 'express';
import logsRoutes from './routes/logs.routes.js';
import { globalErrorHandler } from './middlewares/error.middleware.js';

const app = express();

app.set('json spaces', 2); // 2-space indentation JSON

app.use(express.json()); // let Express read JSON

app.get('/health', (req, res) => res.status(200).json({ OK: true }));

// Keep the current local prefix and expose the documented versioned API.
//app.use('/tracker-api', logsRoutes);
app.use('/v1', logsRoutes);

// catch all errors
app.use(globalErrorHandler);

export default app;
