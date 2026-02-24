import { Connection, PublicKey, ParsedInstruction } from '@solana/web3.js';
import { Logger } from 'winston';

interface TokenEvent {
  signature: string;
  slot: number;
  timestamp: Date;
  mint: string;
  type: 'mint' | 'burn' | 'transfer' | 'freeze' | 'thaw' | 'blacklist' | 'seize';
  from?: string;
  to?: string;
  amount?: bigint;
  authority: string;
}

interface IndexerState {
  lastSlot: number;
  isRunning: boolean;
}

export class EventIndexer {
  private state: IndexerState = { lastSlot: 0, isRunning: false };
  private events: TokenEvent[] = [];
  private intervalId?: NodeJS.Timeout;
  private watchedMints: Set<string> = new Set();

  constructor(
    private connection: Connection,
    private logger: Logger,
    private pollIntervalMs: number = 5000
  ) {}

  isHealthy(): boolean {
    return this.state.isRunning;
  }

  /**
   * Add a mint to watch
   */
  watchMint(mintAddress: string): void {
    this.watchedMints.add(mintAddress);
    this.logger.info('Added mint to watch list', { mint: mintAddress });
  }

  /**
   * Remove a mint from watch list
   */
  unwatchMint(mintAddress: string): void {
    this.watchedMints.delete(mintAddress);
    this.logger.info('Removed mint from watch list', { mint: mintAddress });
  }

  /**
   * Start the indexer
   */
  async start(): Promise<void> {
    if (this.state.isRunning) {
      return;
    }

    this.state.isRunning = true;
    this.state.lastSlot = await this.connection.getSlot();
    
    this.logger.info('Event indexer started', { startingSlot: this.state.lastSlot });

    this.intervalId = setInterval(() => {
      this.poll();
    }, this.pollIntervalMs);
  }

  /**
   * Stop the indexer
   */
  async stop(): Promise<void> {
    this.state.isRunning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
    this.logger.info('Event indexer stopped');
  }

  /**
   * Get events for a mint
   */
  getEvents(mint?: string, type?: string): TokenEvent[] {
    let filtered = this.events;
    
    if (mint) {
      filtered = filtered.filter(e => e.mint === mint);
    }
    
    if (type) {
      filtered = filtered.filter(e => e.type === type);
    }
    
    return filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Get events by signature
   */
  getEventBySignature(signature: string): TokenEvent | undefined {
    return this.events.find(e => e.signature === signature);
  }

  private async poll(): Promise<void> {
    try {
      const currentSlot = await this.connection.getSlot();
      
      if (currentSlot <= this.state.lastSlot) {
        return;
      }

      // Get signatures for watched mints
      for (const mint of this.watchedMints) {
        await this.indexMintEvents(mint, this.state.lastSlot, currentSlot);
      }

      this.state.lastSlot = currentSlot;
    } catch (error: any) {
      this.logger.error('Error polling events', { error: error.message });
    }
  }

  private async indexMintEvents(
    mint: string,
    startSlot: number,
    endSlot: number
  ): Promise<void> {
    try {
      const signatures = await this.connection.getSignaturesForAddress(
        new PublicKey(mint),
        { limit: 100 },
        'confirmed'
      );

      for (const sigInfo of signatures) {
        // Skip already processed
        if (this.events.some(e => e.signature === sigInfo.signature)) {
          continue;
        }

        if (sigInfo.slot < startSlot) {
          continue;
        }

        const tx = await this.connection.getParsedTransaction(sigInfo.signature, {
          commitment: 'confirmed',
          maxSupportedTransactionVersion: 0,
        });

        if (!tx) continue;

        // Parse and store events
        const event = this.parseTransaction(sigInfo.signature, sigInfo.slot, tx, mint);
        if (event) {
          this.events.push(event);
          this.logger.debug('Indexed event', { 
            signature: sigInfo.signature,
            type: event.type,
            mint: event.mint
          });
        }
      }
    } catch (error: any) {
      this.logger.error('Error indexing mint events', { mint, error: error.message });
    }
  }

  private parseTransaction(
    signature: string,
    slot: number,
    tx: any,
    mint: string
  ): TokenEvent | null {
    // Simplified parsing - in production, parse actual instruction data
    const timestamp = tx.blockTime 
      ? new Date(tx.blockTime * 1000) 
      : new Date();

    // Detect event type from logs or instruction data
    const logs = tx.meta?.logMessages || [];
    
    let type: TokenEvent['type'] = 'transfer';
    let from: string | undefined;
    let to: string | undefined;
    let amount: bigint | undefined;

    // Parse from logs (simplified)
    for (const log of logs) {
      if (log.includes('Minted')) {
        type = 'mint';
        // Parse amount and recipient from log
      } else if (log.includes('Burned')) {
        type = 'burn';
      } else if (log.includes('Frozen')) {
        type = 'freeze';
      } else if (log.includes('Thawed')) {
        type = 'thaw';
      } else if (log.includes('Seized')) {
        type = 'seize';
      }
    }

    const authority = tx.transaction.message.accountKeys[0].pubkey.toBase58();

    return {
      signature,
      slot,
      timestamp,
      mint,
      type,
      from,
      to,
      amount,
      authority,
    };
  }
}
