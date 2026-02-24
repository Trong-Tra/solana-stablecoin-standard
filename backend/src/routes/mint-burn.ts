import { Router, Request, Response } from 'express';
import { MintBurnService } from '../services/mint-burn';

export function createMintBurnRoutes(service: MintBurnService): Router {
  const router = Router();

  // Create mint request
  router.post('/mint', async (req: Request, res: Response) => {
    try {
      const { recipient, amount, requester } = req.body;
      
      if (!recipient || !amount) {
        return res.status(400).json({ error: 'recipient and amount are required' });
      }

      const request = await service.createMintRequest(
        recipient,
        amount,
        requester || 'anonymous'
      );

      res.status(201).json(request);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Verify mint request
  router.post('/mint/:id/verify', async (req: Request, res: Response) => {
    try {
      const request = await service.verifyMintRequest(req.params.id);
      res.json(request);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get mint request
  router.get('/mint/:id', (req: Request, res: Response) => {
    const request = service.getMintRequest(req.params.id);
    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }
    res.json(request);
  });

  // List mint requests
  router.get('/mint', (req: Request, res: Response) => {
    const { status } = req.query;
    const requests = service.listMintRequests(status as string);
    res.json(requests);
  });

  // Create burn request
  router.post('/burn', async (req: Request, res: Response) => {
    try {
      const { amount, from, requester } = req.body;
      
      if (!amount) {
        return res.status(400).json({ error: 'amount is required' });
      }

      const request = await service.createBurnRequest(
        amount,
        requester || 'anonymous',
        from
      );

      res.status(201).json(request);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get burn request
  router.get('/burn/:id', (req: Request, res: Response) => {
    const request = service.getBurnRequest(req.params.id);
    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }
    res.json(request);
  });

  // List burn requests
  router.get('/burn', (req: Request, res: Response) => {
    const { status } = req.query;
    const requests = service.listBurnRequests(status as string);
    res.json(requests);
  });

  return router;
}
