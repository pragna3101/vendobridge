import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import router from './routes';
import { errorHandler } from './middleware/error.middleware';
import { apiLimiter } from './middleware/rateLimiter.middleware';
import { StorageService } from './services/storage.service';

const app = express();

app.use(helmet({
  crossOriginResourcePolicy: false,
}));

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Initialize storage folders
StorageService.init();

// Static serving for uploaded files/documents
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Mount main routing middleware under /api
app.use('/api', apiLimiter, router);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date() });
});

// Capture non-existent routes
app.use('*', (req, res, next) => {
  res.status(404).json({ status: 'error', message: 'Endpoint not found' });
});

// Global error handler
app.use(errorHandler);

export default app;
