# Compliance Guide

## Overview

This document covers regulatory considerations and compliance procedures for operating SSS-2 compliant stablecoins.

## Regulatory Framework

### United States

#### GENIUS Act Requirements

The Clarity for Payment Stablecoins Act (GENIUS Act) establishes requirements for payment stablecoin issuers:

| Requirement | SSS-2 Implementation |
|-------------|---------------------|
| **Permitted Issuers** | Non-bank entities with approval |
| **Reserve Requirements** | 1:1 backing with high-quality liquid assets |
| **Redemption Rights** | Same-day redemption at par value |
| **Disclosure** | Monthly attestation reports |
| **Operational Standards** | Risk management and internal controls |
| **Blacklist Capability** | ✅ Permanent delegate + blacklist |
| **Audit Trail** | ✅ On-chain events + off-chain storage |

#### OFAC Compliance

**Sanctions Screening:**

```typescript
// Pre-transaction screening
async function screenAddress(address: string): Promise<void> {
  const check = await complianceService.checkSanctions(address);
  
  if (check.isSanctioned) {
    // Auto-blacklist
    await stablecoin.compliance.addToBlacklist({
      address,
      reason: `OFAC: ${check.sources.join(', ')}`,
    });
    
    throw new Error('Sanctions match - address blacklisted');
  }
}

// Apply to all operations
await screenAddress(recipient); // Before mint
await screenAddress(sender);    // Before transfer (via hook)
```

**SDN List Integration:**
- Daily updates from OFAC
- Automatic screening on mint/transfer
- Audit trail of all screenings

### European Union

#### MiCA (Markets in Crypto-Assets)

| Requirement | Implementation |
|-------------|---------------|
| **Authorization** | CASP license required |
| **Asset Reference** | 1:1 reserve composition |
| **Redemption** | 30-day max redemption period |
| **Custody** | Segregated funds |
| **AML/KYC** | Full customer verification |
| **Transaction Monitoring** | ✅ Compliance service |
| **Suspicious Activity Reports** | ✅ Automated reporting |

### Other Jurisdictions

| Jurisdiction | Key Requirements |
|--------------|-----------------|
| **Singapore** | MAS licensing, travel rule |
| **Hong Kong** | SFC licensing, retail restrictions |
| **UAE** | VARA framework, custody requirements |
| **Brazil** | CVM regulations, Bacen oversight |

## AML/KYC Procedures

### Customer Onboarding

```typescript
interface KYCPayload {
  customerId: string;
  name: string;
  dateOfBirth: string;
  address: string;
  documentType: 'passport' | 'id_card' | 'drivers_license';
  documentNumber: string;
  documentExpiry: string;
  country: string;
  pepStatus: boolean;
  sanctionsScreening: SanctionsResult;
}

async function onboardCustomer(kycData: KYCPayload): Promise<string> {
  // 1. Verify identity
  const identityVerified = await verifyIdentity(kycData);
  if (!identityVerified) {
    throw new Error('Identity verification failed');
  }
  
  // 2. Check sanctions
  const sanctionsCheck = await checkSanctions(kycData);
  if (sanctionsCheck.isSanctioned) {
    await reportSuspiciousActivity({
      type: 'SANCTIONS_MATCH',
      customerId: kycData.customerId,
      details: sanctionsCheck,
    });
    throw new Error('Sanctions match');
  }
  
  // 3. PEP screening
  if (kycData.pepStatus) {
    await flagEnhancedDueDiligence(kycData.customerId);
  }
  
  // 4. Risk rating
  const riskRating = calculateRiskRating(kycData);
  
  // 5. Create wallet
  const wallet = await createCustodialWallet();
  
  // 6. Record in system
  await recordCustomer({
    ...kycData,
    walletAddress: wallet.address,
    riskRating,
    onboardedAt: new Date(),
  });
  
  return wallet.address;
}
```

### Transaction Monitoring

**Risk Indicators:**

| Indicator | Risk Level | Action |
|-----------|-----------|--------|
| Large transaction (> $10K) | Medium | Enhanced monitoring |
| Rapid succession transfers | High | Temporary freeze |
| Known mixer interaction | Critical | Blacklist + report |
| Sanctions list match | Critical | Block + report |
| Round-number amounts | Low | Log for review |

**Automated Monitoring:**

```typescript
async function monitorTransaction(tx: Transaction): Promise<void> {
  const riskScore = calculateRiskScore(tx);
  
  if (riskScore >= 90) {
    // Critical - Block and report
    await stablecoin.freeze({ targetAccount: tx.sender });
    await stablecoin.compliance.addToBlacklist({
      address: tx.sender,
      reason: `Risk score: ${riskScore}`,
    });
    await reportSuspiciousActivity({
      type: 'HIGH_RISK_TRANSACTION',
      transaction: tx,
      riskScore,
    });
  } else if (riskScore >= 70) {
    // High - Flag for review
    await flagForReview(tx);
  }
}
```

## Audit Trail

### On-Chain Events

All compliance actions are logged on-chain:

```rustn#[event]
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

### Off-Chain Storage

```typescript
interface AuditLogEntry {
  id: string;
  timestamp: Date;
  action: 'BLACKLIST_ADD' | 'BLACKLIST_REMOVE' | 'SEIZURE' | 'FREEZE' | 'MINT' | 'BURN';
  actor: string;           // Who performed the action
  target?: string;         // Affected address
  mint?: string;           // Stablecoin mint
  details: {
    signature?: string;    // Transaction signature
    reason?: string;       // Why action was taken
    amount?: string;       // For seizures/transfers
    previousState?: any;   // State before action
  };
  ipAddress?: string;      // For operator actions
  userAgent?: string;      // Client information
}
```

### Audit Report Generation

```bash
# Monthly compliance report
sss-token audit-log \
  --start-date 2024-01-01 \
  --end-date 2024-01-31 \
  --export monthly-audit.json

# Via API
curl "http://localhost:3000/api/compliance/audit?startDate=2024-01-01&endDate=2024-01-31" \
  -H "Authorization: Bearer $TOKEN"
```

## Blacklist Management

### Adding to Blacklist

**Valid Reasons:**
- OFAC/UN sanctions match
- Law enforcement request
- Court order
- Internal investigation finding
- Regulatory directive

**Documentation Required:**
```typescript
interface BlacklistDocumentation {
  address: string;
  reason: string;
  evidence: {
    type: 'sanctions_list' | 'legal_request' | 'internal';
    reference: string;     // Case number, list entry, etc.
    documents: string[];   // Supporting document URLs
  };
  approvedBy: string;      // Authorizing person
  legalReview: boolean;    // Legal team approval
}
```

### Removal Process

1. **Request Review**
   - Submit removal request with justification
   - Legal team review
   - Compliance officer approval

2. **Execute Removal**
   ```bash
   sss-token blacklist remove <ADDRESS>
   ```

3. **Document**
   - Record removal reason
   - Archive original documentation
   - Update audit trail

## Seizure Procedures

### Legal Basis

Valid reasons for seizure:
- Court order
- Law enforcement directive
- Regulatory freeze order
- Counter-terrorism financing (CTF)

### Seizure Workflow

```
1. Receive Legal Order
   ↓
2. Legal Review (24h SLA)
   ↓
3. Compliance Approval
   ↓
4. Execute Seizure
   sss-token seize <FROM> <TO> <AMOUNT>
   ↓
5. Document & Report
   - Record in audit log
   - Notify legal/compliance
   - File regulatory report
```

### Seizure Documentation

```typescript
interface SeizureRecord {
  signature: string;       // Transaction signature
  orderReference: string;  // Court case / LE reference
  from: string;
  to: string;
  amount: string;
  timestamp: Date;
  authorizedBy: string[];  // Multiple approvals for large amounts
  legalReview: {
    reviewer: string;
    approvedAt: Date;
    notes: string;
  };
}
```

## Reporting Requirements

### Suspicious Activity Reports (SARs)

**Trigger Conditions:**
- Transactions just below reporting threshold
- Unusual patterns
- Known criminal association
- Sanctions match

**Filing Timeline:**
- Initial detection: Log immediately
- Investigation: Within 24 hours
- SAR filing: Within 30 days (US)

### Regulatory Reports

| Report | Frequency | Contents |
|--------|-----------|----------|
| **OFAC Compliance** | Daily | Sanctions screening results |
| **Reserve Attestation** | Monthly | 1:1 backing proof |
| **Transaction Volume** | Monthly | Aggregate statistics |
| **Blacklist Report** | Quarterly | Additions/removals |
| **Audit Summary** | Annually | Full compliance audit |

## Incident Response

### Response Levels

| Level | Description | Response Time |
|-------|-------------|---------------|
| 1 - Critical | Active exploit, sanctions emergency | Immediate |
| 2 - High | Suspected fraud, law enforcement request | 1 hour |
| 3 - Medium | Compliance violation, policy breach | 24 hours |
| 4 - Low | Documentation issue, minor discrepancy | 72 hours |

### Critical Incident Response

```typescript
async function criticalIncidentResponse(incident: Incident): Promise<void> {
  // 1. Immediate containment
  if (incident.type === 'SANCTIONS_EMERGENCY') {
    await stablecoin.pause();
    await stablecoin.compliance.addToBlacklist({
      address: incident.address,
      reason: 'Critical incident - emergency freeze',
    });
  }
  
  // 2. Notify team
  await notifyIncidentTeam(incident);
  
  // 3. Document
  await createIncidentRecord(incident);
  
  // 4. Regulatory notification
  if (incident.requiresRegulatoryNotification) {
    await notifyRegulators(incident);
  }
  
  // 5. Post-incident review
  await schedulePostIncidentReview(incident);
}
```

## Best Practices

### 1. Segregation of Duties

No single person should control:
- Both minting and blacklist management
- Both customer onboarding and transaction monitoring
- Both technical operations and compliance reporting

### 2. Regular Training

- Monthly: Regulation updates
- Quarterly: Sanctions list changes
- Annually: Full compliance certification

### 3. Independent Review

- Annual third-party audit
- Quarterly compliance self-assessment
- Continuous automated monitoring

### 4. Documentation

Maintain records for:
- 7 years: Transaction records
- 5 years: KYC documentation
- Permanent: Blacklist decisions

## Resources

### Regulatory

- [OFAC SDN List](https://ofac.treasury.gov)
- [FATF Guidelines](https://www.fatf-gafi.org)
- [FinCEN Guidance](https://www.fincen.gov)

### Tools

- Chainalysis
- Elliptic
- TRM Labs
- ComplyAdvantage

### Contacts

- FinCEN: 1-800-767-2825
- OFAC: 1-800-540-6322
- Local regulatory authority: [varies by jurisdiction]
