import { Router, Request, Response } from 'express';
import { ComplianceService } from '../services/compliance';

export function createComplianceRoutes(service: ComplianceService): Router {
  const router = Router();

  // Check sanctions
  router.get('/sanctions/:address', async (req: Request, res: Response) => {
    try {
      const check = await service.checkSanctions(req.params.address);
      res.json(check);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Add to blacklist
  router.post('/blacklist', async (req: Request, res: Response) => {
    try {
      const { address, mint, reason, addedBy } = req.body;
      
      if (!address || !mint) {
        return res.status(400).json({ error: 'address and mint are required' });
      }

      const entry = await service.addToBlacklist(
        address,
        mint,
        reason || 'Manual addition',
        addedBy || 'system'
      );

      res.status(201).json(entry);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Remove from blacklist
  router.delete('/blacklist/:mint/:address', async (req: Request, res: Response) => {
    try {
      const { mint, address } = req.params;
      const { removedBy } = req.body;

      await service.removeFromBlacklist(address, mint, removedBy || 'system');
      res.json({ message: 'Address removed from blacklist' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Check blacklist
  router.get('/blacklist/:mint/:address', (req: Request, res: Response) => {
    const isBlacklisted = service.isBlacklisted(req.params.address, req.params.mint);
    const entry = service.getBlacklistEntry(req.params.address, req.params.mint);
    
    res.json({
      address: req.params.address,
      mint: req.params.mint,
      isBlacklisted,
      entry,
    });
  });

  // Get blacklist
  router.get('/blacklist', (req: Request, res: Response) => {
    const { mint, active } = req.query;
    const entries = service.getBlacklist(
      mint as string,
      active !== 'false'
    );
    res.json(entries);
  });

  // Export audit log
  router.get('/audit', (req: Request, res: Response) => {
    const { startDate, endDate, action } = req.query;
    
    const logs = service.exportAuditLog(
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined,
      action as string
    );
    
    res.json(logs);
  });

  return router;
}
