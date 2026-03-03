import { assert } from 'chai';
import { PublicKey, Keypair } from '@solana/web3.js';
import BN from 'bn.js';
import {
  StablecoinState,
  MinterState,
  BurnerState,
  BlacklistEntry,
  MintParams,
  BurnParams,
  FreezeParams,
  ThawParams,
  UpdateMinterParams,
  UpdateBurnerParams,
  SeizeParams,
  BlacklistAddParams,
  FeatureFlags,
} from '../sdk/src/types';

describe('Types Module Tests', () => {
  const testKey = Keypair.generate().publicKey;

  describe('StablecoinState Interface', () => {
    it('should accept valid StablecoinState', () => {
      const state: StablecoinState = {
        masterAuthority: testKey,
        mint: testKey,
        name: 'Test USD',
        symbol: 'TUSD',
        uri: 'https://example.com/metadata.json',
        decimals: 6,
        features: {
          permanentDelegate: false,
          transferHook: false,
          defaultAccountFrozen: false,
          confidentialTransfers: false,
        },
        paused: false,
        totalMinted: new BN(1000000),
        totalBurned: new BN(0),
      };

      assert.equal(state.name, 'Test USD');
      assert.equal(state.symbol, 'TUSD');
      assert.equal(state.decimals, 6);
      assert.isFalse(state.paused);
    });

    it('should handle paused state', () => {
      const state: StablecoinState = {
        masterAuthority: testKey,
        mint: testKey,
        name: 'Test USD',
        symbol: 'TUSD',
        uri: 'https://example.com',
        decimals: 6,
        features: {
          permanentDelegate: false,
          transferHook: false,
          defaultAccountFrozen: false,
          confidentialTransfers: false,
        },
        paused: true,
        totalMinted: new BN(0),
        totalBurned: new BN(0),
      };

      assert.isTrue(state.paused);
    });

    it('should handle SSS-2 features', () => {
      const state: StablecoinState = {
        masterAuthority: testKey,
        mint: testKey,
        name: 'Compliant USD',
        symbol: 'CUSD',
        uri: 'https://example.com',
        decimals: 6,
        features: {
          permanentDelegate: true,
          transferHook: true,
          defaultAccountFrozen: false,
          confidentialTransfers: false,
        },
        paused: false,
        totalMinted: new BN(1000000000),
        totalBurned: new BN(1000000),
      };

      assert.isTrue(state.features.permanentDelegate);
      assert.isTrue(state.features.transferHook);
      assert.equal(state.totalMinted.toString(), '1000000000');
      assert.equal(state.totalBurned.toString(), '1000000');
    });
  });

  describe('FeatureFlags Interface', () => {
    it('should accept minimal feature flags', () => {
      const flags: FeatureFlags = {
        permanentDelegate: false,
        transferHook: false,
        defaultAccountFrozen: false,
        confidentialTransfers: false,
      };

      assert.isFalse(flags.permanentDelegate);
      assert.isFalse(flags.transferHook);
    });

    it('should accept full feature flags (SSS-2)', () => {
      const flags: FeatureFlags = {
        permanentDelegate: true,
        transferHook: true,
        defaultAccountFrozen: true,
        confidentialTransfers: true,
      };

      assert.isTrue(flags.permanentDelegate);
      assert.isTrue(flags.transferHook);
      assert.isTrue(flags.defaultAccountFrozen);
      assert.isTrue(flags.confidentialTransfers);
    });

    it('should accept mixed feature flags', () => {
      const flags: FeatureFlags = {
        permanentDelegate: true,
        transferHook: false,
        defaultAccountFrozen: true,
        confidentialTransfers: false,
      };

      assert.isTrue(flags.permanentDelegate);
      assert.isFalse(flags.transferHook);
      assert.isTrue(flags.defaultAccountFrozen);
      assert.isFalse(flags.confidentialTransfers);
    });
  });

  describe('MinterState Interface', () => {
    it('should accept valid MinterState', () => {
      const state: MinterState = {
        minter: testKey,
        quota: new BN(1000000),
        minted: new BN(500000),
        active: true,
      };

      assert.equal(state.minter.toBase58(), testKey.toBase58());
      assert.equal(state.quota.toString(), '1000000');
      assert.equal(state.minted.toString(), '500000');
      assert.isTrue(state.active);
    });

    it('should handle unlimited quota (zero)', () => {
      const state: MinterState = {
        minter: testKey,
        quota: new BN(0),
        minted: new BN(1000000),
        active: true,
      };

      assert.equal(state.quota.toString(), '0');
    });

    it('should handle inactive minter', () => {
      const state: MinterState = {
        minter: testKey,
        quota: new BN(1000000),
        minted: new BN(0),
        active: false,
      };

      assert.isFalse(state.active);
    });
  });

  describe('BurnerState Interface', () => {
    it('should accept valid BurnerState', () => {
      const state: BurnerState = {
        burner: testKey,
        active: true,
      };

      assert.equal(state.burner.toBase58(), testKey.toBase58());
      assert.isTrue(state.active);
    });

    it('should handle inactive burner', () => {
      const state: BurnerState = {
        burner: testKey,
        active: false,
      };

      assert.isFalse(state.active);
    });
  });

  describe('BlacklistEntry Interface', () => {
    it('should accept valid BlacklistEntry', () => {
      const entry: BlacklistEntry = {
        address: testKey,
        reason: 'OFAC match',
        addedAt: new BN(1234567890),
        addedBy: testKey,
      };

      assert.equal(entry.address.toBase58(), testKey.toBase58());
      assert.equal(entry.reason, 'OFAC match');
      assert.equal(entry.addedAt.toString(), '1234567890');
      assert.equal(entry.addedBy.toBase58(), testKey.toBase58());
    });

    it('should handle empty reason', () => {
      const entry: BlacklistEntry = {
        address: testKey,
        reason: '',
        addedAt: new BN(0),
        addedBy: testKey,
      };

      assert.equal(entry.reason, '');
    });

    it('should handle long reason', () => {
      const entry: BlacklistEntry = {
        address: testKey,
        reason: 'A'.repeat(200),
        addedAt: new BN(9999999999),
        addedBy: testKey,
      };

      assert.equal(entry.reason.length, 200);
    });
  });

  describe('MintParams Interface', () => {
    it('should accept valid MintParams', () => {
      const params: MintParams = {
        recipient: testKey,
        amount: new BN(1000000),
      };

      assert.equal(params.recipient.toBase58(), testKey.toBase58());
      assert.equal(params.amount.toString(), '1000000');
    });

    it('should handle large amounts', () => {
      const params: MintParams = {
        recipient: testKey,
        amount: new BN('999999999999999'),
      };

      assert.equal(params.amount.toString(), '999999999999999');
    });

    it('should handle zero amount', () => {
      const params: MintParams = {
        recipient: testKey,
        amount: new BN(0),
      };

      assert.equal(params.amount.toString(), '0');
    });
  });

  describe('BurnParams Interface', () => {
    it('should accept valid BurnParams with amount only', () => {
      const params: BurnParams = {
        amount: new BN(500000),
      };

      assert.equal(params.amount.toString(), '500000');
    });

    it('should accept BurnParams with from address', () => {
      const fromKey = Keypair.generate().publicKey;
      const params: BurnParams = {
        amount: new BN(500000),
        from: fromKey,
      };

      assert.equal(params.amount.toString(), '500000');
      assert.equal(params.from?.toBase58(), fromKey.toBase58());
    });
  });

  describe('FreezeParams Interface', () => {
    it('should accept valid FreezeParams', () => {
      const params: FreezeParams = {
        targetAccount: testKey,
      };

      assert.equal(params.targetAccount.toBase58(), testKey.toBase58());
    });
  });

  describe('ThawParams Interface', () => {
    it('should accept valid ThawParams', () => {
      const params: ThawParams = {
        targetAccount: testKey,
      };

      assert.equal(params.targetAccount.toBase58(), testKey.toBase58());
    });
  });

  describe('UpdateMinterParams Interface', () => {
    it('should accept valid UpdateMinterParams', () => {
      const params: UpdateMinterParams = {
        minter: testKey,
        quota: new BN(1000000),
        active: true,
      };

      assert.equal(params.minter.toBase58(), testKey.toBase58());
      assert.equal(params.quota.toString(), '1000000');
      assert.isTrue(params.active);
    });

    it('should handle unlimited quota', () => {
      const params: UpdateMinterParams = {
        minter: testKey,
        quota: new BN(0),
        active: true,
      };

      assert.equal(params.quota.toString(), '0');
    });

    it('should handle deactivation', () => {
      const params: UpdateMinterParams = {
        minter: testKey,
        quota: new BN(0),
        active: false,
      };

      assert.isFalse(params.active);
    });
  });

  describe('UpdateBurnerParams Interface', () => {
    it('should accept valid UpdateBurnerParams', () => {
      const params: UpdateBurnerParams = {
        burner: testKey,
        active: true,
      };

      assert.equal(params.burner.toBase58(), testKey.toBase58());
      assert.isTrue(params.active);
    });

    it('should handle deactivation', () => {
      const params: UpdateBurnerParams = {
        burner: testKey,
        active: false,
      };

      assert.isFalse(params.active);
    });
  });

  describe('SeizeParams Interface', () => {
    it('should accept valid SeizeParams', () => {
      const fromKey = Keypair.generate().publicKey;
      const toKey = Keypair.generate().publicKey;

      const params: SeizeParams = {
        from: fromKey,
        to: toKey,
        amount: new BN(1000000),
      };

      assert.equal(params.from.toBase58(), fromKey.toBase58());
      assert.equal(params.to.toBase58(), toKey.toBase58());
      assert.equal(params.amount.toString(), '1000000');
    });

    it('should handle large seizure amounts', () => {
      const params: SeizeParams = {
        from: testKey,
        to: testKey,
        amount: new BN('999999999999999'),
      };

      assert.equal(params.amount.toString(), '999999999999999');
    });
  });

  describe('BlacklistAddParams Interface', () => {
    it('should accept valid BlacklistAddParams', () => {
      const params: BlacklistAddParams = {
        address: testKey,
        reason: 'OFAC sanctions match',
      };

      assert.equal(params.address.toBase58(), testKey.toBase58());
      assert.equal(params.reason, 'OFAC sanctions match');
    });

    it('should accept params without reason', () => {
      const params: BlacklistAddParams = {
        address: testKey,
      };

      assert.equal(params.address.toBase58(), testKey.toBase58());
      assert.isUndefined(params.reason);
    });

    it('should accept empty reason', () => {
      const params: BlacklistAddParams = {
        address: testKey,
        reason: '',
      };

      assert.equal(params.reason, '');
    });
  });
});
