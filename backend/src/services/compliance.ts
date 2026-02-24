import { Connection, PublicKey } from '@solana/web3.js';
import { Logger } from 'winston';

interface SanctionsCheck {
  address: string;
  isSanctioned: boolean;
  sources: string[];
  checkedAt: Date;
}

interface BlacklistEntry {
  address: string;
  mint: string;
  reason: string;
  addedBy: string;
  addedAt: Date;
  isActive: boolean;
}

interface AuditLogEntry {
  id: string;
  timestamp: Date;
  action: string;
  actor: string;
  target?: string;
  mint?: string;
  details: Record<string, any>;
}

export class ComplianceService {
  private sanctionsCache: Map<string, SanctionsCheck> = new Map();
  private blacklist: Map<string, BlacklistEntry> = new Map();
  private auditLog: AuditLogEntry[] = [];
  private isRunningFlag: boolean = false;

  constructor(
    private connection: Connection,
    private logger: Logger
  ) {}

  isHealthy(): boolean {
    return this.isRunningFlag;
  }

  /**
   * Start the compliance service
   */
  async start(): Promise<void> {
    this.isRunningFlag = true;
    this.logger.info('Compliance service started');
  }

  /**
   * Stop the compliance service
   */
  async stop(): Promise<void> {
    this.isRunningFlag = false;
    this.logger.info('Compliance service stopped');
  }

  /**
   * Check if an address is on sanctions lists
   */
  async checkSanctions(address: string): Promise<SanctionsCheck> {
    // Check cache first
    const cached = this.sanctionsCache.get(address);
    if (cached && this.isCacheValid(cached.checkedAt)) {
      return cached;
    }

    // Perform sanctions check
    const check = await this.performSanctionsCheck(address);
    this.sanctionsCache.set(address, check);

    if (check.isSanctioned) {
      this.logger.warn('Sanctioned address detected', { 
        address, 
        sources: check.sources 
      });
    }

    return check;
  }

  /**
   * Add address to blacklist
   */
  async addToBlacklist(
    address: string,
    mint: string,
    reason: string,
    addedBy: string
  ): Promise<BlacklistEntry> {
    const entry: BlacklistEntry = {
      address,
      mint,
      reason,
      addedBy,
      addedAt: new Date(),
      isActive: true,
    };

    const key = `${mint}:${address}`;
    this.blacklist.set(key, entry);

    this.logAudit('BLACKLIST_ADD', addedBy, address, mint, { reason });
    
    this.logger.info('Address added to blacklist', { 
      address, 
      mint, 
      reason,
      addedBy 
    });

    return entry;
  }

  /**
   * Remove address from blacklist
   */
  async removeFromBlacklist(
    address: string,
    mint: string,
    removedBy: string
  ): Promise<void> {
    const key = `${mint}:${address}`;
    const entry = this.blacklist.get(key);
    
    if (!entry) {
      throw new Error('Blacklist entry not found');
    }

    entry.isActive = false;
    this.blacklist.set(key, entry);

    this.logAudit('BLACKLIST_REMOVE', removedBy, address, mint, {});
    
    this.logger.info('Address removed from blacklist', { 
      address, 
      mint,
      removedBy 
    });
  }

  /**
   * Check if address is blacklisted
   */
  isBlacklisted(address: string, mint: string): boolean {
    const key = `${mint}:${address}`;
    const entry = this.blacklist.get(key);
    return entry?.isActive === true;
  }

  /**
   * Get blacklist entry
   */
  getBlacklistEntry(address: string, mint: string): BlacklistEntry | undefined {
    const key = `${mint}:${address}`;
    return this.blacklist.get(key);
  }

  /**
   * Get all blacklist entries for a mint
   */
  getBlacklist(mint?: string, activeOnly: boolean = true): BlacklistEntry[] {
    let entries = Array.from(this.blacklist.values());
    
    if (mint) {
      entries = entries.filter(e => e.mint === mint);
    }
    
    if (activeOnly) {
      entries = entries.filter(e => e.isActive);
    }
    
    return entries;
  }

  /**
   * Export audit log
   */
  exportAuditLog(
    startDate?: Date,
    endDate?: Date,
    action?: string
  ): AuditLogEntry[] {
    let logs = this.auditLog;
    
    if (startDate) {
      logs = logs.filter(l => l.timestamp >= startDate);
    }
    
    if (endDate) {
      logs = logs.filter(l => l.timestamp <= endDate);
    }
    
    if (action) {
      logs = logs.filter(l => l.action === action);
    }
    
    return logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Log audit entry
   */
  logAudit(
    action: string,
    actor: string,
    target?: string,
    mint?: string,
    details: Record<string, any> = {}
  ): void {
    const entry: AuditLogEntry = {
      id: this.generateId(),
      timestamp: new Date(),
      action,
      actor,
      target,
      mint,
      details,
    };

    this.auditLog.push(entry);
    
    // Keep only last 10000 entries
    if (this.auditLog.length > 10000) {
      this.auditLog = this.auditLog.slice(-10000);
    }
  }

  private async performSanctionsCheck(address: string): Promise<SanctionsCheck> {
    // TODO: Integrate with actual sanctions screening services
    // - OFAC SDN List
    // - UN Sanctions
    // - EU Sanctions
    
    return {
      address,
      isSanctioned: false,
      sources: [],
      checkedAt: new Date(),
    };
  }

  private isCacheValid(checkedAt: Date): boolean {
    const cacheAge = Date.now() - checkedAt.getTime();
    return cacheAge < 24 * 60 * 60 * 1000; // 24 hours
  }

  private generateId(): string {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
