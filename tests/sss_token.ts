import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey, Keypair, SystemProgram } from "@solana/web3.js";
import { assert } from "chai";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import * as fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const idlPath = join(__dirname, '..', 'target', 'idl', 'sss_token.json');
const idl = JSON.parse(fs.readFileSync(idlPath, 'utf-8'));

describe("SSS Token Program", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = new Program(idl as any, provider);
  
  let authority: Keypair;
  let mint: Keypair;
  let stablecoinState: PublicKey;

  before(async () => {
    authority = (provider.wallet as anchor.Wallet).payer;
    mint = Keypair.generate();
    
    [stablecoinState] = PublicKey.findProgramAddressSync(
      [Buffer.from("stablecoin_state"), mint.publicKey.toBuffer()],
      program.programId
    );
  });

  describe("SSS-1: Minimal Stablecoin", () => {
    it("Should initialize SSS-1 stablecoin", async () => {
      await program.methods
        .initialize(
          "Test USD",
          "TUSD",
          "https://test.com/metadata.json",
          6,
          false,
          false,
          false
        )
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

      const state = await (program.account as any).stablecoinState.fetch(stablecoinState);
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

      try {
        await program.methods
          .initialize(
            "A".repeat(33),
            "TST",
            "https://test.com",
            6,
            false,
            false,
            false
          )
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

      const state = await (program.account as any).stablecoinState.fetch(stablecoinState);
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

      const state = await (program.account as any).stablecoinState.fetch(stablecoinState);
      assert.isFalse(state.paused);
    });
  });
});
