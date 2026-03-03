import { assert } from 'chai';
import { Presets, getExtensionsForPreset, SSS1_EXTENSIONS, SSS2_EXTENSIONS, PRESET_INFO } from '../sdk/src/presets';
import { validateConfig, toProgramConfig } from '../sdk/src/config';
import { toTokenAmount, fromBN, getStablecoinStatePDA, toBN, isValidPublicKey, validateAddress } from '../sdk/src/utils';
import { PublicKey, Keypair } from '@solana/web3.js';
import BN from 'bn.js';

describe('SDK Unit Tests', () => {
  describe('Presets', () => {
    it('should return SSS-1 extensions', () => {
      const ext = getExtensionsForPreset(Presets.SSS_1);
      assert.isFalse(ext.permanentDelegate);
      assert.isFalse(ext.transferHook);
      assert.isFalse(ext.defaultAccountFrozen);
      assert.isFalse(ext.confidentialTransfers);
    });

    it('should return SSS-2 extensions', () => {
      const ext = getExtensionsForPreset(Presets.SSS_2);
      assert.isTrue(ext.permanentDelegate);
      assert.isTrue(ext.transferHook);
      assert.isFalse(ext.defaultAccountFrozen);
      assert.isFalse(ext.confidentialTransfers);
    });

    it('should return CUSTOM extensions (defaults to SSS-1)', () => {
      const ext = getExtensionsForPreset(Presets.CUSTOM);
      assert.deepEqual(ext, SSS1_EXTENSIONS);
    });

    it('should throw for unknown preset', () => {
      assert.throws(() => getExtensionsForPreset('unknown' as Presets), /Unknown preset/);
    });

    it('should have correct SSS-1 preset info', () => {
      assert.equal(PRESET_INFO[Presets.SSS_1].name, 'Minimal Stablecoin');
      assert.equal(PRESET_INFO[Presets.SSS_1].compliance, 'minimal');
    });

    it('should have correct SSS-2 preset info', () => {
      assert.equal(PRESET_INFO[Presets.SSS_2].name, 'Compliant Stablecoin');
      assert.equal(PRESET_INFO[Presets.SSS_2].compliance, 'full');
    });

    it('SSS-1 should have fewer features than SSS-2', () => {
      const sss1Features = Object.values(SSS1_EXTENSIONS).filter(Boolean).length;
      const sss2Features = Object.values(SSS2_EXTENSIONS).filter(Boolean).length;
      assert.isBelow(sss1Features, sss2Features);
    });
  });

  describe('Config Validation', () => {
    it('should validate correct SSS-1 config', () => {
      const config = {
        name: 'Test USD',
        symbol: 'TUSD',
        uri: 'https://test.com',
        decimals: 6,
        preset: Presets.SSS_1,
        extensions: SSS1_EXTENSIONS,
      };
      assert.doesNotThrow(() => validateConfig(config));
    });

    it('should validate correct SSS-2 config', () => {
      const config = {
        name: 'Compliant USD',
        symbol: 'CUSD',
        uri: 'https://test.com',
        decimals: 6,
        preset: Presets.SSS_2,
        extensions: SSS2_EXTENSIONS,
      };
      assert.doesNotThrow(() => validateConfig(config));
    });

    it('should reject long name', () => {
      const config = {
        name: 'A'.repeat(33),
        symbol: 'TUSD',
        uri: 'https://test.com',
        decimals: 6,
        preset: Presets.SSS_1,
        extensions: SSS1_EXTENSIONS,
      };
      assert.throws(() => validateConfig(config), /Name must be 32/);
    });

    it('should accept name at max length', () => {
      const config = {
        name: 'A'.repeat(32),
        symbol: 'TUSD',
        uri: 'https://test.com',
        decimals: 6,
        preset: Presets.SSS_1,
        extensions: SSS1_EXTENSIONS,
      };
      assert.doesNotThrow(() => validateConfig(config));
    });

    it('should reject long symbol', () => {
      const config = {
        name: 'Test',
        symbol: 'A'.repeat(11),
        uri: 'https://test.com',
        decimals: 6,
        preset: Presets.SSS_1,
        extensions: SSS1_EXTENSIONS,
      };
      assert.throws(() => validateConfig(config), /Symbol must be 10/);
    });

    it('should reject long URI', () => {
      const config = {
        name: 'Test',
        symbol: 'TST',
        uri: 'https://test.com/' + 'a'.repeat(200),
        decimals: 6,
        preset: Presets.SSS_1,
        extensions: SSS1_EXTENSIONS,
      };
      assert.throws(() => validateConfig(config), /URI must be 200/);
    });

    it('should reject negative decimals', () => {
      const config = {
        name: 'Test',
        symbol: 'TST',
        uri: 'https://test.com',
        decimals: -1,
        preset: Presets.SSS_1,
        extensions: SSS1_EXTENSIONS,
      };
      assert.throws(() => validateConfig(config), /Decimals must be between/);
    });

    it('should reject decimals > 9', () => {
      const config = {
        name: 'Test',
        symbol: 'TST',
        uri: 'https://test.com',
        decimals: 10,
        preset: Presets.SSS_1,
        extensions: SSS1_EXTENSIONS,
      };
      assert.throws(() => validateConfig(config), /Decimals must be between/);
    });

    it('should convert to program config correctly', () => {
      const config = {
        name: 'Test',
        symbol: 'TST',
        uri: 'https://test.com',
        decimals: 6,
        preset: Presets.SSS_2,
        extensions: SSS2_EXTENSIONS,
      };
      const programConfig = toProgramConfig(config);
      assert.isTrue(programConfig.enablePermanentDelegate);
      assert.isTrue(programConfig.enableTransferHook);
      assert.equal(programConfig.name, 'Test');
      assert.equal(programConfig.decimals, 6);
    });

    it('should reject empty name', () => {
      const config = {
        name: '',
        symbol: 'TST',
        uri: 'https://test.com',
        decimals: 6,
        preset: Presets.SSS_1,
        extensions: SSS1_EXTENSIONS,
      };
      assert.throws(() => validateConfig(config), /Name is required/);
    });

    it('should reject empty symbol', () => {
      const config = {
        name: 'Test',
        symbol: '',
        uri: 'https://test.com',
        decimals: 6,
        preset: Presets.SSS_1,
        extensions: SSS1_EXTENSIONS,
      };
      assert.throws(() => validateConfig(config), /Symbol is required/);
    });

    it('should reject empty URI', () => {
      const config = {
        name: 'Test',
        symbol: 'TST',
        uri: '',
        decimals: 6,
        preset: Presets.SSS_1,
        extensions: SSS1_EXTENSIONS,
      };
      assert.throws(() => validateConfig(config), /URI is required/);
    });
  });

  describe('Utils', () => {
    it('should convert to token amount with 6 decimals', () => {
      const amount = toTokenAmount(100.5, 6);
      assert.equal(amount.toString(), '100500000');
    });

    it('should convert to token amount with 9 decimals', () => {
      const amount = toTokenAmount(1.5, 9);
      assert.equal(amount.toString(), '1500000000');
    });

    it('should convert to token amount with 0 decimals', () => {
      const amount = toTokenAmount(100, 0);
      assert.equal(amount.toString(), '100');
    });

    it('should convert from BN to readable with 6 decimals', () => {
      const bn = new BN('100500000');
      const readable = fromBN(bn, 6);
      assert.equal(readable, 100.5);
    });

    it('should convert from BN to readable with 9 decimals', () => {
      const bn = new BN('1500000000');
      const readable = fromBN(bn, 9);
      assert.equal(readable, 1.5);
    });

    it('should generate valid PDA', () => {
      const mint = new PublicKey('11111111111111111111111111111111');
      const [pda, bump] = getStablecoinStatePDA(mint);
      assert.instanceOf(pda, PublicKey);
      assert.isNumber(bump);
    });

    it('should generate consistent PDA for same mint', () => {
      const mint = Keypair.generate().publicKey;
      const [pda1, bump1] = getStablecoinStatePDA(mint);
      const [pda2, bump2] = getStablecoinStatePDA(mint);
      assert.equal(pda1.toBase58(), pda2.toBase58());
      assert.equal(bump1, bump2);
    });

    it('should convert number to BN', () => {
      const result = toBN(1000);
      assert.isTrue(BN.isBN(result));
      assert.equal(result.toString(), '1000');
    });

    it('should convert string to BN', () => {
      const result = toBN('999999999999');
      assert.equal(result.toString(), '999999999999');
    });

    it('should return BN unchanged', () => {
      const original = new BN(5000);
      const result = toBN(original);
      assert.equal(result.toString(), '5000');
    });

    it('should validate valid public key string', () => {
      assert.isTrue(isValidPublicKey('DTQEHEAvQ1ZuPs3QEHbN8WJFp4C66PjUfCZWj6RLnaBn'));
    });

    it('should validate PublicKey object', () => {
      const key = Keypair.generate().publicKey;
      assert.isTrue(isValidPublicKey(key));
    });

    it('should reject invalid public key', () => {
      assert.isFalse(isValidPublicKey('not-a-valid-key'));
    });

    it('should reject empty string', () => {
      assert.isFalse(isValidPublicKey(''));
    });

    it('should validate address and return PublicKey', () => {
      const validKey = 'DTQEHEAvQ1ZuPs3QEHbN8WJFp4C66PjUfCZWj6RLnaBn';
      const result = validateAddress(validKey, 'test');
      assert.instanceOf(result, PublicKey);
    });

    it('should throw on invalid address', () => {
      assert.throws(() => validateAddress('invalid', 'test'), /Invalid test/);
    });

    it('should handle zero token amount', () => {
      const amount = toTokenAmount(0, 6);
      assert.equal(amount.toString(), '0');
    });

    it('should handle very small amounts', () => {
      const amount = toTokenAmount(0.000001, 6);
      assert.equal(amount.toString(), '1');
    });

    it('should handle fromBN with zero', () => {
      const result = fromBN(new BN(0), 6);
      assert.equal(result, 0);
    });

    it('should handle rounding in toTokenAmount', () => {
      const amount = toTokenAmount(1.1234567, 6);
      assert.equal(amount.toString(), '1123457');
    });
  });

  describe('Edge Cases', () => {
    it('should handle config at boundary values', () => {
      const config = {
        name: 'A'.repeat(32),
        symbol: 'B'.repeat(10),
        uri: 'https://x.com/' + 'c'.repeat(183),
        decimals: 9,
        preset: Presets.SSS_1,
        extensions: SSS1_EXTENSIONS,
      };
      assert.doesNotThrow(() => validateConfig(config));
    });

    it('should handle decimals at minimum value', () => {
      const config = {
        name: 'Test',
        symbol: 'TST',
        uri: 'https://test.com',
        decimals: 0,
        preset: Presets.SSS_1,
        extensions: SSS1_EXTENSIONS,
      };
      assert.doesNotThrow(() => validateConfig(config));
    });
  });
});
