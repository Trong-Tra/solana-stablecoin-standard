import { assert } from 'chai';
import { Presets, getExtensionsForPreset, SSS1_EXTENSIONS, SSS2_EXTENSIONS } from '../sdk/src/presets';
import { validateConfig, toProgramConfig } from '../sdk/src/config';
import { toTokenAmount, fromBN, getStablecoinStatePDA } from '../sdk/src/utils';
import { PublicKey } from '@solana/web3.js';
import BN from 'bn.js';

describe('SDK Unit Tests', () => {
  describe('Presets', () => {
    it('should return SSS-1 extensions', () => {
      const ext = getExtensionsForPreset(Presets.SSS_1);
      assert.isFalse(ext.permanentDelegate);
      assert.isFalse(ext.transferHook);
    });

    it('should return SSS-2 extensions', () => {
      const ext = getExtensionsForPreset(Presets.SSS_2);
      assert.isTrue(ext.permanentDelegate);
      assert.isTrue(ext.transferHook);
    });
  });

  describe('Config Validation', () => {
    it('should validate correct config', () => {
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

    it('should convert to program config', () => {
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
    });
  });

  describe('Utils', () => {
    it('should convert to token amount', () => {
      const amount = toTokenAmount(100.5, 6);
      assert.equal(amount.toString(), '100500000');
    });

    it('should convert from BN to readable', () => {
      const bn = new BN('100500000');
      const readable = fromBN(bn, 6);
      assert.equal(readable, 100.5);
    });

    it('should generate valid PDA', () => {
      const mint = new PublicKey('11111111111111111111111111111111');
      const [pda, bump] = getStablecoinStatePDA(mint);
      assert.instanceOf(pda, PublicKey);
      assert.isNumber(bump);
    });
  });
});
