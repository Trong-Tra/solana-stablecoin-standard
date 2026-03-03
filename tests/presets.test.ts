import { assert } from 'chai';
import {
  Presets,
  ExtensionConfig,
  SSS1_EXTENSIONS,
  SSS2_EXTENSIONS,
  getExtensionsForPreset,
  PRESET_INFO,
  PresetInfo,
} from '../sdk/src/presets';

describe('Presets Module Tests', () => {
  describe('Preset Enum', () => {
    it('should have SSS_1 preset', () => {
      assert.equal(Presets.SSS_1, 'sss-1');
    });

    it('should have SSS_2 preset', () => {
      assert.equal(Presets.SSS_2, 'sss-2');
    });

    it('should have CUSTOM preset', () => {
      assert.equal(Presets.CUSTOM, 'custom');
    });

    it('should have exactly 3 presets', () => {
      const presetValues = Object.values(Presets);
      assert.equal(presetValues.length, 3);
    });
  });

  describe('SSS-1 Extensions', () => {
    it('should have all extension fields', () => {
      assert.property(SSS1_EXTENSIONS, 'permanentDelegate');
      assert.property(SSS1_EXTENSIONS, 'transferHook');
      assert.property(SSS1_EXTENSIONS, 'defaultAccountFrozen');
      assert.property(SSS1_EXTENSIONS, 'confidentialTransfers');
    });

    it('should have permanentDelegate disabled', () => {
      assert.isFalse(SSS1_EXTENSIONS.permanentDelegate);
    });

    it('should have transferHook disabled', () => {
      assert.isFalse(SSS1_EXTENSIONS.transferHook);
    });

    it('should have defaultAccountFrozen disabled', () => {
      assert.isFalse(SSS1_EXTENSIONS.defaultAccountFrozen);
    });

    it('should have confidentialTransfers disabled', () => {
      assert.isFalse(SSS1_EXTENSIONS.confidentialTransfers);
    });
  });

  describe('SSS-2 Extensions', () => {
    it('should have all extension fields', () => {
      assert.property(SSS2_EXTENSIONS, 'permanentDelegate');
      assert.property(SSS2_EXTENSIONS, 'transferHook');
      assert.property(SSS2_EXTENSIONS, 'defaultAccountFrozen');
      assert.property(SSS2_EXTENSIONS, 'confidentialTransfers');
    });

    it('should have permanentDelegate enabled', () => {
      assert.isTrue(SSS2_EXTENSIONS.permanentDelegate);
    });

    it('should have transferHook enabled', () => {
      assert.isTrue(SSS2_EXTENSIONS.transferHook);
    });

    it('should have defaultAccountFrozen disabled', () => {
      assert.isFalse(SSS2_EXTENSIONS.defaultAccountFrozen);
    });

    it('should have confidentialTransfers disabled', () => {
      assert.isFalse(SSS2_EXTENSIONS.confidentialTransfers);
    });
  });

  describe('getExtensionsForPreset', () => {
    it('should return SSS1_EXTENSIONS for SSS_1 preset', () => {
      const extensions = getExtensionsForPreset(Presets.SSS_1);
      assert.deepEqual(extensions, SSS1_EXTENSIONS);
    });

    it('should return SSS2_EXTENSIONS for SSS_2 preset', () => {
      const extensions = getExtensionsForPreset(Presets.SSS_2);
      assert.deepEqual(extensions, SSS2_EXTENSIONS);
    });

    it('should return SSS1_EXTENSIONS as default for CUSTOM preset', () => {
      const extensions = getExtensionsForPreset(Presets.CUSTOM);
      assert.deepEqual(extensions, SSS1_EXTENSIONS);
    });

    it('should throw error for unknown preset', () => {
      assert.throws(
        () => getExtensionsForPreset('unknown' as Presets),
        /Unknown preset/
      );
    });

    it('should return independent copies', () => {
      const ext1 = getExtensionsForPreset(Presets.SSS_1);
      const ext2 = getExtensionsForPreset(Presets.SSS_1);
      // Should be equal in value
      assert.deepEqual(ext1, ext2);
    });
  });

  describe('PRESET_INFO', () => {
    it('should have info for SSS_1', () => {
      assert.property(PRESET_INFO, Presets.SSS_1);
    });

    it('should have info for SSS_2', () => {
      assert.property(PRESET_INFO, Presets.SSS_2);
    });

    it('should have info for CUSTOM', () => {
      assert.property(PRESET_INFO, Presets.CUSTOM);
    });

    describe('SSS-1 Info', () => {
      const info = PRESET_INFO[Presets.SSS_1];

      it('should have correct name', () => {
        assert.equal(info.name, 'Minimal Stablecoin');
      });

      it('should have description', () => {
        assert.isString(info.description);
        assert.isAbove(info.description.length, 0);
      });

      it('should have useCase', () => {
        assert.isString(info.useCase);
        assert.include(info.useCase, 'Internal');
      });

      it('should have SSS1 extensions', () => {
        assert.deepEqual(info.extensions, SSS1_EXTENSIONS);
      });

      it('should have minimal compliance level', () => {
        assert.equal(info.compliance, 'minimal');
      });
    });

    describe('SSS-2 Info', () => {
      const info = PRESET_INFO[Presets.SSS_2];

      it('should have correct name', () => {
        assert.equal(info.name, 'Compliant Stablecoin');
      });

      it('should have description mentioning compliance', () => {
        assert.include(info.description.toLowerCase(), 'compliance');
      });

      it('should have regulatory useCase', () => {
        assert.include(info.useCase.toLowerCase(), 'regulated');
      });

      it('should have SSS2 extensions', () => {
        assert.deepEqual(info.extensions, SSS2_EXTENSIONS);
      });

      it('should have full compliance level', () => {
        assert.equal(info.compliance, 'full');
      });
    });

    describe('CUSTOM Info', () => {
      const info = PRESET_INFO[Presets.CUSTOM];

      it('should have correct name', () => {
        assert.equal(info.name, 'Custom Configuration');
      });

      it('should have description mentioning configuration', () => {
        assert.include(info.description.toLowerCase(), 'configuration');
      });

      it('should have custom compliance level', () => {
        assert.equal(info.compliance, 'custom');
      });

      it('should mention specialized use cases', () => {
        assert.include(info.useCase.toLowerCase(), 'specialized');
      });
    });
  });

  describe('ExtensionConfig Interface', () => {
    it('should support all extension types', () => {
      const config: ExtensionConfig = {
        permanentDelegate: true,
        transferHook: true,
        defaultAccountFrozen: true,
        confidentialTransfers: true,
      };

      assert.isTrue(config.permanentDelegate);
      assert.isTrue(config.transferHook);
      assert.isTrue(config.defaultAccountFrozen);
      assert.isTrue(config.confidentialTransfers);
    });

    it('should support disabling all extensions', () => {
      const config: ExtensionConfig = {
        permanentDelegate: false,
        transferHook: false,
        defaultAccountFrozen: false,
        confidentialTransfers: false,
      };

      assert.isFalse(config.permanentDelegate);
      assert.isFalse(config.transferHook);
      assert.isFalse(config.defaultAccountFrozen);
      assert.isFalse(config.confidentialTransfers);
    });

    it('should support mixed configuration', () => {
      const config: ExtensionConfig = {
        permanentDelegate: true,
        transferHook: false,
        defaultAccountFrozen: true,
        confidentialTransfers: false,
      };

      assert.isTrue(config.permanentDelegate);
      assert.isFalse(config.transferHook);
      assert.isTrue(config.defaultAccountFrozen);
      assert.isFalse(config.confidentialTransfers);
    });
  });

  describe('Preset Comparison', () => {
    it('SSS-2 should have more features than SSS-1', () => {
      const sss1FeatureCount = Object.values(SSS1_EXTENSIONS).filter(Boolean).length;
      const sss2FeatureCount = Object.values(SSS2_EXTENSIONS).filter(Boolean).length;
      
      assert.isAbove(sss2FeatureCount, sss1FeatureCount);
    });

    it('SSS-1 should be subset of SSS-2 disabled features', () => {
      // All disabled in SSS-1 that are enabled in SSS-2
      const sss1Disabled = Object.entries(SSS1_EXTENSIONS)
        .filter(([, value]) => !value)
        .map(([key]) => key);
      
      const sss2Enabled = Object.entries(SSS2_EXTENSIONS)
        .filter(([, value]) => value)
        .map(([key]) => key);

      // SSS-2 enabled features should be a subset of SSS-1 disabled
      sss2Enabled.forEach(feature => {
        assert.include(sss1Disabled, feature);
      });
    });
  });
});
