# Operations Guide

## Overview

This guide covers day-to-day operations for stablecoin operators using the CLI.

## Setup

### Install CLI

```bash
npm install -g @stbr/sss-token
```

### Configure Environment

```bash
# Set default cluster
export SSS_CLUSTER=devnet  # or mainnet, localnet

# Set keypair path
export SSS_KEYPAIR=~/.config/solana/id.json

# Or use CLI options
sss-token --cluster devnet --keypair ~/.config/solana/ops.json <command>
```

### Verify Setup

```bash
sss-token status
```

## Daily Operations

### 1. Minting Tokens

#### Check Status Before Mint

```bash
sss-token status
```

Verify:
- Stablecoin is not paused
- You have minter role
- Minter quota available

#### Execute Mint

```bash
# Mint to specific address
sss-token mint <RECIPIENT_ADDRESS> 1000

# Example
sss-token mint 7nxzn... 1000
# ✓ Mint successful
#   Signature: 5UfXm...
```

#### Post-Mint Verification

```bash
# Check supply
sss-token supply

# Check recipient balance (via Solana CLI)
solana balance <RECIPIENT_ADDRESS> --token <MINT_ADDRESS>
```

### 2. Burning Tokens

#### Standard Burn

```bash
# Burn from your account
sss-token burn 500
```

#### Burn from Another Account

```bash
# Requires burner role
sss-token burn 500 --from <ACCOUNT_ADDRESS>
```

### 3. Freezing Accounts

#### When to Freeze

- Suspicious activity detected
- Regulatory request
- Security incident
- Disputed transactions

#### Freeze Process

```bash
# 1. Document reason
# 2. Freeze account
sss-token freeze <ACCOUNT_ADDRESS>

# 3. Verify freeze
# Check on explorer or:
solana account <ACCOUNT_ADDRESS>
```

#### Thaw Process

```bash
# When issue resolved
sss-token thaw <ACCOUNT_ADDRESS>
```

### 4. Emergency Procedures

#### Pause Stablecoin

```bash
# Emergency stop all transfers
sss-token pause

# Verify
sss-token status
# Status: PAUSED
```

#### Resume Operations

```bash
# After incident resolved
sss-token unpause

# Verify
sss-token status
# Status: Active
```

## SSS-2 Compliance Operations

### Blacklist Management

#### Add to Blacklist

```bash
# With reason
sss-token blacklist add <ADDRESS> --reason "OFAC match"

# Example
sss-token blacklist add 7nxzn... --reason "OFAC SDN-12345"
```

#### Document Everything

Keep records of:
- Who added to blacklist
- When
- Reason
- Supporting documentation

```bash
# Check entry
sss-token blacklist check <ADDRESS>
```

#### Remove from Blacklist

```bash
# When no longer needed
sss-token blacklist remove <ADDRESS>
```

### Token Seizure

#### Prerequisites

1. Account must be frozen OR blacklisted
2. You must have seizer role
3. Permanent delegate enabled

#### Seizure Process

```bash
# 1. Verify account is frozen/blacklisted
sss-token blacklist check <FROM_ADDRESS>

# 2. Execute seizure
sss-token seize <FROM_ADDRESS> <TO_TREASURY> <AMOUNT>

# Example
sss-token seize 7nxzn... 9QqRz... 10000
# ✓ Seize successful
#   Signature: 5UfXm...
```

#### Post-Seizure

1. Document seizure in audit log
2. Report to compliance team
3. Update case files

## Role Management

### Adding Minters

```bash
# Add with quota (1M tokens)
sss-token minters --add <MINTER_ADDRESS> --quota 1000000000000

# Add unlimited minter
sss-token minters --add <MINTER_ADDRESS> --quota 0
```

### Removing Minters

```bash
sss-token minters --remove <MINTER_ADDRESS>
```

### Adding Burners

```bash
sss-token burners --add <BURNER_ADDRESS>
```

## Reporting

### Generate Audit Report

```bash
# Via API
curl http://localhost:3000/api/compliance/audit \
  -H "Authorization: Bearer $API_TOKEN"

# With date range
curl "http://localhost:3000/api/compliance/audit?startDate=2024-01-01&endDate=2024-12-31"
```

### Monitor Events

```bash
# Watch specific mint
sss-token events --watch <MINT_ADDRESS>

# Filter by type
sss-token events --type mint --type burn
```

## Troubleshooting

### Transaction Failed

```bash
# Check error
# Common errors:
# - "Paused" -> Unpause first
# - "QuotaExceeded" -> Increase minter quota
# - "Blacklisted" -> Address blocked
# - "Unauthorized" -> Check your roles

# Get detailed logs
sss-token --verbose <command>
```

### Account Not Found

```bash
# Verify address
solana address --keypair <KEYPAIR_PATH>

# Check account exists
solana account <ADDRESS>
```

### Connection Issues

```bash
# Test connection
sss-token --cluster devnet status

# Check RPC health
curl $SOLANA_RPC_URL -X POST \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"getHealth"}'
```

## Best Practices

### 1. Two-Person Rule

For critical operations:
```
Person A: Prepares transaction
Person B: Reviews and approves
Person A: Executes
```

### 2. Regular Audits

```bash
# Weekly: Check all minters
sss-token minters --list

# Weekly: Review blacklist
sss-token blacklist --list

# Monthly: Generate full audit
sss-token audit-log --export monthly.json
```

### 3. Key Rotation

```bash
# 1. Add new authority
sss-token roles --add-authority <NEW_ADDRESS>

# 2. Test new authority
sss-token --keypair new-key.json status

# 3. Transfer ownership
sss-token transfer-authority <NEW_ADDRESS>

# 4. Verify
sss-token --keypair new-key.json status
```

### 4. Incident Response

#### Suspected Fraud

```bash
# 1. Freeze immediately
sss-token freeze <SUSPICIOUS_ACCOUNT>

# 2. Check balance
sss-token supply

# 3. Document
sss-token audit-log --action freeze --note "Suspected fraud"

# 4. Report
# Notify compliance team
```

#### Regulatory Request

```bash
# 1. Verify request authenticity
# 2. Document request
# 3. Execute required action
sss-token blacklist add <ADDRESS> --reason "Regulatory request #12345"

# 4. Report back with proof
sss-token status
sss-token blacklist check <ADDRESS>
```

## Checklists

### Pre-Launch

- [ ] Authority keys secured in cold storage
- [ ] Backup authorities configured
- [ ] Mint metadata verified
- [ ] Test transactions completed
- [ ] Emergency procedures documented
- [ ] Compliance team trained

### Daily

- [ ] Check stablecoin status
- [ ] Review pending mint/burn requests
- [ ] Monitor for anomalies
- [ ] Verify backup systems

### Weekly

- [ ] Review minter quotas
- [ ] Audit role assignments
- [ ] Check blacklist entries
- [ ] Generate compliance report

### Monthly

- [ ] Full audit export
- [ ] Key rotation review
- [ ] Procedure updates
- [ ] Team training

## Emergency Contacts

Keep this information secure and accessible:

```
Solana Foundation:
- Security: security@solana.foundation

Your Team:
- Primary: ...
- Secondary: ...
- On-call: ...
```
