import { Router } from 'express';
import { MintBurnService } from '../services/mint-burn';
import { EventIndexer } from '../services/indexer';
import { ComplianceService } from '../services/compliance';
import { WebhookService } from '../services/webhook';
import { createMintBurnRoutes } from './mint-burn';
import { createIndexerRoutes } from './indexer';
import { createComplianceRoutes } from './compliance';
import { createWebhookRoutes } from './webhook';

interface Services {
  mintBurnService: MintBurnService;
  eventIndexer: EventIndexer;
  complianceService: ComplianceService;
  webhookService: WebhookService;
}

export function createRoutes(services: Services): Router {
  const router = Router();

  // Mount service routes
  router.use('/mint-burn', createMintBurnRoutes(services.mintBurnService));
  router.use('/events', createIndexerRoutes(services.eventIndexer));
  router.use('/compliance', createComplianceRoutes(services.complianceService));
  router.use('/webhooks', createWebhookRoutes(services.webhookService));

  return router;
}
