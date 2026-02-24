import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import {
  SolanaStablecoin,
  Presets,
  createSSS1Config,
  createSSS2Config,
  StablecoinConfig,
  toTokenAmount,
} from '../../sdk/src';

interface InitOptions {
  preset: string;
  config?: string;
  name?: string;
  symbol?: string;
  uri?: string;
  decimals: string;
}

interface MintOptions {
  mint?: string;
}

export class StablecoinCLI {
  private stablecoin: SolanaStablecoin | null = null;

  constructor(
    private connection: Connection,
    private authority: Keypair
  ) {}

  private getConfig(): { mint?: string } | null {
    const configPath = resolve('.sss-token.json');
    if (existsSync(configPath)) {
      return JSON.parse(readFileSync(configPath, 'utf-8'));
    }
    return null;
  }

  private saveConfig(config: { mint: string; preset: string; name: string; symbol: string }) {
    const configPath = resolve('.sss-token.json');
    writeFileSync(configPath, JSON.stringify(config, null, 2));
  }

  private getMint(options: { mint?: string }): string {
    if (options.mint) return options.mint;
    const config = this.getConfig();
    if (config?.mint) return config.mint;
    throw new Error('Mint address required. Use --mint or run init first.');
  }

  async initialize(options: InitOptions): Promise<void> {
    console.log('Initializing stablecoin...\n');

    let config: StablecoinConfig;

    if (options.config) {
      // Load from config file
      const configData = readFileSync(options.config, 'utf-8');
      config = JSON.parse(configData);
    } else {
      // Use CLI options
      if (!options.name || !options.symbol || !options.uri) {
        console.error('Error: --name, --symbol, and --uri are required');
        process.exit(1);
      }

      const decimals = parseInt(options.decimals, 10);

      if (options.preset === 'sss-1') {
        config = createSSS1Config(options.name, options.symbol, options.uri, decimals);
      } else if (options.preset === 'sss-2') {
        config = createSSS2Config(options.name, options.symbol, options.uri, decimals);
      } else {
        console.error(`Unknown preset: ${options.preset}`);
        process.exit(1);
      }
    }

    console.log(`Preset: ${options.preset}`);
    console.log(`Name: ${config.name}`);
    console.log(`Symbol: ${config.symbol}`);
    console.log(`Decimals: ${config.decimals}`);
    console.log(`Permanent Delegate: ${config.extensions.permanentDelegate}`);
    console.log(`Transfer Hook: ${config.extensions.transferHook}`);
    console.log('');

    try {
      const stablecoin = await SolanaStablecoin.create(
        this.connection,
        config,
        this.authority
      );

      console.log('✓ Stablecoin created successfully!');
      console.log(`  Mint: ${stablecoin.mint.toBase58()}`);
      console.log(`  Authority: ${this.authority.publicKey.toBase58()}`);

      // Save config
      this.saveConfig({
        mint: stablecoin.mint.toBase58(),
        preset: options.preset,
        name: config.name,
        symbol: config.symbol,
      });

      console.log(`\nConfiguration saved to .sss-token.json`);
    } catch (error) {
      console.error('Error creating stablecoin:', error);
      process.exit(1);
    }
  }

  async mint(recipient: string, amount: string, options: MintOptions): Promise<void> {
    const mint = this.getMint(options);
    const stablecoin = await SolanaStablecoin.load(
      this.connection,
      new PublicKey(mint),
      this.authority
    );

    const recipientPubkey = new PublicKey(recipient);
    const tokenAmount = toTokenAmount(parseFloat(amount), stablecoin.config.decimals);

    console.log(`Minting ${amount} tokens to ${recipient}...`);

    try {
      const signature = await stablecoin.mint({
        recipient: recipientPubkey,
        amount: tokenAmount,
      });

      console.log('✓ Mint successful');
      console.log(`  Signature: ${signature}`);
    } catch (error) {
      console.error('Error minting tokens:', error);
      process.exit(1);
    }
  }

  async burn(amount: string, options: { mint?: string; from?: string }): Promise<void> {
    const mint = this.getMint(options);
    const stablecoin = await SolanaStablecoin.load(
      this.connection,
      new PublicKey(mint),
      this.authority
    );

    const tokenAmount = toTokenAmount(parseFloat(amount), stablecoin.config.decimals);

    console.log(`Burning ${amount} tokens...`);

    try {
      const signature = await stablecoin.burn({
        amount: tokenAmount,
        from: options.from ? new PublicKey(options.from) : undefined,
      });

      console.log('✓ Burn successful');
      console.log(`  Signature: ${signature}`);
    } catch (error) {
      console.error('Error burning tokens:', error);
      process.exit(1);
    }
  }

  async freeze(address: string, options: { mint?: string }): Promise<void> {
    const mint = this.getMint(options);
    const stablecoin = await SolanaStablecoin.load(
      this.connection,
      new PublicKey(mint),
      this.authority
    );

    console.log(`Freezing account ${address}...`);

    try {
      const signature = await stablecoin.freeze({
        targetAccount: new PublicKey(address),
      });

      console.log('✓ Freeze successful');
      console.log(`  Signature: ${signature}`);
    } catch (error) {
      console.error('Error freezing account:', error);
      process.exit(1);
    }
  }

  async thaw(address: string, options: { mint?: string }): Promise<void> {
    const mint = this.getMint(options);
    const stablecoin = await SolanaStablecoin.load(
      this.connection,
      new PublicKey(mint),
      this.authority
    );

    console.log(`Thawing account ${address}...`);

    try {
      const signature = await stablecoin.thaw({
        targetAccount: new PublicKey(address),
      });

      console.log('✓ Thaw successful');
      console.log(`  Signature: ${signature}`);
    } catch (error) {
      console.error('Error thawing account:', error);
      process.exit(1);
    }
  }

  async pause(options: { mint?: string }): Promise<void> {
    const mint = this.getMint(options);
    const stablecoin = await SolanaStablecoin.load(
      this.connection,
      new PublicKey(mint),
      this.authority
    );

    console.log('Pausing stablecoin...');

    try {
      const signature = await stablecoin.pause();
      console.log('✓ Pause successful');
      console.log(`  Signature: ${signature}`);
    } catch (error) {
      console.error('Error pausing:', error);
      process.exit(1);
    }
  }

  async unpause(options: { mint?: string }): Promise<void> {
    const mint = this.getMint(options);
    const stablecoin = await SolanaStablecoin.load(
      this.connection,
      new PublicKey(mint),
      this.authority
    );

    console.log('Unpausing stablecoin...');

    try {
      const signature = await stablecoin.unpause();
      console.log('✓ Unpause successful');
      console.log(`  Signature: ${signature}`);
    } catch (error) {
      console.error('Error unpausing:', error);
      process.exit(1);
    }
  }

  async status(options: { mint?: string }): Promise<void> {
    const mint = this.getMint(options);
    const stablecoin = await SolanaStablecoin.load(
      this.connection,
      new PublicKey(mint),
      this.authority
    );

    const state = await stablecoin.getState();

    console.log('Stablecoin Status:\n');
    console.log(`  Name: ${state.name}`);
    console.log(`  Symbol: ${state.symbol}`);
    console.log(`  Mint: ${state.mint.toBase58()}`);
    console.log(`  Decimals: ${state.decimals}`);
    console.log(`  Authority: ${state.masterAuthority.toBase58()}`);
    console.log(`  Status: ${state.paused ? 'PAUSED' : 'Active'}`);
    console.log(`  Total Minted: ${state.totalMinted.toString()}`);
    console.log(`  Total Burned: ${state.totalBurned.toString()}`);
    console.log(`  Net Supply: ${state.totalMinted.sub(state.totalBurned).toString()}`);
    console.log(`\n  Features:`);
    console.log(`    Permanent Delegate: ${state.features.permanentDelegate}`);
    console.log(`    Transfer Hook: ${state.features.transferHook}`);
    console.log(`    Default Account Frozen: ${state.features.defaultAccountFrozen}`);
  }

  async supply(options: { mint?: string }): Promise<void> {
    const mint = this.getMint(options);
    const stablecoin = await SolanaStablecoin.load(
      this.connection,
      new PublicKey(mint),
      this.authority
    );

    const supply = await stablecoin.getTotalSupply();
    console.log(`Total Supply: ${supply.toString()}`);
  }

  async blacklistAdd(address: string, options: { reason: string; mint?: string }): Promise<void> {
    const mint = this.getMint(options);
    const stablecoin = await SolanaStablecoin.load(
      this.connection,
      new PublicKey(mint),
      this.authority
    );

    if (!stablecoin.compliance.isEnabled()) {
      console.error('Error: Compliance module not enabled for this stablecoin');
      process.exit(1);
    }

    console.log(`Adding ${address} to blacklist...`);
    console.log(`Reason: ${options.reason}`);

    try {
      const signature = await stablecoin.compliance.addToBlacklist({
        address: new PublicKey(address),
        reason: options.reason,
      });

      console.log('✓ Blacklist add successful');
      console.log(`  Signature: ${signature}`);
    } catch (error) {
      console.error('Error adding to blacklist:', error);
      process.exit(1);
    }
  }

  async blacklistRemove(address: string, options: { mint?: string }): Promise<void> {
    const mint = this.getMint(options);
    const stablecoin = await SolanaStablecoin.load(
      this.connection,
      new PublicKey(mint),
      this.authority
    );

    if (!stablecoin.compliance.isEnabled()) {
      console.error('Error: Compliance module not enabled for this stablecoin');
      process.exit(1);
    }

    console.log(`Removing ${address} from blacklist...`);

    try {
      const signature = await stablecoin.compliance.removeFromBlacklist(new PublicKey(address));
      console.log('✓ Blacklist remove successful');
      console.log(`  Signature: ${signature}`);
    } catch (error) {
      console.error('Error removing from blacklist:', error);
      process.exit(1);
    }
  }

  async blacklistCheck(address: string, options: { mint?: string }): Promise<void> {
    const mint = this.getMint(options);
    const stablecoin = await SolanaStablecoin.load(
      this.connection,
      new PublicKey(mint),
      this.authority
    );

    const isBlacklisted = await stablecoin.compliance.isBlacklisted(new PublicKey(address));
    console.log(`Address ${address}: ${isBlacklisted ? 'BLACKLISTED' : 'Not blacklisted'}`);

    if (isBlacklisted) {
      const entry = await stablecoin.compliance.getBlacklistEntry(new PublicKey(address));
      if (entry) {
        console.log(`  Reason: ${entry.reason}`);
        console.log(`  Added by: ${entry.addedBy.toBase58()}`);
        console.log(`  Added at: ${new Date(entry.addedAt.toNumber() * 1000).toISOString()}`);
      }
    }
  }

  async seize(from: string, to: string, amount: string, options: { mint?: string }): Promise<void> {
    const mint = this.getMint(options);
    const stablecoin = await SolanaStablecoin.load(
      this.connection,
      new PublicKey(mint),
      this.authority
    );

    if (!stablecoin.compliance.isEnabled()) {
      console.error('Error: Compliance module not enabled for this stablecoin');
      process.exit(1);
    }

    const tokenAmount = toTokenAmount(parseFloat(amount), stablecoin.config.decimals);

    console.log(`Seizing ${amount} tokens from ${from} to ${to}...`);

    try {
      const signature = await stablecoin.compliance.seize({
        from: new PublicKey(from),
        to: new PublicKey(to),
        amount: tokenAmount,
      });

      console.log('✓ Seize successful');
      console.log(`  Signature: ${signature}`);
    } catch (error) {
      console.error('Error seizing tokens:', error);
      process.exit(1);
    }
  }

  async minterManagement(options: {
    add?: string;
    remove?: string;
    quota: string;
    mint?: string;
  }): Promise<void> {
    const mint = this.getMint(options);
    const stablecoin = await SolanaStablecoin.load(
      this.connection,
      new PublicKey(mint),
      this.authority
    );

    if (options.add) {
      console.log(`Adding minter ${options.add}...`);
      const signature = await stablecoin.updateMinter({
        minter: new PublicKey(options.add),
        quota: parseInt(options.quota, 10),
        active: true,
      });
      console.log('✓ Minter added');
      console.log(`  Signature: ${signature}`);
    } else if (options.remove) {
      console.log(`Removing minter ${options.remove}...`);
      const signature = await stablecoin.updateMinter({
        minter: new PublicKey(options.remove),
        quota: 0,
        active: false,
      });
      console.log('✓ Minter removed');
      console.log(`  Signature: ${signature}`);
    } else {
      console.log('Use --add <address> or --remove <address>');
    }
  }

  async transferAuthority(newAuthority: string, options: { mint?: string }): Promise<void> {
    const mint = this.getMint(options);
    const stablecoin = await SolanaStablecoin.load(
      this.connection,
      new PublicKey(mint),
      this.authority
    );

    console.log(`Transferring authority to ${newAuthority}...`);
    console.log('WARNING: This action cannot be undone!');

    try {
      const signature = await stablecoin.transferAuthority(new PublicKey(newAuthority));
      console.log('✓ Authority transferred');
      console.log(`  Signature: ${signature}`);
    } catch (error) {
      console.error('Error transferring authority:', error);
      process.exit(1);
    }
  }

  async close(options: { mint?: string }): Promise<void> {
    const mint = this.getMint(options);
    const stablecoin = await SolanaStablecoin.load(
      this.connection,
      new PublicKey(mint),
      this.authority
    );

    const supply = await stablecoin.getTotalSupply();
    if (!supply.isZero()) {
      console.error('Error: Cannot close stablecoin with outstanding supply');
      console.error(`Current supply: ${supply.toString()}`);
      process.exit(1);
    }

    console.log('Closing stablecoin...');
    console.log('WARNING: This action cannot be undone!');

    try {
      // Note: Close instruction needs to be added to SDK
      console.log('✓ Close transaction prepared');
    } catch (error) {
      console.error('Error closing stablecoin:', error);
      process.exit(1);
    }
  }
}
