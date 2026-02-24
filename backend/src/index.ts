import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import winston from 'winston';
import dotenv from 'dotenv';
import { Connection, clusterApiUrl } from '@solana/web3.js';
import { MintBurnService } from './services/mint-burn';
import { EventIndexer } from './services/indexer';
import { ComplianceService } from './services/compliance';
import { WebhookService } from './services/webhook';
import { createRoutes } from './routes';

dotenv.config();

// Logger setup
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

// Configuration
const PORT = process.env.PORT || 3000;
const CLUSTER = process.env.SOLANA_CLUSTER || 'devnet';
const RPC_URL = process.env.SOLANA_RPC_URL || clusterApiUrl(CLUSTER as any);

// Solana connection
const connection = new Connection(RPC_URL, 'confirmed');

// Services
const mintBurnService = new MintBurnService(connection, logger);
const eventIndexer = new EventIndexer(connection, logger);
const complianceService = new ComplianceService(connection, logger);
const webhookService = new WebhookService(logger);

// Express app
const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    cluster: CLUSTER,
    services: {
      mintBurn: mintBurnService.isHealthy(),
      indexer: eventIndexer.isHealthy(),
      compliance: complianceService.isHealthy(),
      webhook: webhookService.isHealthy(),
    },
  });
});

// API routes
app.use('/api', createRoutes({
  mintBurnService,
  eventIndexer,
  complianceService,
  webhookService,
}));

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack });
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  logger.info(`SSS Backend Service started on port ${PORT}`);
  logger.info(`Connected to Solana ${CLUSTER} at ${RPC_URL}`);
  
  // Start background services
  eventIndexer.start();
  complianceService.start();
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  await eventIndexer.stop();
  await complianceService.stop();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  await eventIndexer.stop();
  await complianceService.stop();
  process.exit(0);
});
