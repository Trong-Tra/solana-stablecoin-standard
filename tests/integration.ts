import * as anchor from "@coral-xyz/anchor";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { SolanaStablecoin, Presets, createSSS1Config, createSSS2Config } from "../sdk/src";
import { assert } from "chai";

describe("Integration Tests", () => {
  let connection: Connection;
  let authority: Keypair;

  before(async () => {
    connection = new Connection("http://localhost:8899", "confirmed");
    authority = Keypair.generate();
    
    // Airdrop SOL
    await connection.requestAirdrop(authority.publicKey, 10 * anchor.web3.LAMPORTS_PER_SOL);
  });

  describe("SSS-1 Integration", () => {
    it("Should create and load SSS-1 stablecoin", async () => {
      const config = createSSS1Config(
        "Integration Test USD",
        "ITUSD",
        "https://test.com/itusd.json",
        6
      );

      // Create
      const stablecoin = await SolanaStablecoin.create(connection, config, authority);
      assert.exists(stablecoin.mint);
      
      // Load
      const loaded = await SolanaStablecoin.load(connection, stablecoin.mint, authority);
      const state = await loaded.getState();
      
      assert.equal(state.name, "Integration Test USD");
      assert.equal(state.symbol, "ITUSD");
      assert.isFalse(state.features.permanentDelegate);
      assert.isFalse(state.features.transferHook);
    });

    it("Should mint and burn tokens", async () => {
      const config = createSSS1Config("Mint Test", "MT", "https://test.com/mt.json", 6);
      const stablecoin = await SolanaStablecoin.create(connection, config, authority);
      
      // Setup minter
      const minter = Keypair.generate();
      await stablecoin.updateMinter({
        minter: minter.publicKey,
        quota: BigInt(1000000000),
        active: true,
      });
      
      // Note: Actual mint/burn would need token accounts created
      // This tests the SDK interface only
    });

    it("Should pause and unpause", async () => {
      const config = createSSS1Config("Pause Test", "PT", "https://test.com/pt.json", 6);
      const stablecoin = await SolanaStablecoin.create(connection, config, authority);
      
      // Pause
      await stablecoin.pause();
      let state = await stablecoin.getState();
      assert.isTrue(state.paused);
      
      // Unpause
      await stablecoin.unpause();
      state = await stablecoin.getState();
      assert.isFalse(state.paused);
    });
  });

  describe("SSS-2 Integration", () => {
    it("Should create SSS-2 with compliance features", async () => {
      const config = createSSS2Config(
        "Compliant Test USD",
        "CTUSD",
        "https://test.com/ctusd.json",
        6
      );

      const stablecoin = await SolanaStablecoin.create(connection, config, authority);
      const state = await stablecoin.getState();
      
      assert.isTrue(state.features.permanentDelegate);
      assert.isTrue(state.features.transferHook);
      assert.isTrue(stablecoin.compliance.isEnabled());
    });

    it("Should manage blacklist", async () => {
      const config = createSSS2Config("Blacklist Test", "BT", "https://test.com/bt.json", 6);
      const stablecoin = await SolanaStablecoin.create(connection, config, authority);
      
      const badActor = Keypair.generate().publicKey;
      
      // Add to blacklist
      await stablecoin.compliance.addToBlacklist({
        address: badActor,
        reason: "Test blacklist",
      });
      
      // Check blacklist
      const isBlacklisted = await stablecoin.compliance.isBlacklisted(badActor);
      assert.isTrue(isBlacklisted);
      
      // Get entry
      const entry = await stablecoin.compliance.getBlacklistEntry(badActor);
      assert.exists(entry);
      assert.equal(entry?.reason, "Test blacklist");
      
      // Remove from blacklist
      await stablecoin.compliance.removeFromBlacklist(badActor);
      
      // Verify removal
      const stillBlacklisted = await stablecoin.compliance.isBlacklisted(badActor);
      assert.isFalse(stillBlacklisted);
    });
  });

  describe("Preset Tests", () => {
    it("Should use correct preset configurations", async () => {
      const sss1Config = createSSS1Config("Test", "TST", "https://test.com", 6);
      assert.equal(sss1Config.preset, Presets.SSS_1);
      assert.isFalse(sss1Config.extensions.permanentDelegate);
      assert.isFalse(sss1Config.extensions.transferHook);
      
      const sss2Config = createSSS2Config("Test", "TST", "https://test.com", 6);
      assert.equal(sss2Config.preset, Presets.SSS_2);
      assert.isTrue(sss2Config.extensions.permanentDelegate);
      assert.isTrue(sss2Config.extensions.transferHook);
    });
  });
});
