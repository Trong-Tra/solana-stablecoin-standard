# Solana Stablecoin Standard (SSS)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Anchor](https://img.shields.io/badge/Anchor-0.30.1-blue.svg)](https://github.com/coral-xyz/anchor)
[![Solana](https://img.shields.io/badge/Solana-Devnet-green.svg)](https://solana.com)
[![Build](https://img.shields.io/badge/Build-Passing-brightgreen.svg)]()
[![Tests](https://img.shields.io/badge/Tests-8%2F8%20Passing-success.svg)]()

> 🏆 **Superteam Brazil Bounty Submission** - A production-ready, modular SDK for creating regulated stablecoins on Solana

## 🎯 Overview

The **Solana Stablecoin Standard (SSS)** provides institutions and builders with a comprehensive toolkit to create, manage, and operate compliant stablecoins on Solana. Built with **Token-2022 extensions**, it features configurable compliance modules and two opinionated presets:

- **SSS-1 (Minimal)**: Basic stablecoin with mint authority, freeze authority, and metadata
- **SSS-2 (Compliant)**: Full compliance features including blacklist enforcement and token seizure

### ✨ Key Features

| Feature | SSS-1 | SSS-2 | Description |
|---------|-------|-------|-------------|
| Mint Authority | ✅ | ✅ | Role-based minting with quotas |
| Freeze/Thaw | ✅ | ✅ | Account-level freezing |
| Pause/Unpause | ✅ | ✅ | Global transfer pausing |
| Metadata | ✅ | ✅ | Token metadata management |
| Blacklist | ❌ | ✅ | OFAC-style sanctions enforcement |
| Token Seizure | ❌ | ✅ | Permanent delegate seizure |
| Transfer Hook | ❌ | ✅ | Automatic blacklist checks |

## 🚀 Live Deployment

**🌐 Devnet Program:** `DTQEHEAvQ1ZuPs3QEHbN8WJFp4C66PjUfCZWj6RLnaBn`

[![Explorer](https://img.shields.io/badge/View%20on%20Explorer-blue?style=for-the-badge&logo=solana)](https://explorer.solana.com/address/DTQEHEAvQ1ZuPs3QEHbN8WJFp4C66PjUfCZWj6RLnaBn?cluster=devnet)

**Deployment Details:**
- **Network**: Devnet
- **Program Size**: 568,416 bytes (optimized)
- **Transaction**: [View on Explorer](https://explorer.solana.com/tx/2xodt87BcrqCWVVLENHRkm9imHxuyQGeQYoxVpt3qZ2SyquooaeAppxV7ZdeD6YTCgRG7ndWY4iSjnHq5UVAhDFY?cluster=devnet)
- **Authority**: 9mECXZ2NZrHiWZJHppJp6tVQiqVBLFFh3XFW9qMib4HW

## 📦 Quick Start

### Installation

```bash
# Clone the repository
git clone https://github.com/Trong-Tra/solana-stablecoin-standard.git
cd solana-stablecoin-standard

# Install dependencies
npm install

# Build the SDK
npm run build
```

### Using the CLI

```bash
# Initialize SSS-1 (Minimal) stablecoin on devnet
npm run cli -- init \
  --preset sss-1 \
  --name "My USD" \
  --symbol "MUSD" \
  --uri "https://example.com/metadata.json" \
  --decimals 6

# Check stablecoin status
npm run cli -- status

# Mint tokens (1000 tokens with 6 decimals)
npm run cli -- mint <RECIPIENT_ADDRESS> 1000000000

# Pause transfers
npm run cli -- pause

# Unpause transfers
npm run cli -- unpause

# SSS-2: Add to blacklist
npm run cli -- blacklist add <ADDRESS> --reason "OFAC match"

# SSS-2: Seize tokens from blacklisted account
npm run cli -- seize <FROM_ADDRESS> <TO_TREASURY> 1000000
```

### Using the TypeScript SDK

```typescript
import { SolanaStablecoin, Presets } from "@stbr/sss-token";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";

// Create SSS-2 compliant stablecoin
const stablecoin = await SolanaStablecoin.create(
  connection, 
  {
    preset: Presets.SSS_2,
    name: "Regulated USD",
    symbol: "RUSD",
    decimals: 6,
  },
  authorityKeypair
);

console.log(`Mint: ${stablecoin.mint.toBase58()}`);

// Mint tokens
await stablecoin.mint({
  recipient: recipientPublicKey,
  amount: 1_000_000, // 1 token
});

// SSS-2: Add to blacklist
await stablecoin.compliance.addToBlacklist({
  address: badActorAddress,
  reason: "OFAC match"
});

// SSS-2: Seize tokens
await stablecoin.compliance.seize({
  from: blacklistedAccount,
  to: treasuryAccount,
  amount: seizedAmount,
});
```

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Layer 3: Standards                     │
│  ┌─────────────────────┐    ┌─────────────────────────────┐ │
│  │      SSS-1          │    │           SSS-2             │ │
│  │   Minimal Stable    │    │    Compliant Stablecoin     │ │
│  └─────────────────────┘    └─────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│                      Layer 2: Modules                       │
│  ┌─────────────────┐  ┌─────────────────────────────────┐   │
│  │ Compliance      │  │ Privacy (SSS-3)                 │   │
│  │ - Blacklist     │  │ - Confidential Transfers        │   │
│  │ - Transfer Hook │  │ - Allowlists                    │   │
│  │ - Seizure       │  │                                 │   │
│  └─────────────────┘  └─────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│                      Layer 1: Base SDK                      │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Token-2022 Extensions                              │    │
│  │  - Mint Authority  │  - Freeze Authority            │    │
│  │  - Metadata        │  - Permanent Delegate (SSS-2)  │    │
│  │  - Transfer Hook   │  - Role Management             │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

## 🧪 Testing & Verification

### ✅ SDK Unit Tests (All Passing)

```bash
$ npm test

  SDK Unit Tests
    Presets
      ✔ should return SSS-1 extensions
      ✔ should return SSS-2 extensions
    Config Validation
      ✔ should validate correct config
      ✔ should reject long name
      ✔ should convert to program config
    Utils
      ✔ should convert to token amount
      ✔ should convert from BN to readable
      ✔ should generate valid PDA

  8 passing (4ms)
```

### ✅ Program Build

```bash
$ anchor build

   Compiling sss-token v0.1.0
   Compiling sss-transfer-hook v0.1.0
    Finished release [optimized] target(s) in 33.18s

✅ sss_token.so: 568,416 bytes (555 KB)
✅ sss_transfer_hook.so: 7,048 bytes (7 KB)
```

### ✅ Devnet Deployment

```bash
$ solana program deploy target/deploy/sss_token.so \
    --program-id target/deploy/sss_token-keypair.json \
    --keypair /tmp/devnet-keypair.json

Program Id: DTQEHEAvQ1ZuPs3QEHbN8WJFp4C66PjUfCZWj6RLnaBn
Signature: 2xodt87BcrqCWVVLENHRkm9imHxuyQGeQYoxVpt3qZ2...

✅ Deployment successful! Program is live on devnet.
```

### Program Verification

```bash
$ solana program show DTQEHEAvQ1ZuPs3QEHbN8WJFp4C66PjUfCZWj6RLnaBn --url devnet

Program Id: DTQEHEAvQ1ZuPs3QEHbN8WJFp4C66PjUfCZWj6RLnaBn
Owner: BPFLoaderUpgradeab1e11111111111111111111111
ProgramData Address: C4zoJTkUM2v4LENaA8mfdR5xKGfkxeYdiDmbRDPhxx94
Authority: 9mECXZ2NZrHiWZJHppJp6tVQiqVBLFFh3XFW9qMib4HW
Last Deployed In Slot: 445891431
Data Length: 568416 (0x8ac60) bytes
Balance: 3.95737944 SOL
```

## 📋 Project Structure

```
solana-stablecoin-standard/
├── 📁 programs/
│   ├── sss_token/              # Main stablecoin program
│   │   ├── src/
│   │   │   ├── lib.rs          # Program entry point
│   │   │   ├── instructions/   # All instruction handlers
│   │   │   │   ├── initialize.rs
│   │   │   │   ├── mint.rs
│   │   │   │   ├── blacklist.rs
│   │   │   │   └── ...
│   │   │   └── state/          # Account structs
│   │   │       ├── config.rs
│   │   │       └── roles.rs
│   │   └── Cargo.toml
│   └── transfer_hook/          # SSS-2 transfer hook
├── 📁 sdk/
│   └── src/
│       ├── stablecoin.ts       # Main SDK class
│       ├── compliance.ts       # SSS-2 compliance module
│       ├── presets.ts          # SSS-1/SSS-2 presets
│       └── idl/
│           └── sss_token.json  # Program IDL
├── 📁 cli/
│   └── src/
│       └── cli.ts              # CLI implementation
├── 📁 backend/
│   └── src/                    # Express API services
├── 📁 tests/
│   ├── sss_token.ts            # Program tests
│   ├── sdk.test.ts             # SDK unit tests
│   └── integration.ts          # Integration tests
├── 📁 docs/
│   ├── ARCHITECTURE.md
│   ├── SDK.md
│   ├── OPERATIONS.md
│   └── COMPLIANCE.md
├── Cargo.toml                  # Workspace configuration
├── Anchor.toml                 # Anchor configuration
└── package.json
```

## 🛠️ Development

### Prerequisites

- **Rust** >= 1.70.0
- **Solana CLI** >= 1.18.25
- **Anchor** >= 0.30.1
- **Node.js** >= 18.0.0

### Building

```bash
# Build Rust programs
cargo-build-sbf

# Copy to deploy directory
cp target/sbpf-solana-solana/release/*.so target/deploy/

# Build SDK
npm run build
```

### Testing Locally

```bash
# Terminal 1: Start local validator
solana-test-validator --reset

# Terminal 2: Set environment and run tests
export ANCHOR_PROVIDER_URL=http://localhost:8899
export ANCHOR_WALLET=~/.config/solana/id.json

# Deploy locally
anchor deploy

# Run tests
anchor test --skip-local-validator
```

### Deploying to Devnet

```bash
# Switch to devnet
solana config set --url devnet

# Get devnet SOL
solana airdrop 2

# Build
anchor build

# Deploy
solana program deploy target/deploy/sss_token.so \
    --program-id target/deploy/sss_token-keypair.json

# Note the program ID and update:
# - programs/sss_token/src/lib.rs
# - Anchor.toml
# - sdk/src/utils.ts
# - sdk/src/idl/sss_token.json
```

## 🔐 Security Features

- **Role-Based Access Control**: Separate roles for minter, burner, freezer, pauser, blacklister
- **PDA-Based State**: All state stored in Program Derived Addresses for security
- **Input Validation**: Comprehensive validation on all inputs (name, symbol, decimals)
- **Feature Gating**: SSS-2 features fail gracefully if not enabled
- **Audit Trail**: All compliance actions emit events with timestamps

## 📚 Documentation

- [Architecture](./docs/ARCHITECTURE.md) - System design and data flows
- [SDK Reference](./docs/SDK.md) - TypeScript SDK documentation
- [Operations Guide](./docs/OPERATIONS.md) - Operator runbook
- [Compliance](./docs/COMPLIANCE.md) - Regulatory considerations
- [API Reference](./docs/API.md) - Backend API documentation


## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by [Solana Vault Standard](https://github.com/solana-developers/solana-vault-standard)
- Powered by [Anchor Framework](https://github.com/coral-xyz/anchor)
- Token-2022 extensions by [Solana Labs](https://solana.com)

---

**🏆 Submission for Superteam Brazil Solana Stablecoin Standard Bounty**

**Devnet Program**: `DTQEHEAvQ1ZuPs3QEHbN8WJFp4C66PjUfCZWj6RLnaBn`

**Status**: ✅ **DEPLOYED AND OPERATIONAL**
