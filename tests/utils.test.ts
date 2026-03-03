import { assert } from 'chai';
import { PublicKey, Keypair } from '@solana/web3.js';
import BN from 'bn.js';
import {
  getStablecoinStatePDA,
  getMinterStatePDA,
  getBurnerStatePDA,
  getBlacklistPDA,
  toBN,
  fromBN,
  toTokenAmount,
  isValidPublicKey,
  validateAddress,
  SSS_TOKEN_PROGRAM_ID,
  STABLECOIN_STATE_SEED,
  MINTER_STATE_SEED,
  BURNER_STATE_SEED,
  BLACKLIST_SEED,
} from '../sdk/src/utils';

describe('Utils Module Tests', () => {
  const testMint = Keypair.generate().publicKey;
  const testAddress = Keypair.generate().publicKey;
  const testMinter = Keypair.generate().publicKey;

  describe('PDA Generation', () => {
    it('should generate stablecoin state PDA consistently', () => {
      const [pda1, bump1] = getStablecoinStatePDA(testMint);
      const [pda2, bump2] = getStablecoinStatePDA(testMint);
      
      assert.equal(pda1.toBase58(), pda2.toBase58());
      assert.equal(bump1, bump2);
      assert.instanceOf(pda1, PublicKey);
      assert.isNumber(bump1);
    });

    it('should generate different PDAs for different mints', () => {
      const mint1 = Keypair.generate().publicKey;
      const mint2 = Keypair.generate().publicKey;
      
      const [pda1] = getStablecoinStatePDA(mint1);
      const [pda2] = getStablecoinStatePDA(mint2);
      
      assert.notEqual(pda1.toBase58(), pda2.toBase58());
    });

    it('should generate minter state PDA correctly', () => {
      const [pda, bump] = getMinterStatePDA(testMint, testMinter);
      
      assert.instanceOf(pda, PublicKey);
      assert.isNumber(bump);
    });

    it('should generate different minter PDAs for different minters', () => {
      const minter1 = Keypair.generate().publicKey;
      const minter2 = Keypair.generate().publicKey;
      
      const [pda1] = getMinterStatePDA(testMint, minter1);
      const [pda2] = getMinterStatePDA(testMint, minter2);
      
      assert.notEqual(pda1.toBase58(), pda2.toBase58());
    });

    it('should generate burner state PDA correctly', () => {
      const [pda, bump] = getBurnerStatePDA(testMint, testAddress);
      
      assert.instanceOf(pda, PublicKey);
      assert.isNumber(bump);
    });

    it('should generate blacklist PDA correctly', () => {
      const [pda, bump] = getBlacklistPDA(testMint, testAddress);
      
      assert.instanceOf(pda, PublicKey);
      assert.isNumber(bump);
    });

    it('should generate different blacklist PDAs for different addresses', () => {
      const address1 = Keypair.generate().publicKey;
      const address2 = Keypair.generate().publicKey;
      
      const [pda1] = getBlacklistPDA(testMint, address1);
      const [pda2] = getBlacklistPDA(testMint, address2);
      
      assert.notEqual(pda1.toBase58(), pda2.toBase58());
    });

    it('should use correct program ID for PDAs', () => {
      const [pda] = getStablecoinStatePDA(testMint);
      
      // Verify PDA is derived from our program ID
      const [expectedPda] = PublicKey.findProgramAddressSync(
        [STABLECOIN_STATE_SEED, testMint.toBuffer()],
        SSS_TOKEN_PROGRAM_ID
      );
      
      assert.equal(pda.toBase58(), expectedPda.toBase58());
    });
  });

  describe('BN Conversion', () => {
    it('should convert number to BN', () => {
      const result = toBN(1000);
      assert.isTrue(BN.isBN(result));
      assert.equal(result.toString(), '1000');
    });

    it('should convert string to BN', () => {
      const result = toBN('999999999999999');
      assert.isTrue(BN.isBN(result));
      assert.equal(result.toString(), '999999999999999');
    });

    it('should return BN if already BN', () => {
      const original = new BN(5000);
      const result = toBN(original);
      assert.equal(result.toString(), '5000');
    });

    it('should handle large numbers', () => {
      const largeNum = '999999999999999999999';
      const result = toBN(largeNum);
      assert.equal(result.toString(), largeNum);
    });

    it('should handle zero', () => {
      const result = toBN(0);
      assert.equal(result.toString(), '0');
    });
  });

  describe('fromBN Conversion', () => {
    it('should convert BN to number with 6 decimals', () => {
      const bn = new BN('100500000');
      const result = fromBN(bn, 6);
      assert.equal(result, 100.5);
    });

    it('should convert BN to number with 9 decimals', () => {
      const bn = new BN('1000000000');
      const result = fromBN(bn, 9);
      assert.equal(result, 1);
    });

    it('should convert BN to number with 0 decimals', () => {
      const bn = new BN('100');
      const result = fromBN(bn, 0);
      assert.equal(result, 100);
    });

    it('should handle very small amounts', () => {
      const bn = new BN('1');
      const result = fromBN(bn, 6);
      assert.equal(result, 0.000001);
    });

    it('should handle zero', () => {
      const bn = new BN('0');
      const result = fromBN(bn, 6);
      assert.equal(result, 0);
    });

    it('should default to 6 decimals', () => {
      const bn = new BN('1000000');
      const result = fromBN(bn);
      assert.equal(result, 1);
    });
  });

  describe('toTokenAmount Conversion', () => {
    it('should convert whole number to token amount', () => {
      const result = toTokenAmount(100, 6);
      assert.equal(result.toString(), '100000000');
    });

    it('should convert decimal to token amount', () => {
      const result = toTokenAmount(100.5, 6);
      assert.equal(result.toString(), '100500000');
    });

    it('should handle 9 decimals', () => {
      const result = toTokenAmount(1.5, 9);
      assert.equal(result.toString(), '1500000000');
    });

    it('should handle 0 decimals', () => {
      const result = toTokenAmount(100, 0);
      assert.equal(result.toString(), '100');
    });

    it('should handle very small amounts', () => {
      const result = toTokenAmount(0.000001, 6);
      assert.equal(result.toString(), '1');
    });

    it('should handle zero', () => {
      const result = toTokenAmount(0, 6);
      assert.equal(result.toString(), '0');
    });

    it('should handle rounding', () => {
      const result = toTokenAmount(1.1234567, 6);
      assert.equal(result.toString(), '1123457');
    });
  });

  describe('PublicKey Validation', () => {
    it('should validate valid base58 public key string', () => {
      const validKey = 'DTQEHEAvQ1ZuPs3QEHbN8WJFp4C66PjUfCZWj6RLnaBn';
      assert.isTrue(isValidPublicKey(validKey));
    });

    it('should validate PublicKey object', () => {
      assert.isTrue(isValidPublicKey(testMint));
    });

    it('should reject invalid string', () => {
      assert.isFalse(isValidPublicKey('not-a-valid-key'));
    });

    it('should reject empty string', () => {
      assert.isFalse(isValidPublicKey(''));
    });

    it('should reject too long string', () => {
      assert.isFalse(isValidPublicKey('a'.repeat(100)));
    });

    it('should reject special characters', () => {
      assert.isFalse(isValidPublicKey('!!!invalid!!!'));
    });
  });

  describe('validateAddress', () => {
    it('should return PublicKey from valid string', () => {
      const validKey = 'DTQEHEAvQ1ZuPs3QEHbN8WJFp4C66PjUfCZWj6RLnaBn';
      const result = validateAddress(validKey, 'test');
      assert.instanceOf(result, PublicKey);
    });

    it('should return same PublicKey from PublicKey object', () => {
      const result = validateAddress(testMint, 'test');
      assert.equal(result.toBase58(), testMint.toBase58());
    });

    it('should throw error for invalid address', () => {
      assert.throws(
        () => validateAddress('invalid', 'recipient'),
        /Invalid recipient/
      );
    });

    it('should include field name in error', () => {
      assert.throws(
        () => validateAddress('bad-key', 'mint'),
        /Invalid mint/
      );
    });
  });

  describe('Program Constants', () => {
    it('should have valid program ID format', () => {
      assert.instanceOf(SSS_TOKEN_PROGRAM_ID, PublicKey);
    });

    it('should have correct seed buffers', () => {
      assert.instanceOf(STABLECOIN_STATE_SEED, Buffer);
      assert.equal(STABLECOIN_STATE_SEED.toString(), 'stablecoin_state');
      
      assert.instanceOf(MINTER_STATE_SEED, Buffer);
      assert.equal(MINTER_STATE_SEED.toString(), 'minter_state');
      
      assert.instanceOf(BURNER_STATE_SEED, Buffer);
      assert.equal(BURNER_STATE_SEED.toString(), 'burner_state');
      
      assert.instanceOf(BLACKLIST_SEED, Buffer);
      assert.equal(BLACKLIST_SEED.toString(), 'blacklist');
    });
  });
});
