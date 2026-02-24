#!/usr/bin/env node

import { Command } from 'commander';
import { Connection, Keypair, PublicKey, clusterApiUrl } from '@solana/web3.js';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { homedir } from 'os';
import { StablecoinCLI } from './cli';

const program = new Command();

program
  .name('sss-token')
  .description('Solana Stablecoin Standard CLI')
  .version('0.1.0')
  .option('-c, --cluster <cluster>', 'Solana cluster', 'devnet')
  .option('-k, --keypair <path>', 'Keypair path', '~/.config/solana/id.json')
  .hook('preAction', async (thisCommand) => {
    const opts = thisCommand.opts();
    const cluster = opts.cluster;
    const keypairPath = opts.keypair.replace('~', homedir());
    
    let rpcUrl: string;
    switch (cluster) {
      case 'mainnet':
      case 'mainnet-beta':
        rpcUrl = process.env.SOLANA_RPC_URL || clusterApiUrl('mainnet-beta');
        break;
      case 'devnet':
        rpcUrl = process.env.SOLANA_RPC_URL || clusterApiUrl('devnet');
        break;
      case 'localnet':
      case 'localhost':
        rpcUrl = 'http://localhost:8899';
        break;
      default:
        rpcUrl = cluster;
    }
    
    const connection = new Connection(rpcUrl, 'confirmed');
    
    if (!existsSync(keypairPath)) {
      console.error(`Keypair not found: ${keypairPath}`);
      process.exit(1);
    }
    
    const keypairData = JSON.parse(readFileSync(keypairPath, 'utf-8'));
    const authority = Keypair.fromSecretKey(new Uint8Array(keypairData));
    
    (thisCommand as any).cli = new StablecoinCLI(connection, authority);
  });

// Initialize command
program
  .command('init')
  .description('Initialize a new stablecoin')
  .option('--preset <preset>', 'Preset to use (sss-1, sss-2)', 'sss-1')
  .option('--config <path>', 'Path to custom config file')
  .option('--name <name>', 'Token name')
  .option('--symbol <symbol>', 'Token symbol')
  .option('--uri <uri>', 'Metadata URI')
  .option('--decimals <decimals>', 'Token decimals', '6')
  .action(async (options, cmd) => {
    const parentCmd = cmd.parent as Command;
    const cli = (parentCmd as any).cli as StablecoinCLI;
    await cli.initialize(options);
  });

// Mint command
program
  .command('mint <recipient> <amount>')
  .description('Mint tokens to a recipient')
  .option('--mint <mint>', 'Mint address (if not using config)')
  .action(async (recipient, amount, options, cmd) => {
    const parentCmd = (cmd as any).parent as Command;
    const cli = (parentCmd as any).cli as StablecoinCLI;
    await cli.mint(recipient, amount, options);
  });

// Burn command
program
  .command('burn <amount>')
  .description('Burn tokens')
  .option('--from <from>', 'Account to burn from (defaults to authority)')
  .option('--mint <mint>', 'Mint address')
  .action(async (amount, options, cmd) => {
    const parentCmd = (cmd as any).parent as Command;
    const cli = (parentCmd as any).cli as StablecoinCLI;
    await cli.burn(amount, options);
  });

// Freeze command
program
  .command('freeze <address>')
  .description('Freeze an account')
  .option('--mint <mint>', 'Mint address')
  .action(async (address, options, cmd) => {
    const parentCmd = (cmd as any).parent as Command;
    const cli = (parentCmd as any).cli as StablecoinCLI;
    await cli.freeze(address, options);
  });

// Thaw command
program
  .command('thaw <address>')
  .description('Thaw (unfreeze) an account')
  .option('--mint <mint>', 'Mint address')
  .action(async (address, options, cmd) => {
    const parentCmd = (cmd as any).parent as Command;
    const cli = (parentCmd as any).cli as StablecoinCLI;
    await cli.thaw(address, options);
  });

// Pause command
program
  .command('pause')
  .description('Pause the stablecoin')
  .option('--mint <mint>', 'Mint address')
  .action(async (options, cmd) => {
    const parentCmd = (cmd as any).parent as Command;
    const cli = (parentCmd as any).cli as StablecoinCLI;
    await cli.pause(options);
  });

// Unpause command
program
  .command('unpause')
  .description('Unpause the stablecoin')
  .option('--mint <mint>', 'Mint address')
  .action(async (options, cmd) => {
    const parentCmd = (cmd as any).parent as Command;
    const cli = (parentCmd as any).cli as StablecoinCLI;
    await cli.unpause(options);
  });

// Status command
program
  .command('status')
  .description('Get stablecoin status')
  .option('--mint <mint>', 'Mint address')
  .action(async (options, cmd) => {
    const parentCmd = (cmd as any).parent as Command;
    const cli = (parentCmd as any).cli as StablecoinCLI;
    await cli.status(options);
  });

// Supply command
program
  .command('supply')
  .description('Get total supply')
  .option('--mint <mint>', 'Mint address')
  .action(async (options, cmd) => {
    const parentCmd = (cmd as any).parent as Command;
    const cli = (parentCmd as any).cli as StablecoinCLI;
    await cli.supply(options);
  });

// Blacklist commands (SSS-2)
const blacklist = program
  .command('blacklist')
  .description('Blacklist management (SSS-2 only)');

blacklist
  .command('add <address>')
  .description('Add address to blacklist')
  .option('--reason <reason>', 'Reason for blacklisting', 'Compliance violation')
  .option('--mint <mint>', 'Mint address')
  .action(async (address, options, cmd) => {
    const parentCmd = (cmd as any).parent?.parent as Command;
    const cli = (parentCmd as any).cli as StablecoinCLI;
    await cli.blacklistAdd(address, options);
  });

blacklist
  .command('remove <address>')
  .description('Remove address from blacklist')
  .option('--mint <mint>', 'Mint address')
  .action(async (address, options, cmd) => {
    const parentCmd = (cmd as any).parent?.parent as Command;
    const cli = (parentCmd as any).cli as StablecoinCLI;
    await cli.blacklistRemove(address, options);
  });

blacklist
  .command('check <address>')
  .description('Check if address is blacklisted')
  .option('--mint <mint>', 'Mint address')
  .action(async (address, options, cmd) => {
    const parentCmd = (cmd as any).parent?.parent as Command;
    const cli = (parentCmd as any).cli as StablecoinCLI;
    await cli.blacklistCheck(address, options);
  });

// Seize command
program
  .command('seize <from> <to> <amount>')
  .description('Seize tokens from blacklisted account (SSS-2 only)')
  .option('--mint <mint>', 'Mint address')
  .action(async (from, to, amount, options, cmd) => {
    const parentCmd = (cmd as any).parent as Command;
    const cli = (parentCmd as any).cli as StablecoinCLI;
    await cli.seize(from, to, amount, options);
  });

// Minter management
program
  .command('minters')
  .description('Minter management')
  .option('--add <address>', 'Add minter')
  .option('--remove <address>', 'Remove minter')
  .option('--quota <quota>', 'Minter quota', '0')
  .option('--mint <mint>', 'Mint address')
  .action(async (options, cmd) => {
    const parentCmd = cmd.parent as Command;
    const cli = (parentCmd as any).cli as StablecoinCLI;
    await cli.minterManagement(options);
  });

// Transfer authority
program
  .command('transfer-authority <new-authority>')
  .description('Transfer master authority')
  .option('--mint <mint>', 'Mint address')
  .action(async (newAuthority, options, cmd) => {
    const parentCmd = (cmd as any).parent as Command;
    const cli = (parentCmd as any).cli as StablecoinCLI;
    await cli.transferAuthority(newAuthority, options);
  });

// Close command
program
  .command('close')
  .description('Close the stablecoin (requires zero supply)')
  .option('--mint <mint>', 'Mint address')
  .action(async (options, cmd) => {
    const parentCmd = (cmd as any).parent as Command;
    const cli = (parentCmd as any).cli as StablecoinCLI;
    await cli.close(options);
  });

program.parse();
