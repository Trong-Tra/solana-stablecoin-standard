import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { SssToken } from "../target/types/sss_token";
import { PublicKey, Keypair, SystemProgram } from "@solana/web3.js";
import { assert } from "chai";

describe("SSS Token Program", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.SssToken as Program<SssToken>;
  
  let authority: Keypair;
  let mint: Keypair;
  let stablecoinState: PublicKey;

  before(async () => {
    authority = (provider.wallet as anchor.Wallet).payer;
    mint = Keypair.generate();
    
    // Find PDA for stablecoin state
    [stablecoinState] = PublicKey.findProgramAddressSync(
      [Buffer.from("stablecoin_state"), mint.publicKey.toBuffer()],
      program.programId
    );
  });

  describe("SSS-1: Minimal Stablecoin", () => {
    it("Should initialize SSS-1 stablecoin", async () => {
      const config = {
        name: "Test USD",
        symbol: "TUSD",
        uri: "https://test.com/metadata.json",
        decimals: 6,
        enablePermanentDelegate: false,
        enableTransferHook: false,
        defaultAccountFrozen: false,
      };

      await program.methods
        .initialize(config)
        .accounts({
          payer: authority.publicKey,
          mint: mint.publicKey,
          stablecoinState,
          systemProgram: SystemProgram.programId,
          token2022Program: new PublicKey("TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"),
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        })
        .signers([authority, mint])
        .rpc();

      const state = await program.account.stablecoinState.fetch(stablecoinState);
      assert.equal(state.name, "Test USD");
      assert.equal(state.symbol, "TUSD");
      assert.equal(state.decimals, 6);
      assert.isFalse(state.features.permanentDelegate);
    });

    it("Should fail with name too long", async () => {
      const newMint = Keypair.generate();
      const [newState] = PublicKey.findProgramAddressSync(
        [Buffer.from("stablecoin_state"), newMint.publicKey.toBuffer()],
        program.programId
      );

      const invalidConfig = {
        name: "A".repeat(33), // Too long
        symbol: "TST",
        uri: "https://test.com",
        decimals: 6,
        enablePermanentDelegate: false,
        enableTransferHook: false,
        defaultAccountFrozen: false,
      };

      try {
        await program.methods
          .initialize(invalidConfig)
          .accounts({
            payer: authority.publicKey,
            mint: newMint.publicKey,
            stablecoinState: newState,
            systemProgram: SystemProgram.programId,
            token2022Program: new PublicKey("TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"),
            rent: anchor.web3.SYSVAR_RENT_PUBKEY,
          })
          .signers([authority, newMint])
          .rpc();
        assert.fail("Should have thrown error");
      } catch (e: any) {
        assert.include(e.message, "NameTooLong");
      }
    });
  });

  describe("Pause/Unpause", () => {
    it("Should pause stablecoin", async () => {
      await program.methods
        .pause()
        .accounts({
          authority: authority.publicKey,
          stablecoinState,
        })
        .signers([authority])
        .rpc();

      const state = await program.account.stablecoinState.fetch(stablecoinState);
      assert.isTrue(state.paused);
    });

    it("Should unpause stablecoin", async () => {
      await program.methods
        .unpause()
        .accounts({
          authority: authority.publicKey,
          stablecoinState,
        })
        .signers([authority])
        .rpc();

      const state = await program.account.stablecoinState.fetch(stablecoinState);
      assert.isFalse(state.paused);
    });
  });
});
