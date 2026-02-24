# Solana Stablecoin Standard (SSS)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Anchor](https://img.shields.io/badge/Anchor-0.30.1-blue.svg)](https://github.com/coral-xyz/anchor)
[![Solana](https://img.shields.io/badge/Solana-2.1.0-purple.svg)](https://solana.com)

A modular, production-ready SDK for creating stablecoins on Solana with configurable compliance features. Built by Superteam Brazil.

## Overview

The Solana Stablecoin Standard (SSS) provides a comprehensive toolkit for institutions and builders to create, manage, and operate stablecoins on Solana. It features two opinionated presets:

- **SSS-1 (Minimal)**: Basic stablecoin with mint authority, freeze authority, and metadata
- **SSS-2 (Compliant)**: Full compliance features including blacklist enforcement and token seizure

## Architecture

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

## Quick Start

### Installation

```bash
# Clone the repository
git clone https://github.com/solanabr/solana-stablecoin-standard.git
cd solana-stablecoin-standard

# Install dependencies
npm install

# Build the SDK
npm run build
```

### Using the CLI

```bash
# Initialize SSS-1 (Minimal) stablecoin
sss-token init --preset sss-1 --name "My USD" --symbol "MYUSD" --uri "https://example.com/metadata.json"

# Initialize SSS-2 (Compliant) stablecoin
sss-token init --preset sss-2 --name "Regulated USD" --symbol "RUSD" --uri "https://example.com/metadata.json"

# Mint tokens
sss-token mint <RECIPIENT_ADDRESS> 1000

# Check status
sss-token status
```

### Using the TypeScript SDK

```typescript
import { SolanaStablecoin, Presets } from "@stbr/sss-token";

// Create SSS-2 compliant stablecoin
const stablecoin = await SolanaStablecoin.create(connection, {
  preset: Presets.SSS_2,
  name: "Regulated USD",
  symbol: "RUSD",
  decimals: 6,
  authority: adminKeypair,
});

// Mint tokens
await stablecoin.mint({
  recipient: recipientPublicKey,
  amount: 1_000_000, // 1 token with 6 decimals
});

// SSS-2: Add to blacklist
await stablecoin.compliance.blacklistAdd(badActorAddress, "OFAC match");

// SSS-2: Seize tokens
await stablecoin.compliance.seize({
  from: blacklistedAccount,
  to: treasuryAccount,
  amount: seizedAmount,
});
```

## Documentation

- [Architecture](./docs/ARCHITECTURE.md) - Technical architecture and data flows
- [SDK Reference](./docs/SDK.md) - TypeScript SDK documentation
- [Operations Guide](./docs/OPERATIONS.md) - Operator runbook
- [SSS-1 Standard](./docs/SSS-1.md) - Minimal stablecoin specification
- [SSS-2 Standard](./docs/SSS-2.md) - Compliant stablecoin specification
- [Compliance](./docs/COMPLIANCE.md) - Regulatory considerations
- [API Reference](./docs/API.md) - Backend API documentation

## Programs

| Program | Description | Program ID |
|---------|-------------|------------|
| `sss_token` | Main stablecoin program | `SSSs1xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` |
| `transfer_hook` | Blacklist enforcement hook | `SSSh1xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` |

## Features

### SSS-1 (Minimal Stablecoin)
- ✅ Mint authority with role-based access
- ✅ Freeze/thaw accounts
- ✅ Metadata management
- ✅ Pause/unpause transfers
- ✅ Minter quotas
- ✅ Authority transfer

### SSS-2 (Compliant Stablecoin)
- ✅ All SSS-1 features
- ✅ Permanent delegate for seizure
- ✅ Transfer hook for blacklist enforcement
- ✅ Blacklist management
- ✅ Token seizure from frozen accounts
- ✅ Audit trail
- ✅ Compliance service integration

## Testing

```bash
# Run unit tests
anchor test

# Run specific preset tests
anchor test -- --grep "SSS-1"
anchor test -- --grep "SSS-2"
```

## Backend Services

```bash
# Start backend services
docker-compose up

# Services available at:
# - API: http://localhost:3000
# - Health: http://localhost:3000/health
```

## Deployment

### Devnet
```bash
anchor deploy --provider.cluster devnet
```

### Mainnet
```bash
anchor deploy --provider.cluster mainnet
```

## Security

- Role-based access control for all operations
- Feature gating prevents unauthorized use of compliance modules
- Comprehensive input validation
- Audit trail for all compliance actions
- PDA-based state management

## Contributing

Contributions are welcome! Please read our [Contributing Guide](./CONTRIBUTING.md) for details.

## License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## Acknowledgments

- Built by [Superteam Brazil](https://superteam.com.br)
- Inspired by [Solana Vault Standard](https://github.com/solana-developers/solana-vault-standard)
- Powered by [Anchor Framework](https://github.com/coral-xyz/anchor)

## Support

- GitHub Issues: [Open an issue](https://github.com/solanabr/solana-stablecoin-standard/issues)
- Discord: [Superteam Brazil](https://discord.gg/superteambrasil)
- Twitter: [@SuperteamBR](https://twitter.com/SuperteamBR)
