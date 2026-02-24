# SDK Documentation

## Overview

The TypeScript SDK provides a simple interface for creating and managing stablecoins on Solana.

## Installation

```bash
npm install @stbr/sss-token
```

## Quick Start

```typescript
import { SolanaStablecoin, Presets } from "@stbr/sss-token";
import { Connection, Keypair } from "@solana/web3.js";

// Setup
const connection = new Connection("https://api.devnet.solana.com");
const authority = Keypair.generate(); // Load your keypair

// Create SSS-2 stablecoin
const stablecoin = await SolanaStablecoin.create(connection, {
  preset: Presets.SSS_2,
  name: "My Stablecoin",
  symbol: "MUSD",
  uri: "https://example.com/metadata.json",
  decimals: 6,
  authority,
});

console.log("Mint:", stablecoin.mint.toBase58());
```

## Presets

### SSS-1 (Minimal)

```typescript
import { createSSS1Config } from "@stbr/sss-token";

const config = createSSS1Config(
  "Internal USD",     // name
  "IUSD",             // symbol
  "https://...",      // metadata URI
  6                   // decimals
);

const stablecoin = await SolanaStablecoin.create(connection, config, authority);
```

### SSS-2 (Compliant)

```typescript
import { createSSS2Config } from "@stbr/sss-token";

const config = createSSS2Config(
  "Regulated USD",    // name
  "RUSD",             // symbol
  "https://...",      // metadata URI
  6                   // decimals
);

const stablecoin = await SolanaStablecoin.create(connection, config, authority);
```

### Custom Configuration

```typescript
import { Presets } from "@stbr/sss-token";

const customConfig = {
  name: "Custom Stable",
  symbol: "CUSD",
  uri: "https://example.com/cusd.json",
  decimals: 9,
  preset: Presets.CUSTOM,
  extensions: {
    permanentDelegate: true,
    transferHook: false,
    defaultAccountFrozen: false,
    confidentialTransfers: false,
  },
};
```

## Core Operations

### Minting

```typescript
// Simple mint
await stablecoin.mint({
  recipient: recipientPublicKey,
  amount: 1_000_000, // 1 token with 6 decimals
});

// Mint with specific minter
await stablecoin.mint({
  recipient: recipientPublicKey,
  amount: 1_000_000,
  minter: minterPublicKey,
});
```

### Burning

```typescript
// Burn from authority account
await stablecoin.burn({
  amount: 500_000,
});

// Burn from specific account
await stablecoin.burn({
  amount: 500_000,
  from: accountPublicKey,
});
```

### Freezing

```typescript
// Freeze an account
await stablecoin.freeze({
  targetAccount: suspiciousAccount,
});

// Thaw (unfreeze) an account
await stablecoin.thaw({
  targetAccount: verifiedAccount,
});
```

### Pause/Unpause

```typescript
// Emergency pause
await stablecoin.pause();

// Resume operations
await stablecoin.unpause();

// Check status
const isPaused = await stablecoin.isPaused();
```

## SSS-2 Compliance Operations

### Blacklist Management

```typescript
// Add to blacklist
await stablecoin.compliance.addToBlacklist({
  address: badActorAddress,
  reason: "OFAC match",
});

// Remove from blacklist
await stablecoin.compliance.removeFromBlacklist(address);

// Check blacklist status
const isBlacklisted = await stablecoin.compliance.isBlacklisted(address);

// Get blacklist details
const entry = await stablecoin.compliance.getBlacklistEntry(address);
// { address, mint, reason, addedAt, addedBy }
```

### Token Seizure

```typescript
// Seize tokens from blacklisted account
await stablecoin.compliance.seize({
  from: blacklistedAccount,
  to: treasuryAccount,
  amount: 1_000_000,
});
```

## Role Management

### Minter Management

```typescript
// Add minter with quota
await stablecoin.updateMinter({
  minter: newMinterPublicKey,
  quota: 10_000_000_000_000, // 10M tokens (6 decimals)
  active: true,
});

// Remove minter
await stablecoin.updateMinter({
  minter: minterToRemove,
  quota: 0,
  active: false,
});

// Unlimited quota (quota = 0)
await stablecoin.updateMinter({
  minter: unlimitedMinter,
  quota: 0, // Unlimited
  active: true,
});
```

### Burner Management

```typescript
// Add burner
await stablecoin.updateBurner({
  burner: newBurnerPublicKey,
  active: true,
});

// Remove burner
await stablecoin.updateBurner({
  burner: burnerToRemove,
  active: false,
});
```

## Authority Management

### Transfer Authority

```typescript
// Transfer master authority (irreversible!)
await stablecoin.transferAuthority(newAuthorityPublicKey);
```

⚠️ **Warning**: This action cannot be undone. The current authority will lose all control.

## State Queries

### Get Stablecoin State

```typescript
const state = await stablecoin.getState();

console.log(state);
// {
//   masterAuthority: PublicKey,
//   mint: PublicKey,
//   name: "My Stablecoin",
//   symbol: "MUSD",
//   uri: "https://...",
//   decimals: 6,
//   features: {
//     permanentDelegate: true,
//     transferHook: true,
//     defaultAccountFrozen: false,
//     confidentialTransfers: false,
//   },
//   paused: false,
//   totalMinted: BN,
//   totalBurned: BN,
//   bump: 255,
//   version: 1,
// }
```

### Get Supply

```typescript
const supply = await stablecoin.getTotalSupply();
console.log("Total supply:", supply.toString());
```

## Loading Existing Stablecoins

```typescript
// Load an existing stablecoin
const stablecoin = await SolanaStablecoin.load(
  connection,
  new PublicKey("MINT_ADDRESS"),
  authority
);

// Get state
const state = await stablecoin.getState();
console.log("Name:", state.name);
```

## Error Handling

```typescript
try {
  await stablecoin.mint({ recipient, amount });
} catch (error) {
  if (error.message.includes("QuotaExceeded")) {
    console.error("Minter quota exceeded");
  } else if (error.message.includes("Paused")) {
    console.error("Stablecoin is paused");
  } else if (error.message.includes("Blacklisted")) {
    console.error("Address is blacklisted");
  } else {
    console.error("Unknown error:", error);
  }
}
```

## Utility Functions

### Amount Conversion

```typescript
import { toTokenAmount, fromBN } from "@stbr/sss-token";

// Convert number to token amount
const amount = toTokenAmount(100.5, 6); // 100500000

// Convert BN to readable number
const readable = fromBN(amount, 6); // 100.5
```

### PDA Helpers

```typescript
import {
  getStablecoinStatePDA,
  getMinterStatePDA,
  getBlacklistPDA,
} from "@stbr/sss-token";

const [statePDA] = getStablecoinStatePDA(mint);
const [minterPDA] = getMinterStatePDA(mint, minter);
const [blacklistPDA] = getBlacklistPDA(mint, address);
```

## Advanced Usage

### Batch Operations

```typescript
// Mint to multiple recipients
const recipients = [addr1, addr2, addr3];
const amount = 100_000_000; // 100 tokens

const promises = recipients.map(recipient =>
  stablecoin.mint({ recipient, amount })
);

const signatures = await Promise.all(promises);
```

### Event Monitoring

```typescript
import { EventIndexer } from "@stbr/sss-token/backend";

const indexer = new EventIndexer(connection);
indexer.watchMint(stablecoin.mint.toBase58());

// Get events
const events = indexer.getEvents(stablecoin.mint.toBase58(), "mint");
```

### Custom Connection Options

```typescript
import { Connection, Commitment } from "@solana/web3.js";

const connection = new Connection("https://...", {
  commitment: "confirmed" as Commitment,
  confirmTransactionInitialTimeout: 60000,
});
```

## TypeScript Types

```typescript
import {
  StablecoinConfig,
  StablecoinState,
  MintParams,
  BurnParams,
  FeatureFlags,
  BlacklistEntry,
  // ... and more
} from "@stbr/sss-token";
```

## Best Practices

1. **Always validate addresses**
   ```typescript
   import { isValidPublicKey } from "@stbr/sss-token";
   
   if (!isValidPublicKey(address)) {
     throw new Error("Invalid address");
   }
   ```

2. **Handle decimals correctly**
   ```typescript
   const amount = toTokenAmount(userInput, stablecoin.config.decimals);
   ```

3. **Check compliance before operations**
   ```typescript
   if (stablecoin.compliance.isEnabled()) {
     const isBlocked = await stablecoin.compliance.isBlacklisted(recipient);
     if (isBlocked) throw new Error("Recipient blacklisted");
   }
   ```

4. **Use quotas for minters**
   ```typescript
   // Set reasonable quotas to limit exposure
   await stablecoin.updateMinter({
     minter,
     quota: toTokenAmount(1000000, 6), // 1M max
     active: true,
   });
   ```

5. **Monitor transactions**
   ```typescript
   const sig = await stablecoin.mint({ recipient, amount });
   await confirmTransaction(connection, sig, "confirmed");
   ```
