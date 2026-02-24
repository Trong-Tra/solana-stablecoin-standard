export enum Presets {
  SSS_1 = 'sss-1',
  SSS_2 = 'sss-2',
  CUSTOM = 'custom',
}

export interface ExtensionConfig {
  permanentDelegate: boolean;
  transferHook: boolean;
  defaultAccountFrozen: boolean;
  confidentialTransfers: boolean;
}

export const SSS1_EXTENSIONS: ExtensionConfig = {
  permanentDelegate: false,
  transferHook: false,
  defaultAccountFrozen: false,
  confidentialTransfers: false,
};

export const SSS2_EXTENSIONS: ExtensionConfig = {
  permanentDelegate: true,
  transferHook: true,
  defaultAccountFrozen: false,
  confidentialTransfers: false,
};

export function getExtensionsForPreset(preset: Presets): ExtensionConfig {
  switch (preset) {
    case Presets.SSS_1:
      return SSS1_EXTENSIONS;
    case Presets.SSS_2:
      return SSS2_EXTENSIONS;
    case Presets.CUSTOM:
      return SSS1_EXTENSIONS; // Default to minimal, user will customize
    default:
      throw new Error(`Unknown preset: ${preset}`);
  }
}

export interface PresetInfo {
  name: string;
  description: string;
  useCase: string;
  extensions: ExtensionConfig;
  compliance: 'minimal' | 'full';
}

export const PRESET_INFO: Record<Preset, PresetInfo> = {
  [Presets.SSS_1]: {
    name: 'Minimal Stablecoin',
    description: 'Basic stablecoin with mint authority, freeze authority, and metadata.',
    useCase: 'Internal tokens, DAO treasuries, ecosystem settlement',
    extensions: SSS1_EXTENSIONS,
    compliance: 'minimal',
  },
  [Presets.SSS_2]: {
    name: 'Compliant Stablecoin',
    description: 'Full compliance features including blacklist enforcement and token seizure.',
    useCase: 'Regulated stablecoins requiring regulatory compliance',
    extensions: SSS2_EXTENSIONS,
    compliance: 'full',
  },
  [Presets.CUSTOM]: {
    name: 'Custom Configuration',
    description: 'Build your own configuration with selected extensions.',
    useCase: 'Specialized use cases requiring custom features',
    extensions: SSS1_EXTENSIONS,
    compliance: 'custom',
  },
};
