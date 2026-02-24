# SSS-2: Compliant Stablecoin Standard

## Overview

SSS-2 is the full-compliance stablecoin standard. It includes all SSS-1 features plus regulatory compliance capabilities required for regulated stablecoins like USDC/USDT.

## Use Cases

- **Regulated stablecoins**: Full compliance with regulations
- **Institutional tokens**: Corporate settlement with KYC/AML
- **Exchange tokens**: CEX/DeFi integration with compliance
- **Cross-border payments**: Remittance with regulatory adherence

## Specification

### Features

| Feature | Required | Description |
|---------|----------|-------------|
| All SSS-1 Features | ✅ | Full SSS-1 compatibility |
| Permanent Delegate | ✅ | Token seizure capability |
| Transfer Hook | ✅ | Blacklist enforcement |
| Blacklist | ✅ | Address blocking |
| Seizure | ✅ | Force transfer from blacklisted accounts |
| Audit Trail | ✅ | Compliance event logging |

### Token-2022 Extensions

```rust
pub struct SSS2Extensions {
    pub metadata_pointer: true,
    pub mint_close_authority: true,
    pub permanent_delegate: true,     // Required for seizure
    pub transfer_hook: true,          // Required for blacklist enforcement
}
```

## Configuration

### Initialization

```typescript
const config = {
  name: "Regulated USD",
  symbol: "RUSD",
  uri: "https://regulated.example/tokens/rusd/metadata.json",
  decimals: 6,
  preset: Presets.SSS_2,
  extensions: {
    permanentDelegate: true,
    transferHook: true,
    defaultAccountFrozen: false,
    confidentialTransfers: false,
  },
};

const stablecoin = await SolanaStablecoin.create(connection, config, authority);
```

### Program Config

```rust
pub struct StablecoinConfig {
    pub name: String,
    pub symbol: String,
    pub uri: String,
    pub decimals: u8,
    pub enable_permanent_delegate: true,
    pub enable_transfer_hook: true,
    pub default_account_frozen: false,
}
```

## Compliance Operations

### Blacklist Management

```bash
# Add to blacklist
sss-token blacklist add <ADDRESS> --reason "OFAC match"

# Remove from blacklist
sss-token blacklist remove <ADDRESS>

# Check blacklist status
sss-token blacklist check <ADDRESS>
```

### Token Seizure

```bash
# Seize tokens from blacklisted account
sss-token seize <FROM_ADDRESS> <TO_TREASURY> <AMOUNT>
```

### TypeScript SDK

```typescript
// Add to blacklist with reason
await stablecoin.compliance.addToBlacklist({
  address: badActorAddress,
  reason: "OFAC SDN List match",
});

// Check if blacklisted
const isBlocked = await stablecoin.compliance.isBlacklisted(address);

// Seize tokens
await stablecoin.compliance.seize({
  from: blacklistedAccount,
  to: treasuryAccount,
  amount: 1_000_000, // 1 token
});
```

## Transfer Hook

### How It Works

```
┌──────────────┐
│   Transfer   │
│   Request    │
└──────┬───────┘
       │
┌──────▼───────┐     ┌──────────────┐
│ Transfer Hook│────▶│ Check Source │
│   Program    │     │ Blacklisted? │
└──────┬───────┘     └──────────────┘
       │                     │
       │              ┌──────▼──────┐
       │              │ If Yes:     │
       │              │ Reject      │
       │              └─────────────┘
       │
┌──────▼───────┐     ┌──────────────┐
│ Check Dest   │────▶│ Check Dest   │
│ Blacklisted? │     │ Blacklisted? │
└──────┬───────┘     └──────────────┘
       │                     │
       │              ┌──────▼──────┐
       │              │ If Yes:     │
       │              │ Reject      │
       │              └─────────────┘
       │
┌──────▼───────┐
│ Approve      │
│ Transfer     │
└──────────────┘
```

### On-Chain Implementation

```rust
pub fn execute(ctx: Context<ExecuteHook>, amount: u64) -> Result<()> {
    // Check source
    let source_blacklist = ctx.accounts.source_blacklist.as_ref();
    if let Some(blacklist) = source_blacklist {
        require!(
            blacklist.address != ctx.accounts.source_token.owner,
            SssHookError::SourceBlacklisted
        );
    }
    
    // Check destination
    let dest_blacklist = ctx.accounts.destination_blacklist.as_ref();
    if let Some(blacklist) = dest_blacklist {
        require!(
            blacklist.address != ctx.accounts.destination_token.owner,
            SssHookError::DestinationBlacklisted
        );
    }
    
    Ok(())
}
```

## Role Management

### Compliance Roles

| Role | Permissions |
|------|-------------|
| Blacklister | Add/remove from blacklist |
| Seizer | Seize tokens from blacklisted accounts |
| Master | All compliance operations |

```bash
# Set blacklister
sss-token roles --set-blacklister <ADDRESS>

# Set seizer
sss-token roles --set-seizer <ADDRESS>
```

### Role Isolation

No single key controls everything:

```
Master Authority
    ├── Minter
    ├── Burner
    ├── Freezer
    ├── Blacklister
    └── Seizer
```

## Seizure Process

### Requirements

1. Account must be frozen OR blacklisted
2. Caller must have seizer role
3. Permanent delegate must be enabled

### Flow

```rust
pub fn seize(ctx: Context<SeizeTokens>, amount: u64) -> Result<()> {
    // Verify blacklisted
    require!(
        ctx.accounts.blacklist_entry.address == ctx.accounts.from.owner,
        SssTokenError::InvalidAuthority
    );
    
    // Execute transfer using permanent delegate
    let cpi_accounts = TransferChecked {
        from: ctx.accounts.from.to_account_info(),
        mint: ctx.accounts.mint.to_account_info(),
        to: ctx.accounts.to.to_account_info(),
        authority: ctx.accounts.authority.to_account_info(),
    };
    
    anchor_spl::token_2022::transfer_checked(cpi_ctx, amount, decimals)?;
    
    // Emit seizure event
    emit!(SeizureEvent {
        mint: state.mint,
        from: ctx.accounts.from.owner,
        to: ctx.accounts.to.owner,
        amount,
        timestamp: Clock::get()?.unix_timestamp,
        authority: ctx.accounts.authority.key(),
    });
    
    Ok(())
}
```

## Audit Trail

### On-Chain Events

```rust
#[event]
pub struct BlacklistEvent {
    pub mint: Pubkey,
    pub address: Pubkey,
    pub action: BlacklistAction,  // Add or Remove
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

### Off-Chain Storage

```typescript
// Export audit log
const logs = await complianceService.exportAuditLog({
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-12-31'),
  action: 'BLACKLIST_ADD',
});

// Format for regulators
const auditReport = {
  stablecoin: mintAddress,
  period: { start, end },
  actions: logs.map(log => ({
    timestamp: log.timestamp,
    action: log.action,
    actor: log.actor,
    target: log.target,
    details: log.details,
  })),
};
```

## Regulatory Compliance

### GENIUS Act Alignment

| Requirement | SSS-2 Implementation |
|-------------|---------------------|
| Reserve requirements | Off-chain (issuer responsibility) |
| Redemption rights | Burn functionality |
| Blacklist capability | Permanent delegate + blacklist |
| Audit trail | On-chain events + off-chain indexing |
| Access controls | Role-based permission system |

### OFAC Compliance

```typescript
// Check sanctions before minting
async function checkAndMint(recipient: string, amount: number) {
  const sanctions = await complianceService.checkSanctions(recipient);
  
  if (sanctions.isSanctioned) {
    // Add to blacklist automatically
    await stablecoin.compliance.addToBlacklist({
      address: recipient,
      reason: `OFAC: ${sanctions.sources.join(', ')}`,
    });
    throw new Error('Sanctioned address detected');
  }
  
  // Proceed with mint
  await stablecoin.mint({ recipient, amount });
}
```

## Error Handling

| Error | Code | Scenario |
|-------|------|----------|
| ComplianceNotEnabled | 6005 | SSS-2 op on SSS-1 token |
| Blacklisted | 6004 | Transfer from/to blacklisted |
| NoPermanentDelegate | 6016 | Seizure without delegate |
| InvalidAuthority | 6018 | Seizer without role |

## Feature Gating

SSS-2 instructions fail gracefully on SSS-1:

```rust
pub fn add_to_blacklist(...) -> Result<()> {
    require!(
        stablecoin_state.features.permanent_delegate,
        SssTokenError::ComplianceNotEnabled
    );
    // ...
}
```

## Gas Costs

| Operation | Compute Units |
|-----------|---------------|
| Initialize | ~70,000 |
| Mint | ~12,000 |
| Transfer (with hook) | ~15,000 |
| Blacklist Add | ~8,000 |
| Seize | ~12,000 |

## Example: Regulated Stablecoin

```typescript
// Initialize regulated stablecoin
const rusd = await SolanaStablecoin.create(connection, {
  preset: Presets.SSS_2,
  name: "Regulated USD",
  symbol: "RUSD",
  uri: "https://regulated.example/rusd.json",
  decimals: 6,
}, masterAuthority);

// Setup compliance team
await rusd.updateBurner({ burner: opsTeam.publicKey, active: true });
await rusd.updateMinter({ minter: opsTeam.publicKey, quota: 0, active: true });

// Onboard customer with KYC
async function onboardCustomer(customerAddress: string, kycData: KYCData) {
  // Verify KYC
  if (!await verifyKYC(kycData)) {
    throw new Error('KYC failed');
  }
  
  // Check sanctions
  const sanctions = await complianceService.checkSanctions(customerAddress);
  if (sanctions.isSanctioned) {
    await rusd.compliance.addToBlacklist({
      address: customerAddress,
      reason: 'Sanctions match',
    });
    throw new Error('Sanctions match');
  }
  
  // Mint welcome bonus
  await rusd.mint({
    recipient: new PublicKey(customerAddress),
    amount: 100_000_000, // 100 RUSD
  });
}

// Handle suspicious activity
async function handleSuspiciousActivity(suspiciousAddress: string) {
  // Freeze account
  await rusd.freeze({ targetAccount: new PublicKey(suspiciousAddress) });
  
  // Add to blacklist
  await rusd.compliance.addToBlacklist({
    address: suspiciousAddress,
    reason: 'Suspicious activity detected',
  });
  
  // Seize funds to treasury
  await rusd.compliance.seize({
    from: new PublicKey(suspiciousAddress),
    to: treasuryAddress,
    amount: await getBalance(suspiciousAddress),
  });
}
```

## References

- [GENIUS Act](https://www.banking.senate.gov/legislation/clarity-for-payment-stablecoins-act)
- [OFAC SDN List](https://ofac.treasury.gov/specially-designated-nationals-and-blocked-persons-list-sdn-human-readable-lists)
- [Token-2022 Transfer Hook](https://spl.solana.com/token-2022/extensions#transfer-hook)
