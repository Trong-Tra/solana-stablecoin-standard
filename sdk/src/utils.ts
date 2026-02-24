import { PublicKey, Connection } from '@solana/web3.js';
import BN from 'bn.js';

// Program IDs (replace with actual deployed addresses)
// Using SystemProgram as placeholder - replace with real program IDs after deployment
export const SSS_TOKEN_PROGRAM_ID = new PublicKey(
  'SSSs1yQf3L1UvAbq3jS1T3vR2Q3jL5K7mN8pP4qR5sT'
);

export const SSS_TRANSFER_HOOK_PROGRAM_ID = new PublicKey(
  'SSSh1yQf3L1UvAbq3jS1T3vR2Q3jL5K7mN8pP4qR5sT'
);

// PDA seeds
export const STABLECOIN_STATE_SEED = Buffer.from('stablecoin_state');
export const MINTER_STATE_SEED = Buffer.from('minter_state');
export const BURNER_STATE_SEED = Buffer.from('burner_state');
export const BLACKLIST_SEED = Buffer.from('blacklist');

// Get PDA helpers
export function getStablecoinStatePDA(mint: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [STABLECOIN_STATE_SEED, mint.toBuffer()],
    SSS_TOKEN_PROGRAM_ID
  );
}

export function getMinterStatePDA(
  mint: PublicKey,
  minter: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [MINTER_STATE_SEED, mint.toBuffer(), minter.toBuffer()],
    SSS_TOKEN_PROGRAM_ID
  );
}

export function getBurnerStatePDA(
  mint: PublicKey,
  burner: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [BURNER_STATE_SEED, mint.toBuffer(), burner.toBuffer()],
    SSS_TOKEN_PROGRAM_ID
  );
}

export function getBlacklistPDA(
  mint: PublicKey,
  address: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [BLACKLIST_SEED, mint.toBuffer(), address.toBuffer()],
    SSS_TOKEN_PROGRAM_ID
  );
}

// Amount conversion helpers
export function toBN(amount: number | BN | string): BN {
  if (BN.isBN(amount)) {
    return amount;
  }
  if (typeof amount === 'string') {
    return new BN(amount);
  }
  return new BN(amount);
}

export function fromBN(amount: BN, decimals: number = 6): number {
  const divisor = new BN(10).pow(new BN(decimals));
  const integer = amount.div(divisor).toNumber();
  const fractional = amount.mod(divisor).toNumber() / Math.pow(10, decimals);
  return integer + fractional;
}

export function toTokenAmount(amount: number, decimals: number = 6): BN {
  const multiplier = Math.pow(10, decimals);
  return new BN(Math.round(amount * multiplier));
}

// Validation helpers
export function isValidPublicKey(key: string | PublicKey): boolean {
  try {
    if (typeof key === 'string') {
      new PublicKey(key);
    }
    return true;
  } catch {
    return false;
  }
}

export function validateAddress(address: string | PublicKey, name: string): PublicKey {
  try {
    if (typeof address === 'string') {
      return new PublicKey(address);
    }
    return address;
  } catch {
    throw new Error(`Invalid ${name}: ${address}`);
  }
}

// Connection helper
export async function confirmTransaction(
  connection: Connection,
  signature: string,
  commitment: 'processed' | 'confirmed' | 'finalized' = 'confirmed'
): Promise<void> {
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
  await connection.confirmTransaction(
    {
      signature,
      blockhash,
      lastValidBlockHeight,
    },
    commitment
  );
}

// Retry helper
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delayMs * (i + 1)));
      }
    }
  }
  
  throw lastError!;
}
