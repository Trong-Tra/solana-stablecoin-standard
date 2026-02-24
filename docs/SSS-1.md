# SSS-1: Minimal Stablecoin Standard

## Overview

SSS-1 is the minimal viable stablecoin standard. It provides the essential features needed for a functional stablecoin without compliance overhead.

## Use Cases

- **Internal tokens**: Corporate treasury management
- **DAO treasuries**: Community token distributions
- **Ecosystem settlement**: Inter-protocol payment rails
- **Experimental tokens**: Testing and development

## Specification

### Features

| Feature | Required | Description |
|---------|----------|-------------|
| Mint Authority | ✅ | Controlled token issuance |
| Freeze Authority | ✅ | Account freezing capability |
| Metadata | ✅ | Token name, symbol, URI |
| Role Management | ✅ | Minter/burner roles |
| Pause | ✅ | Emergency circuit breaker |

### Not Included

| Feature | Reason |
|---------|--------|
| Permanent Delegate | Not needed for simple tokens |
| Transfer Hook | No compliance requirements |
| Blacklist | Reactive compliance only |
| Seizure | No regulatory requirements |

### Token-2022 Extensions

```rust
// Minimum required extensions
pub struct SSS1Extensions {
    pub metadata_pointer: true,
    pub mint_close_authority: false,  // SSS-2 only
    pub permanent_delegate: false,    // SSS-2 only
    pub transfer_hook: false,         // SSS-2 only
}
```

## Configuration

### Initialization

```typescript
const config = {
  name: "Internal USD",
  symbol: "IUSD",
  uri: "https://company.com/tokens/iusd/metadata.json",
  decimals: 6,
  preset: Presets.SSS_1,
  extensions: {
    permanentDelegate: false,
    transferHook: false,
    defaultAccountFrozen: false,
    confidentialTransfers: false,
  },
};

const stablecoin = await SolanaStablecoin.create(connection, config, authority);
```

### Program Config

```rust
pub struct StablecoinConfig {
    pub name: String,           // max 32 chars
    pub symbol: String,         // max 10 chars
    pub uri: String,            // max 200 chars
    pub decimals: u8,           // 0-9
    pub enable_permanent_delegate: false,
    pub enable_transfer_hook: false,
    pub default_account_frozen: false,
}
```

## Operations

### Minting

```bash
# Add minter with quota
sss-token minters --add <MINTER_ADDRESS> --quota 1000000

# Mint tokens
sss-token mint <RECIPIENT> <AMOUNT>
```

### Freezing

```bash
# Freeze account
sss-token freeze <ACCOUNT_ADDRESS>

# Thaw account
sss-token thaw <ACCOUNT_ADDRESS>
```

### Emergency Controls

```bash
# Pause all transfers
sss-token pause

# Resume transfers
sss-token unpause

# Check status
sss-token status
```

## Role Management

### Minter Roles

| Quota | Behavior |
|-------|----------|
| 0 | Unlimited minting |
| N | Can mint up to N total |

```typescript
// Set minter with 1M token quota
await stablecoin.updateMinter({
  minter: minterPublicKey,
  quota: 1_000_000_000_000, // 1M with 6 decimals
  active: true,
});
```

### Burner Roles

Burners can burn tokens from any account:

```typescript
await stablecoin.updateBurner({
  burner: burnerPublicKey,
  active: true,
});
```

## Security Model

### Reactive Compliance

SSS-1 uses reactive compliance:
1. Monitor for suspicious activity
2. Freeze accounts if needed
3. Burn tokens if necessary

```bash
# React to suspicious activity
sss-token freeze <SUSPICIOUS_ACCOUNT>
sss-token burn <AMOUNT> --from <SUSPICIOUS_ACCOUNT>
```

### Access Control

```
Master Authority
    ├── Minter (quota-based)
    ├── Burner
    └── Freezer
```

## State Structure

```rust
pub struct StablecoinState {
    pub master_authority: Pubkey,
    pub mint: Pubkey,
    pub name: String,
    pub symbol: String,
    pub uri: String,
    pub decimals: u8,
    pub features: FeatureFlags {
        permanent_delegate: false,
        transfer_hook: false,
        default_account_frozen: false,
        confidential_transfers: false,
    },
    pub paused: bool,
    pub total_minted: u64,
    pub total_burned: u64,
}
```

## Error Handling

| Error | Code | Scenario |
|-------|------|----------|
| Unauthorized | 6000 | Invalid signer |
| Paused | 6002 | Transfers paused |
| QuotaExceeded | 6006 | Minter over quota |
| InvalidAmount | 6007 | Zero or invalid amount |

## Migration to SSS-2

SSS-1 tokens cannot be directly upgraded to SSS-2. To upgrade:

1. Burn all SSS-1 tokens
2. Close SSS-1 mint
3. Initialize new SSS-2 token
4. Distribute new tokens to holders

## Example: DAO Treasury

```typescript
// Setup
const treasury = await SolanaStablecoin.create(connection, {
  preset: Presets.SSS_1,
  name: "DAO Treasury Token",
  symbol: "DTT",
  uri: "https://dao.example/token.json",
  decimals: 6,
}, daoAuthority);

// Add minters (treasury managers)
await treasury.updateMinter({
  minter: manager1.publicKey,
  quota: 10_000_000_000_000, // 10M
  active: true,
});

await treasury.updateMinter({
  minter: manager2.publicKey,
  quota: 10_000_000_000_000, // 10M
  active: true,
});

// Monthly distribution
await treasury.mint({
  recipient: contributorWallet,
  amount: 500_000_000, // 500 tokens
});
```

## Gas Costs

| Operation | Compute Units |
|-----------|---------------|
| Initialize | ~50,000 |
| Mint | ~10,000 |
| Burn | ~8,000 |
| Freeze | ~5,000 |
| Pause | ~3,000 |

## References

- [Token-2022 Extensions](https://spl.solana.com/token-2022/extensions)
- [Solana Vault Standard](https://github.com/solana-developers/solana-vault-standard)
