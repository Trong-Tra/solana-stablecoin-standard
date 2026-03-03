import { assert } from 'chai';
import { PublicKey, Keypair } from '@solana/web3.js';
import { ComplianceModule } from '../sdk/src/compliance';
import { ExtensionConfig } from '../sdk/src/presets';

describe('Compliance Module Tests', () => {
  // Mock connection for unit tests
  const mockConnection = {} as any;
  const mockProgram = {} as any;
  const testMint = Keypair.generate().publicKey;
  const testAuthority = Keypair.generate();

  describe('ComplianceModule Construction', () => {
    it('should create module with SSS-2 extensions enabled', () => {
      const extensions: ExtensionConfig = {
        permanentDelegate: true,
        transferHook: true,
        defaultAccountFrozen: false,
        confidentialTransfers: false,
      };

      const module = new ComplianceModule(
        mockConnection,
        mockProgram,
        testMint,
        testAuthority,
        extensions
      );

      assert.instanceOf(module, ComplianceModule);
      assert.isTrue(module.isEnabled());
    });

    it('should create module with SSS-1 extensions disabled', () => {
      const extensions: ExtensionConfig = {
        permanentDelegate: false,
        transferHook: false,
        defaultAccountFrozen: false,
        confidentialTransfers: false,
      };

      const module = new ComplianceModule(
        mockConnection,
        mockProgram,
        testMint,
        testAuthority,
        extensions
      );

      assert.instanceOf(module, ComplianceModule);
      assert.isFalse(module.isEnabled());
    });

    it('should enable compliance with only permanentDelegate', () => {
      const extensions: ExtensionConfig = {
        permanentDelegate: true,
        transferHook: false,
        defaultAccountFrozen: false,
        confidentialTransfers: false,
      };

      const module = new ComplianceModule(
        mockConnection,
        mockProgram,
        testMint,
        testAuthority,
        extensions
      );

      assert.isTrue(module.isEnabled());
    });

    it('should enable compliance with only transferHook', () => {
      const extensions: ExtensionConfig = {
        permanentDelegate: false,
        transferHook: true,
        defaultAccountFrozen: false,
        confidentialTransfers: false,
      };

      const module = new ComplianceModule(
        mockConnection,
        mockProgram,
        testMint,
        testAuthority,
        extensions
      );

      assert.isTrue(module.isEnabled());
    });
  });

  describe('isEnabled Method', () => {
    it('should return true when permanentDelegate is enabled', () => {
      const module = new ComplianceModule(
        mockConnection,
        mockProgram,
        testMint,
        testAuthority,
        {
          permanentDelegate: true,
          transferHook: false,
          defaultAccountFrozen: false,
          confidentialTransfers: false,
        }
      );

      assert.isTrue(module.isEnabled());
    });

    it('should return true when transferHook is enabled', () => {
      const module = new ComplianceModule(
        mockConnection,
        mockProgram,
        testMint,
        testAuthority,
        {
          permanentDelegate: false,
          transferHook: true,
          defaultAccountFrozen: false,
          confidentialTransfers: false,
        }
      );

      assert.isTrue(module.isEnabled());
    });

    it('should return false when both are disabled', () => {
      const module = new ComplianceModule(
        mockConnection,
        mockProgram,
        testMint,
        testAuthority,
        {
          permanentDelegate: false,
          transferHook: false,
          defaultAccountFrozen: false,
          confidentialTransfers: false,
        }
      );

      assert.isFalse(module.isEnabled());
    });

    it('should return true when both are enabled (SSS-2)', () => {
      const module = new ComplianceModule(
        mockConnection,
        mockProgram,
        testMint,
        testAuthority,
        {
          permanentDelegate: true,
          transferHook: true,
          defaultAccountFrozen: false,
          confidentialTransfers: false,
        }
      );

      assert.isTrue(module.isEnabled());
    });
  });

  describe('PDA Generation', () => {
    const extensions: ExtensionConfig = {
      permanentDelegate: true,
      transferHook: true,
      defaultAccountFrozen: false,
      confidentialTransfers: false,
    };

    it('should verify PDA helper is available through utils', () => {
      // Verify that getBlacklistPDA is available in utils
      const { getBlacklistPDA } = require('../sdk/src/utils');
      const address = Keypair.generate().publicKey;
      const [pda, bump] = getBlacklistPDA(testMint, address);
      
      assert.instanceOf(pda, PublicKey);
      assert.isNumber(bump);
    });

    it('should generate consistent blacklist PDA for same address', () => {
      const { getBlacklistPDA } = require('../sdk/src/utils');
      const address = Keypair.generate().publicKey;
      
      const [pda1] = getBlacklistPDA(testMint, address);
      const [pda2] = getBlacklistPDA(testMint, address);

      assert.equal(pda1.toBase58(), pda2.toBase58());
    });

    it('should generate different PDAs for different addresses', () => {
      const { getBlacklistPDA } = require('../sdk/src/utils');
      const address1 = Keypair.generate().publicKey;
      const address2 = Keypair.generate().publicKey;

      const [pda1] = getBlacklistPDA(testMint, address1);
      const [pda2] = getBlacklistPDA(testMint, address2);

      assert.notEqual(pda1.toBase58(), pda2.toBase58());
    });
  });

  describe('Module Functionality', () => {
    it('should create module with correct configuration', () => {
      const module = new ComplianceModule(
        mockConnection,
        mockProgram,
        testMint,
        testAuthority,
        {
          permanentDelegate: true,
          transferHook: true,
          defaultAccountFrozen: false,
          confidentialTransfers: false,
        }
      );

      // Verify module was created and is enabled
      assert.instanceOf(module, ComplianceModule);
      assert.isTrue(module.isEnabled());
    });

    it('should create SSS-1 module that is not enabled', () => {
      const module = new ComplianceModule(
        mockConnection,
        mockProgram,
        testMint,
        testAuthority,
        {
          permanentDelegate: false,
          transferHook: false,
          defaultAccountFrozen: false,
          confidentialTransfers: false,
        }
      );

      assert.instanceOf(module, ComplianceModule);
      assert.isFalse(module.isEnabled());
    });

    it('should detect enabled with only permanentDelegate', () => {
      const module = new ComplianceModule(
        mockConnection,
        mockProgram,
        testMint,
        testAuthority,
        {
          permanentDelegate: true,
          transferHook: false,
          defaultAccountFrozen: false,
          confidentialTransfers: false,
        }
      );

      assert.isTrue(module.isEnabled());
    });

    it('should detect enabled with only transferHook', () => {
      const module = new ComplianceModule(
        mockConnection,
        mockProgram,
        testMint,
        testAuthority,
        {
          permanentDelegate: false,
          transferHook: true,
          defaultAccountFrozen: false,
          confidentialTransfers: false,
        }
      );

      assert.isTrue(module.isEnabled());
    });
  });

  describe('Compliance Features Detection', () => {
    it('should detect seizure capability with permanentDelegate', () => {
      const module = new ComplianceModule(
        mockConnection,
        mockProgram,
        testMint,
        testAuthority,
        {
          permanentDelegate: true,
          transferHook: false,
          defaultAccountFrozen: false,
          confidentialTransfers: false,
        }
      );

      // Seizure requires permanentDelegate
      assert.isTrue(module.isEnabled());
    });

    it('should detect blacklist capability with transferHook', () => {
      const module = new ComplianceModule(
        mockConnection,
        mockProgram,
        testMint,
        testAuthority,
        {
          permanentDelegate: false,
          transferHook: true,
          defaultAccountFrozen: false,
          confidentialTransfers: false,
        }
      );

      // Blacklist requires transferHook
      assert.isTrue(module.isEnabled());
    });

    it('should have full compliance with SSS-2 extensions', () => {
      const module = new ComplianceModule(
        mockConnection,
        mockProgram,
        testMint,
        testAuthority,
        {
          permanentDelegate: true,
          transferHook: true,
          defaultAccountFrozen: false,
          confidentialTransfers: false,
        }
      );

      assert.isTrue(module.isEnabled());
    });
  });

  describe('ExtensionConfig Edge Cases', () => {
    it('should handle all extensions enabled', () => {
      const module = new ComplianceModule(
        mockConnection,
        mockProgram,
        testMint,
        testAuthority,
        {
          permanentDelegate: true,
          transferHook: true,
          defaultAccountFrozen: true,
          confidentialTransfers: true,
        }
      );

      assert.isTrue(module.isEnabled());
    });

    it('should handle all extensions disabled', () => {
      const module = new ComplianceModule(
        mockConnection,
        mockProgram,
        testMint,
        testAuthority,
        {
          permanentDelegate: false,
          transferHook: false,
          defaultAccountFrozen: false,
          confidentialTransfers: false,
        }
      );

      assert.isFalse(module.isEnabled());
    });

    it('should handle mixed extension configuration', () => {
      const module = new ComplianceModule(
        mockConnection,
        mockProgram,
        testMint,
        testAuthority,
        {
          permanentDelegate: true,
          transferHook: false,
          defaultAccountFrozen: true,
          confidentialTransfers: false,
        }
      );

      assert.isTrue(module.isEnabled());
    });
  });
});
