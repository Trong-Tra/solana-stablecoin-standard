import { Connection, Keypair, PublicKey, Transaction } from '@solana/web3.js';
import { AnchorProvider, Program, Wallet, Idl } from '@coral-xyz/anchor';
import { SolanaStablecoin } from './stablecoin';
import { Presets } from './presets';
import { StablecoinConfig, SSS1Config, SSS2Config } from './config';

export { SolanaStablecoin, Presets, StablecoinConfig, SSS1Config, SSS2Config };
export * from './types';
export * from './utils';

// Main entry point
export async function createStablecoin(
  connection: Connection,
  config: StablecoinConfig,
  authority: Keypair
): Promise<SolanaStablecoin> {
  return SolanaStablecoin.create(connection, config, authority);
}

// Preset helpers
export function createSSS1Config(
  name: string,
  symbol: string,
  uri: string,
  decimals: number = 6
): SSS1Config {
  return {
    name,
    symbol,
    uri,
    decimals,
    preset: Presets.SSS_1,
    extensions: {
      permanentDelegate: false,
      transferHook: false,
      defaultAccountFrozen: false,
      confidentialTransfers: false,
    },
  };
}

export function createSSS2Config(
  name: string,
  symbol: string,
  uri: string,
  decimals: number = 6
): SSS2Config {
  return {
    name,
    symbol,
    uri,
    decimals,
    preset: Presets.SSS_2,
    extensions: {
      permanentDelegate: true,
      transferHook: true,
      defaultAccountFrozen: false,
      confidentialTransfers: false,
    },
  };
}
