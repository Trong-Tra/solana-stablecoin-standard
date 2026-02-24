import { Presets, ExtensionConfig } from './presets';

export interface BaseStablecoinConfig {
  name: string;
  symbol: string;
  uri: string;
  decimals: number;
}

export interface StablecoinConfig extends BaseStablecoinConfig {
  preset: Presets;
  extensions: ExtensionConfig;
}

export interface SSS1Config extends StablecoinConfig {
  preset: Presets.SSS_1;
}

export interface SSS2Config extends StablecoinConfig {
  preset: Presets.SSS_2;
}

export interface CustomConfig extends StablecoinConfig {
  preset: Presets.CUSTOM;
  extensions: Partial<ExtensionConfig>;
}

export function validateConfig(config: StablecoinConfig): void {
  // Validate name
  if (!config.name || config.name.length === 0) {
    throw new Error('Name is required');
  }
  if (config.name.length > 32) {
    throw new Error('Name must be 32 characters or less');
  }

  // Validate symbol
  if (!config.symbol || config.symbol.length === 0) {
    throw new Error('Symbol is required');
  }
  if (config.symbol.length > 10) {
    throw new Error('Symbol must be 10 characters or less');
  }

  // Validate URI
  if (!config.uri || config.uri.length === 0) {
    throw new Error('URI is required');
  }
  if (config.uri.length > 200) {
    throw new Error('URI must be 200 characters or less');
  }

  // Validate decimals
  if (config.decimals < 0 || config.decimals > 9) {
    throw new Error('Decimals must be between 0 and 9');
  }

  // Validate preset
  if (!Object.values(Presets).includes(config.preset)) {
    throw new Error(`Invalid preset: ${config.preset}`);
  }
}

export function toProgramConfig(config: StablecoinConfig) {
  return {
    name: config.name,
    symbol: config.symbol,
    uri: config.uri,
    decimals: config.decimals,
    enablePermanentDelegate: config.extensions.permanentDelegate,
    enableTransferHook: config.extensions.transferHook,
    defaultAccountFrozen: config.extensions.defaultAccountFrozen,
  };
}
