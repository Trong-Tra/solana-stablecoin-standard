# Architecture

## Overview

The Solana Stablecoin Standard (SSS) follows a layered architecture that separates concerns and enables modularity.

## Layer Model

### Layer 1: Base SDK

The foundation provides core token functionality using Token-2022 extensions:

```
┌──────────────────────────────────────┐
│           Token-2022                 │
│  ┌──────────────┬─────────────────┐  │
│  │ Mint Token   │ Metadata        │  │
│  │ Freeze       │ Close Account   │  │
│  └──────────────┴─────────────────┘  │
└──────────────────────────────────────┘
              │
┌──────────────────────────────────────┐
│        SSS Token Program             │
│  ┌──────────────┬─────────────────┐  │
│  │ Role Mgmt    │ State (PDA)     │  │
│  │ Pause/Resume │ Events          │  │
│  └──────────────┴─────────────────┘  │
└──────────────────────────────────────┘
```

**Key Components:**
- `StablecoinState` - PDA storing configuration and totals
- `MinterState` - Per-minter quota tracking
- `BurnerState` - Burner authorization
- `RoleState` - RBAC enforcement

### Layer 2: Modules

Composable capability modules:

#### Compliance Module (SSS-2)
```
┌─────────────────────────────────┐
│     Compliance Module           │
│  ┌───────────────────────────┐  │
│  │ BlacklistEntry (PDA)      │  │
│  │ - address: Pubkey         │  │
│  │ - reason: String          │  │
│  │ - addedAt: i64            │  │
│  └───────────────────────────┘  │
│  ┌───────────────────────────┐  │
│  │ Transfer Hook Program     │  │
│  │ - Validates transfers     │  │
│  │ - Checks blacklist        │  │
│  └───────────────────────────┘  │
└─────────────────────────────────┘
```

#### Privacy Module (SSS-3 - Experimental)
- Confidential transfers
- Scoped allowlists

### Layer 3: Standards

Opinionated presets combining layers 1 and 2:

| Feature | SSS-1 | SSS-2 |
|---------|-------|-------|
| Mint Authority | ✅ | ✅ |
| Freeze Authority | ✅ | ✅ |
| Metadata | ✅ | ✅ |
| Role Management | ✅ | ✅ |
| Pause/Unpause | ✅ | ✅ |
| Permanent Delegate | ❌ | ✅ |
| Transfer Hook | ❌ | ✅ |
| Blacklist | ❌ | ✅ |
| Seizure | ❌ | ✅ |

## Data Flows

### Mint Flow
```
┌──────────┐     ┌──────────────┐     ┌─────────────┐     ┌──────────┐
│ Operator │────▶│ Mint Request │────▶│ Compliance  │────▶│ On-Chain │
└──────────┘     │   (API)      │     │   Check     │     │  Mint    │
                 └──────────────┘     └─────────────┘     └──────────┘
```

### Transfer Flow (SSS-2)
```
┌──────────┐     ┌──────────────┐     ┌─────────────┐     ┌──────────┐
│  Sender  │────▶│ Token-2022   │────▶│ Transfer    │────▶│ Receiver │
└──────────┘     │   Transfer   │     │ Hook Check  │     └──────────┘
                 └──────────────┘     └─────────────┘
                                             │
                                      ┌──────▼──────┐
                                      │ Blacklist   │
                                      │ Validation  │
                                      └─────────────┘
```

### Seizure Flow (SSS-2)
```
┌──────────┐     ┌──────────────┐     ┌─────────────┐     ┌──────────┐
│  Seizer  │────▶│ Verify       │────▶│ Permanent   │────▶│ Seizure  │
│ (Role)   │     │ Blacklisted  │     │ Delegate    │     │ Transfer │
└──────────┘     └──────────────┘     └─────────────┘     └──────────┘
```

## Security Model

### Role-Based Access Control

| Role | Permissions |
|------|-------------|
| Master | All operations, authority transfer |
| Minter | Mint tokens (within quota) |
| Burner | Burn tokens |
| Blacklister | Add/remove from blacklist (SSS-2) |
| Pauser | Pause/unpause transfers |
| Seizer | Seize tokens (SSS-2) |
| Freezer | Freeze/thaw accounts |

### PDA Structure

```
StablecoinState: ["stablecoin_state", mint]
MinterState: ["minter_state", mint, minter]
BurnerState: ["burner_state", mint, burner]
BlacklistEntry: ["blacklist", mint, address]
```

### Feature Gating

SSS-2 features are gated at initialization:
```rust
pub struct FeatureFlags {
    pub permanent_delegate: bool,  // Required for seizure
    pub transfer_hook: bool,       // Required for blacklist enforcement
    pub default_account_frozen: bool,
    pub confidential_transfers: bool,
}
```

Attempting SSS-2 operations on SSS-1 tokens results in:
```rust
require!(
    stablecoin_state.features.permanent_delegate,
    SssTokenError::ComplianceNotEnabled
);
```

## Event System

### On-Chain Events
```rust
#[event]
pub struct BlacklistEvent {
    pub mint: Pubkey,
    pub address: Pubkey,
    pub action: BlacklistAction,
    pub reason: String,
    pub timestamp: i64,
    pub authority: Pubkey,
}

#[event]
pub struct SeizureEvent {
    pub mint: Pubkey,
    pub from: Pubkey,
    pub to: Pubkey,
    pub amount: u64,
    pub timestamp: i64,
    pub authority: Pubkey,
}
```

### Off-Chain Indexing
The EventIndexer service monitors on-chain events and maintains:
- Transfer history
- Mint/burn logs
- Compliance actions
- Webhook notifications

## Backend Architecture

```
┌─────────────────────────────────────────┐
│           API Gateway                   │
│  ┌─────────┐ ┌─────────┐ ┌──────────┐ │
│  │  Mint   │ │ Events  │ │Compliance│ │
│  │  Burn   │ │ Indexer │ │  Service │ │
│  └─────────┘ └─────────┘ └──────────┘ │
└─────────────────────────────────────────┘
              │
┌─────────────────────────────────────────┐
│         Services Layer                  │
│  ┌──────────────┐  ┌──────────────┐    │
│  │ Mint/Burn    │  │ Compliance   │    │
│  │ Service      │  │ Service      │    │
│  └──────────────┘  └──────────────┘    │
│  ┌──────────────┐  ┌──────────────┐    │
│  │ Event        │  │ Webhook      │    │
│  │ Indexer      │  │ Service      │    │
│  └──────────────┘  └──────────────┘    │
└─────────────────────────────────────────┘
              │
┌─────────────────────────────────────────┐
│         Data Layer                      │
│  ┌──────────────┐  ┌──────────────┐    │
│  │ Request      │  │ Audit        │    │
│  │ Queue        │  │ Log          │    │
│  └──────────────┘  └──────────────┘    │
└─────────────────────────────────────────┘
```

## Error Handling

### Program Errors
```rust
#[error_code]
pub enum SssTokenError {
    Unauthorized = 6000,
    Paused = 6002,
    Blacklisted = 6004,
    ComplianceNotEnabled = 6005,
    QuotaExceeded = 6006,
    // ...
}
```

### SDK Errors
- Input validation
- Transaction simulation
- Retry logic with exponential backoff

## Performance Considerations

### On-Chain
- Minimal account sizes
- Efficient PDA derivation
- Batch operations where possible

### Off-Chain
- Connection pooling
- Event caching
- Webhook retry with backoff
