import { assert } from 'chai';
import { 
  validateConfig, 
  toProgramConfig, 
  BaseStablecoinConfig,
  StablecoinConfig 
} from '../sdk/src/config';
import { Presets, SSS1_EXTENSIONS, SSS2_EXTENSIONS } from '../sdk/src/presets';

describe('Config Module Tests', () => {
  describe('validateConfig', () => {
    it('should accept valid SSS-1 config', () => {
      const config: StablecoinConfig = {
        name: 'Test USD',
        symbol: 'TUSD',
        uri: 'https://example.com/metadata.json',
        decimals: 6,
        preset: Presets.SSS_1,
        extensions: SSS1_EXTENSIONS,
      };
      assert.doesNotThrow(() => validateConfig(config));
    });

    it('should accept valid SSS-2 config', () => {
      const config: StablecoinConfig = {
        name: 'Compliant USD',
        symbol: 'CUSD',
        uri: 'https://example.com/metadata.json',
        decimals: 6,
        preset: Presets.SSS_2,
        extensions: SSS2_EXTENSIONS,
      };
      assert.doesNotThrow(() => validateConfig(config));
    });

    it('should accept valid custom config', () => {
      const config: StablecoinConfig = {
        name: 'Custom Token',
        symbol: 'CTKN',
        uri: 'https://example.com/custom.json',
        decimals: 9,
        preset: Presets.CUSTOM,
        extensions: {
          permanentDelegate: true,
          transferHook: false,
          defaultAccountFrozen: false,
          confidentialTransfers: false,
        },
      };
      assert.doesNotThrow(() => validateConfig(config));
    });

    it('should reject empty name', () => {
      const config: StablecoinConfig = {
        name: '',
        symbol: 'TST',
        uri: 'https://test.com',
        decimals: 6,
        preset: Presets.SSS_1,
        extensions: SSS1_EXTENSIONS,
      };
      assert.throws(() => validateConfig(config), /Name is required/);
    });

    it('should reject name exceeding 32 characters', () => {
      const config: StablecoinConfig = {
        name: 'A'.repeat(33),
        symbol: 'TST',
        uri: 'https://test.com',
        decimals: 6,
        preset: Presets.SSS_1,
        extensions: SSS1_EXTENSIONS,
      };
      assert.throws(() => validateConfig(config), /Name must be 32 characters or less/);
    });

    it('should accept name at exactly 32 characters', () => {
      const config: StablecoinConfig = {
        name: 'A'.repeat(32),
        symbol: 'TST',
        uri: 'https://test.com',
        decimals: 6,
        preset: Presets.SSS_1,
        extensions: SSS1_EXTENSIONS,
      };
      assert.doesNotThrow(() => validateConfig(config));
    });

    it('should reject empty symbol', () => {
      const config: StablecoinConfig = {
        name: 'Test Token',
        symbol: '',
        uri: 'https://test.com',
        decimals: 6,
        preset: Presets.SSS_1,
        extensions: SSS1_EXTENSIONS,
      };
      assert.throws(() => validateConfig(config), /Symbol is required/);
    });

    it('should reject symbol exceeding 10 characters', () => {
      const config: StablecoinConfig = {
        name: 'Test Token',
        symbol: 'VERYLONGSYM',
        uri: 'https://test.com',
        decimals: 6,
        preset: Presets.SSS_1,
        extensions: SSS1_EXTENSIONS,
      };
      assert.throws(() => validateConfig(config), /Symbol must be 10 characters or less/);
    });

    it('should accept symbol at exactly 10 characters', () => {
      const config: StablecoinConfig = {
        name: 'Test Token',
        symbol: 'A'.repeat(10),
        uri: 'https://test.com',
        decimals: 6,
        preset: Presets.SSS_1,
        extensions: SSS1_EXTENSIONS,
      };
      assert.doesNotThrow(() => validateConfig(config));
    });

    it('should reject empty URI', () => {
      const config: StablecoinConfig = {
        name: 'Test Token',
        symbol: 'TST',
        uri: '',
        decimals: 6,
        preset: Presets.SSS_1,
        extensions: SSS1_EXTENSIONS,
      };
      assert.throws(() => validateConfig(config), /URI is required/);
    });

    it('should reject URI exceeding 200 characters', () => {
      const config: StablecoinConfig = {
        name: 'Test Token',
        symbol: 'TST',
        uri: 'https://example.com/' + 'a'.repeat(200),
        decimals: 6,
        preset: Presets.SSS_1,
        extensions: SSS1_EXTENSIONS,
      };
      assert.throws(() => validateConfig(config), /URI must be 200 characters or less/);
    });

    it('should accept URI at exactly 200 characters', () => {
      const config: StablecoinConfig = {
        name: 'Test Token',
        symbol: 'TST',
        uri: 'https://ex.com/' + 'a'.repeat(182),
        decimals: 6,
        preset: Presets.SSS_1,
        extensions: SSS1_EXTENSIONS,
      };
      assert.doesNotThrow(() => validateConfig(config));
    });

    it('should reject negative decimals', () => {
      const config: StablecoinConfig = {
        name: 'Test Token',
        symbol: 'TST',
        uri: 'https://test.com',
        decimals: -1,
        preset: Presets.SSS_1,
        extensions: SSS1_EXTENSIONS,
      };
      assert.throws(() => validateConfig(config), /Decimals must be between 0 and 9/);
    });

    it('should reject decimals greater than 9', () => {
      const config: StablecoinConfig = {
        name: 'Test Token',
        symbol: 'TST',
        uri: 'https://test.com',
        decimals: 10,
        preset: Presets.SSS_1,
        extensions: SSS1_EXTENSIONS,
      };
      assert.throws(() => validateConfig(config), /Decimals must be between 0 and 9/);
    });

    it('should accept decimals at 0', () => {
      const config: StablecoinConfig = {
        name: 'Test Token',
        symbol: 'TST',
        uri: 'https://test.com',
        decimals: 0,
        preset: Presets.SSS_1,
        extensions: SSS1_EXTENSIONS,
      };
      assert.doesNotThrow(() => validateConfig(config));
    });

    it('should accept decimals at 9', () => {
      const config: StablecoinConfig = {
        name: 'Test Token',
        symbol: 'TST',
        uri: 'https://test.com',
        decimals: 9,
        preset: Presets.SSS_1,
        extensions: SSS1_EXTENSIONS,
      };
      assert.doesNotThrow(() => validateConfig(config));
    });

    it('should reject invalid preset', () => {
      const config = {
        name: 'Test Token',
        symbol: 'TST',
        uri: 'https://test.com',
        decimals: 6,
        preset: 'invalid-preset',
        extensions: SSS1_EXTENSIONS,
      } as StablecoinConfig;
      assert.throws(() => validateConfig(config), /Invalid preset/);
    });
  });

  describe('toProgramConfig', () => {
    it('should convert SSS-1 config correctly', () => {
      const config: StablecoinConfig = {
        name: 'Test USD',
        symbol: 'TUSD',
        uri: 'https://example.com/metadata.json',
        decimals: 6,
        preset: Presets.SSS_1,
        extensions: SSS1_EXTENSIONS,
      };
      
      const programConfig = toProgramConfig(config);
      
      assert.equal(programConfig.name, 'Test USD');
      assert.equal(programConfig.symbol, 'TUSD');
      assert.equal(programConfig.uri, 'https://example.com/metadata.json');
      assert.equal(programConfig.decimals, 6);
      assert.isFalse(programConfig.enablePermanentDelegate);
      assert.isFalse(programConfig.enableTransferHook);
      assert.isFalse(programConfig.defaultAccountFrozen);
    });

    it('should convert SSS-2 config correctly', () => {
      const config: StablecoinConfig = {
        name: 'Compliant USD',
        symbol: 'CUSD',
        uri: 'https://example.com/metadata.json',
        decimals: 6,
        preset: Presets.SSS_2,
        extensions: SSS2_EXTENSIONS,
      };
      
      const programConfig = toProgramConfig(config);
      
      assert.equal(programConfig.name, 'Compliant USD');
      assert.equal(programConfig.symbol, 'CUSD');
      assert.equal(programConfig.decimals, 6);
      assert.isTrue(programConfig.enablePermanentDelegate);
      assert.isTrue(programConfig.enableTransferHook);
      assert.isFalse(programConfig.defaultAccountFrozen);
    });

    it('should handle custom extension config', () => {
      const config: StablecoinConfig = {
        name: 'Custom Token',
        symbol: 'CTKN',
        uri: 'https://example.com/custom.json',
        decimals: 9,
        preset: Presets.CUSTOM,
        extensions: {
          permanentDelegate: true,
          transferHook: false,
          defaultAccountFrozen: true,
          confidentialTransfers: false,
        },
      };
      
      const programConfig = toProgramConfig(config);
      
      assert.isTrue(programConfig.enablePermanentDelegate);
      assert.isFalse(programConfig.enableTransferHook);
      assert.isTrue(programConfig.defaultAccountFrozen);
    });
  });
});
