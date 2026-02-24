import { Connection, Keypair, PublicKey, Transaction } from '@solana/web3.js';
import { AnchorProvider, Program, Wallet } from '@coral-xyz/anchor';
import BN from 'bn.js';
import { ComplianceModule } from './compliance';
import { StablecoinConfig, validateConfig, toProgramConfig } from './config';
import { Presets, getExtensionsForPreset } from './presets';
import {
  StablecoinState,
  MintParams,
  BurnParams,
  FreezeParams,
  UpdateMinterParams,
  UpdateBurnerParams,
} from './types';
import {
  SSS_TOKEN_PROGRAM_ID,
  getStablecoinStatePDA,
  getMinterStatePDA,
  getBurnerStatePDA,
  toBN,
  confirmTransaction,
} from './utils';
import IDL from './idl/sss_token.json';

export class SolanaStablecoin {
  private constructor(
    public readonly connection: Connection,
    public readonly program: Program,
    public readonly mint: PublicKey,
    public readonly authority: Keypair,
    public readonly config: StablecoinConfig,
    public readonly compliance: ComplianceModule
  ) {}

  /**
   * Create a new stablecoin
   */
  static async create(
    connection: Connection,
    config: StablecoinConfig,
    authority: Keypair
  ): Promise<SolanaStablecoin> {
    // Validate config
    validateConfig(config);

    const wallet = new Wallet(authority);
    const provider = new AnchorProvider(connection, wallet, {
      commitment: 'confirmed',
    });

    const program = new Program(IDL as any, SSS_TOKEN_PROGRAM_ID, provider);

    // Generate mint keypair
    const mintKeypair = Keypair.generate();

    // Get PDA for stablecoin state
    const [statePDA] = getStablecoinStatePDA(mintKeypair.publicKey);

    // Initialize stablecoin
    const programConfig = toProgramConfig(config);

    await program.methods
      .initialize(programConfig)
      .accounts({
        payer: authority.publicKey,
        mint: mintKeypair.publicKey,
        stablecoinState: statePDA,
        systemProgram: new PublicKey('11111111111111111111111111111111'),
        token2022Program: new PublicKey('TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb'),
        rent: new PublicKey('SysvarRent111111111111111111111111111111111'),
      })
      .signers([authority, mintKeypair])
      .rpc();

    // Initialize compliance module
    const compliance = new ComplianceModule(
      connection,
      program,
      mintKeypair.publicKey,
      authority,
      config.extensions
    );

    return new SolanaStablecoin(
      connection,
      program,
      mintKeypair.publicKey,
      authority,
      config,
      compliance
    );
  }

  /**
   * Load an existing stablecoin
   */
  static async load(
    connection: Connection,
    mint: PublicKey,
    authority: Keypair
  ): Promise<SolanaStablecoin> {
    const wallet = new Wallet(authority);
    const provider = new AnchorProvider(connection, wallet, {
      commitment: 'confirmed',
    });

    const program = new Program(IDL as any, SSS_TOKEN_PROGRAM_ID, provider);

    // Fetch state
    const [statePDA] = getStablecoinStatePDA(mint);
    const state = await program.account.stablecoinState.fetch(statePDA);

    // Reconstruct config
    const config: StablecoinConfig = {
      name: state.name,
      symbol: state.symbol,
      uri: state.uri,
      decimals: state.decimals,
      preset: state.features.permanentDelegate ? Presets.SSS_2 : Presets.SSS_1,
      extensions: {
        permanentDelegate: state.features.permanentDelegate,
        transferHook: state.features.transferHook,
        defaultAccountFrozen: state.features.defaultAccountFrozen,
        confidentialTransfers: state.features.confidentialTransfers,
      },
    };

    // Initialize compliance module
    const compliance = new ComplianceModule(
      connection,
      program,
      mint,
      authority,
      config.extensions
    );

    return new SolanaStablecoin(
      connection,
      program,
      mint,
      authority,
      config,
      compliance
    );
  }

  /**
   * Mint tokens to a recipient
   */
  async mint(params: MintParams): Promise<string> {
    const amount = toBN(params.amount);
    const [statePDA] = getStablecoinStatePDA(this.mint);
    const [minterPDA] = getMinterStatePDA(
      this.mint,
      params.minter || this.authority.publicKey
    );

    const tx = await this.program.methods
      .mintTokens(amount)
      .accounts({
        authority: this.authority.publicKey,
        stablecoinState: statePDA,
        mint: this.mint,
        to: params.recipient,
        minterState: minterPDA,
        token2022Program: new PublicKey('TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb'),
      })
      .signers([this.authority])
      .rpc();

    return tx;
  }

  /**
   * Burn tokens
   */
  async burn(params: BurnParams): Promise<string> {
    const amount = toBN(params.amount);
    const [statePDA] = getStablecoinStatePDA(this.mint);

    const tx = await this.program.methods
      .burnTokens(amount)
      .accounts({
        authority: this.authority.publicKey,
        stablecoinState: statePDA,
        mint: this.mint,
        from: params.from || this.authority.publicKey,
        burnerState: null,
        token2022Program: new PublicKey('TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb'),
      })
      .signers([this.authority])
      .rpc();

    return tx;
  }

  /**
   * Freeze an account
   */
  async freeze(params: FreezeParams): Promise<string> {
    const [statePDA] = getStablecoinStatePDA(this.mint);

    const tx = await this.program.methods
      .freezeAccount()
      .accounts({
        authority: this.authority.publicKey,
        stablecoinState: statePDA,
        mint: this.mint,
        targetAccount: params.targetAccount,
        token2022Program: new PublicKey('TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb'),
      })
      .signers([this.authority])
      .rpc();

    return tx;
  }

  /**
   * Thaw (unfreeze) an account
   */
  async thaw(params: FreezeParams): Promise<string> {
    const [statePDA] = getStablecoinStatePDA(this.mint);

    const tx = await this.program.methods
      .thawAccount()
      .accounts({
        authority: this.authority.publicKey,
        stablecoinState: statePDA,
        mint: this.mint,
        targetAccount: params.targetAccount,
        token2022Program: new PublicKey('TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb'),
      })
      .signers([this.authority])
      .rpc();

    return tx;
  }

  /**
   * Pause all transfers
   */
  async pause(): Promise<string> {
    const [statePDA] = getStablecoinStatePDA(this.mint);

    const tx = await this.program.methods
      .pause()
      .accounts({
        authority: this.authority.publicKey,
        stablecoinState: statePDA,
      })
      .signers([this.authority])
      .rpc();

    return tx;
  }

  /**
   * Unpause transfers
   */
  async unpause(): Promise<string> {
    const [statePDA] = getStablecoinStatePDA(this.mint);

    const tx = await this.program.methods
      .unpause()
      .accounts({
        authority: this.authority.publicKey,
        stablecoinState: statePDA,
      })
      .signers([this.authority])
      .rpc();

    return tx;
  }

  /**
   * Update minter
   */
  async updateMinter(params: UpdateMinterParams): Promise<string> {
    const quota = toBN(params.quota);
    const [statePDA] = getStablecoinStatePDA(this.mint);
    const [minterPDA] = getMinterStatePDA(this.mint, params.minter);

    const tx = await this.program.methods
      .updateMinter(params.minter, quota, params.active)
      .accounts({
        authority: this.authority.publicKey,
        stablecoinState: statePDA,
        mint: this.mint,
        target: params.minter,
        minterState: minterPDA,
        burnerState: null,
        systemProgram: new PublicKey('11111111111111111111111111111111'),
      })
      .signers([this.authority])
      .rpc();

    return tx;
  }

  /**
   * Update burner
   */
  async updateBurner(params: UpdateBurnerParams): Promise<string> {
    const [statePDA] = getStablecoinStatePDA(this.mint);
    const [burnerPDA] = getBurnerStatePDA(this.mint, params.burner);

    const tx = await this.program.methods
      .updateBurner(params.burner, params.active)
      .accounts({
        authority: this.authority.publicKey,
        stablecoinState: statePDA,
        mint: this.mint,
        target: params.burner,
        minterState: null,
        burnerState: burnerPDA,
        systemProgram: new PublicKey('11111111111111111111111111111111'),
      })
      .signers([this.authority])
      .rpc();

    return tx;
  }

  /**
   * Transfer authority
   */
  async transferAuthority(newAuthority: PublicKey): Promise<string> {
    const [statePDA] = getStablecoinStatePDA(this.mint);

    const tx = await this.program.methods
      .transferAuthority(newAuthority)
      .accounts({
        authority: this.authority.publicKey,
        stablecoinState: statePDA,
        newAuthority: newAuthority,
      })
      .signers([this.authority])
      .rpc();

    return tx;
  }

  /**
   * Get stablecoin state
   */
  async getState(): Promise<StablecoinState> {
    const [statePDA] = getStablecoinStatePDA(this.mint);
    const state = await this.program.account.stablecoinState.fetch(statePDA);

    return {
      masterAuthority: state.masterAuthority,
      mint: state.mint,
      name: state.name,
      symbol: state.symbol,
      uri: state.uri,
      decimals: state.decimals,
      features: state.features,
      paused: state.paused,
      totalMinted: state.totalMinted,
      totalBurned: state.totalBurned,
      bump: state.bump,
      version: state.version,
    };
  }

  /**
   * Get total supply
   */
  async getTotalSupply(): Promise<BN> {
    const state = await this.getState();
    return state.totalMinted.sub(state.totalBurned);
  }

  /**
   * Check if paused
   */
  async isPaused(): Promise<boolean> {
    const state = await this.getState();
    return state.paused;
  }
}
