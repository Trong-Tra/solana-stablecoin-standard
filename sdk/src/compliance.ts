import { Connection, PublicKey, Keypair, Transaction } from '@solana/web3.js';
import { Program } from '@coral-xyz/anchor';
import BN from 'bn.js';
import { getBlacklistPDA, toBN } from './utils';
import { BlacklistParams, SeizeParams, BlacklistEntry } from './types';

export class ComplianceModule {
  constructor(
    private connection: Connection,
    private program: Program,
    private mint: PublicKey,
    private authority: Keypair,
    private features: { permanentDelegate: boolean; transferHook: boolean }
  ) {}

  /**
   * Check if compliance features are enabled
   */
  isEnabled(): boolean {
    return this.features.permanentDelegate || this.features.transferHook;
  }

  /**
   * Add an address to the blacklist
   */
  async addToBlacklist(params: BlacklistParams): Promise<string> {
    this.ensureEnabled();

    const blacklistPDA = getBlacklistPDA(this.mint, params.address)[0];

    const tx = await this.program.methods
      .addToBlacklist(
        params.address,
        params.reason || 'Compliance violation'
      )
      .accounts({
        authority: this.authority.publicKey,
        stablecoinState: this.getStatePDA(),
        blacklistEntry: blacklistPDA,
        targetAddress: params.address,
        systemProgram: new PublicKey('11111111111111111111111111111111'),
      })
      .signers([this.authority])
      .rpc();

    return tx;
  }

  /**
   * Remove an address from the blacklist
   */
  async removeFromBlacklist(address: PublicKey): Promise<string> {
    this.ensureEnabled();

    const blacklistPDA = getBlacklistPDA(this.mint, address)[0];

    const tx = await this.program.methods
      .removeFromBlacklist(address)
      .accounts({
        authority: this.authority.publicKey,
        stablecoinState: this.getStatePDA(),
        blacklistEntry: blacklistPDA,
        targetAddress: address,
        systemProgram: new PublicKey('11111111111111111111111111111111'),
      })
      .signers([this.authority])
      .rpc();

    return tx;
  }

  /**
   * Seize tokens from a blacklisted account
   */
  async seize(params: SeizeParams): Promise<string> {
    this.ensureEnabled();

    if (!this.features.permanentDelegate) {
      throw new Error('Permanent delegate not enabled');
    }

    const amount = toBN(params.amount);
    const blacklistPDA = getBlacklistPDA(this.mint, params.from)[0];

    const tx = await this.program.methods
      .seizeTokens(amount)
      .accounts({
        authority: this.authority.publicKey,
        stablecoinState: this.getStatePDA(),
        mint: this.mint,
        from: params.from,
        to: params.to,
        blacklistEntry: blacklistPDA,
        token2022Program: new PublicKey('TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb'),
      })
      .signers([this.authority])
      .rpc();

    return tx;
  }

  /**
   * Check if an address is blacklisted
   */
  async isBlacklisted(address: PublicKey): Promise<boolean> {
    if (!this.isEnabled()) {
      return false;
    }

    try {
      const blacklistPDA = getBlacklistPDA(this.mint, address)[0];
      await this.program.account.blacklistEntry.fetch(blacklistPDA);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get blacklist entry details
   */
  async getBlacklistEntry(address: PublicKey): Promise<BlacklistEntry | null> {
    if (!this.isEnabled()) {
      return null;
    }

    try {
      const blacklistPDA = getBlacklistPDA(this.mint, address)[0];
      const entry = await this.program.account.blacklistEntry.fetch(blacklistPDA);
      return {
        address: entry.address,
        mint: entry.mint,
        reason: entry.reason,
        addedAt: entry.addedAt,
        addedBy: entry.addedBy,
      };
    } catch {
      return null;
    }
  }

  private ensureEnabled(): void {
    if (!this.isEnabled()) {
      throw new Error('Compliance module not enabled for this stablecoin');
    }
  }

  private getStatePDA(): PublicKey {
    const [pda] = PublicKey.findProgramAddressSync(
      [Buffer.from('stablecoin_state'), this.mint.toBuffer()],
      this.program.programId
    );
    return pda;
  }
}
