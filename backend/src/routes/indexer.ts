import { Router, Request, Response } from 'express';
import { EventIndexer } from '../services/indexer';

export function createIndexerRoutes(service: EventIndexer): Router {
  const router = Router();

  // Watch a mint
  router.post('/watch', (req: Request, res: Response) => {
    try {
      const { mint } = req.body;
      if (!mint) {
        return res.status(400).json({ error: 'mint is required' });
      }

      service.watchMint(mint);
      res.json({ message: 'Mint added to watch list', mint });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Unwatch a mint
  router.delete('/watch/:mint', (req: Request, res: Response) => {
    try {
      service.unwatchMint(req.params.mint);
      res.json({ message: 'Mint removed from watch list', mint: req.params.mint });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get events
  router.get('/events', (req: Request, res: Response) => {
    const { mint, type } = req.query;
    const events = service.getEvents(mint as string, type as string);
    res.json(events);
  });

  // Get event by signature
  router.get('/events/:signature', (req: Request, res: Response) => {
    const event = service.getEventBySignature(req.params.signature);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    res.json(event);
  });

  return router;
}
