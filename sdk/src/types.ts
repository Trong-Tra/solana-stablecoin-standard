import { PublicKey } from '@solana/web3.js';
import BN from 'bn.js';

export interface FeatureFlags {
  permanentDelegate: boolean;
  transferHook: boolean;
  defaultAccountFrozen: boolean;
  confidentialTransfers: boolean;
}

export interface StablecoinState {
  masterAuthority: PublicKey;
  mint: PublicKey;
  name: string;
  symbol: string;
  uri: string;
  decimals: number;
  features: FeatureFlags;
  paused: boolean;
  totalMinted: BN;
  totalBurned: BN;
  bump: number;
  version: number;
}

export interface MinterState {
  minter: PublicKey;
  mint: PublicKey;
  quota: BN;
  minted: BN;
  active: boolean;
  bump: number;
}

export interface BurnerState {
  burner: PublicKey;
  mint: PublicKey;
  active: boolean;
  bump: number;
}

export interface BlacklistEntry {
  address: PublicKey;
  mint: PublicKey;
  reason: string;
  addedAt: BN;
  addedBy: PublicKey;
}

export interface MintParams {
  recipient: PublicKey;
  amount: BN | number;
  minter?: PublicKey;
}

export interface BurnParams {
  amount: BN | number;
  from?: PublicKey;
}

export interface FreezeParams {
  targetAccount: PublicKey;
}

export interface SeizeParams {
  from: PublicKey;
  to: PublicKey;
  amount: BN | number;
}

export interface BlacklistParams {
  address: PublicKey;
  reason?: string;
}

export interface UpdateMinterParams {
  minter: PublicKey;
  quota: BN | number;
  active: boolean;
}

export interface UpdateBurnerParams {
  burner: PublicKey;
  active: boolean;
}

export interface RoleInfo {
  address: PublicKey;
  role: 'master' | 'minter' | 'burner' | 'blacklister' | 'pauser' | 'seizer' | 'freezer';
  active: boolean;
}

export interface AuditLogEntry {
  timestamp: number;
  action: string;
  authority: PublicKey;
  details: Record<string, any>;
}
