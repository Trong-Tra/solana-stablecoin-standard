import { Router, Request, Response } from 'express';
import { WebhookService } from '../services/webhook';

export function createWebhookRoutes(service: WebhookService): Router {
  const router = Router();

  // Register webhook
  router.post('/', (req: Request, res: Response) => {
    try {
      const { url, events, secret, retryCount, retryDelayMs } = req.body;
      
      if (!url || !events) {
        return res.status(400).json({ error: 'url and events are required' });
      }

      const webhook = service.registerWebhook({
        url,
        events: Array.isArray(events) ? events : [events],
        secret,
        active: true,
        retryCount: retryCount || 3,
        retryDelayMs: retryDelayMs || 1000,
      });

      res.status(201).json(webhook);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // List webhooks
  router.get('/', (req: Request, res: Response) => {
    const { active } = req.query;
    const webhooks = service.listWebhooks(active === 'true');
    res.json(webhooks);
  });

  // Get webhook
  router.get('/:id', (req: Request, res: Response) => {
    const webhook = service.getWebhook(req.params.id);
    if (!webhook) {
      return res.status(404).json({ error: 'Webhook not found' });
    }
    res.json(webhook);
  });

  // Update webhook
  router.patch('/:id', (req: Request, res: Response) => {
    try {
      const webhook = service.updateWebhook(req.params.id, req.body);
      res.json(webhook);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Delete webhook
  router.delete('/:id', (req: Request, res: Response) => {
    try {
      service.deleteWebhook(req.params.id);
      res.json({ message: 'Webhook deleted' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get deliveries
  router.get('/:id/deliveries', (req: Request, res: Response) => {
    const { status } = req.query;
    const deliveries = service.getDeliveries(req.params.id, status as string);
    res.json(deliveries);
  });

  // Get delivery
  router.get('/:id/deliveries/:deliveryId', (req: Request, res: Response) => {
    const delivery = service.getDelivery(req.params.deliveryId);
    if (!delivery) {
      return res.status(404).json({ error: 'Delivery not found' });
    }
    res.json(delivery);
  });

  return router;
}
