# API Reference

## Base URL

```
http://localhost:3000/api
```

## Authentication

API endpoints require Bearer token authentication:

```bash
curl http://localhost:3000/api/mint-burn/mint \
  -H "Authorization: Bearer YOUR_API_TOKEN"
```

## Endpoints

### Health Check

```http
GET /health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "cluster": "devnet",
  "services": {
    "mintBurn": true,
    "indexer": true,
    "compliance": true,
    "webhook": true
  }
}
```

### Mint/Burn Service

#### Create Mint Request

```http
POST /mint-burn/mint
Content-Type: application/json

{
  "recipient": "7nxzn...",
  "amount": 1000000000,
  "requester": "operator@example.com"
}
```

Response:
```json
{
  "id": "req_1234567890_abc123",
  "recipient": "7nxzn...",
  "amount": 1000000000,
  "status": "pending",
  "requester": "operator@example.com",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

#### Verify Mint Request

```http
POST /mint-burn/mint/:id/verify
```

Response:
```json
{
  "id": "req_1234567890_abc123",
  "status": "verified",
  ...
}
```

#### Get Mint Request

```http
GET /mint-burn/mint/:id
```

#### List Mint Requests

```http
GET /mint-burn/mint?status=pending
```

Query parameters:
- `status`: Filter by status (pending, verified, executed, failed)

#### Create Burn Request

```http
POST /mint-burn/burn
Content-Type: application/json

{
  "amount": 500000000,
  "from": "7nxzn...",
  "requester": "operator@example.com"
}
```

### Event Indexer

#### Watch Mint

```http
POST /events/watch
Content-Type: application/json

{
  "mint": "SSSs1..."
}
```

#### Unwatch Mint

```http
DELETE /events/watch/:mint
```

#### Get Events

```http
GET /events?mint=SSSs1...&type=mint
```

Query parameters:
- `mint`: Filter by mint address
- `type`: Filter by event type (mint, burn, transfer, freeze, thaw, blacklist, seize)

Response:
```json
[
  {
    "signature": "5UfXm...",
    "slot": 123456789,
    "timestamp": "2024-01-15T10:30:00.000Z",
    "mint": "SSSs1...",
    "type": "mint",
    "to": "7nxzn...",
    "amount": "1000000000",
    "authority": "9QqRz..."
  }
]
```

#### Get Event by Signature

```http
GET /events/:signature
```

### Compliance Service

#### Check Sanctions

```http
GET /compliance/sanctions/:address
```

Response:
```json
{
  "address": "7nxzn...",
  "isSanctioned": false,
  "sources": [],
  "checkedAt": "2024-01-15T10:30:00.000Z"
}
```

#### Add to Blacklist

```http
POST /compliance/blacklist
Content-Type: application/json

{
  "address": "7nxzn...",
  "mint": "SSSs1...",
  "reason": "OFAC match",
  "addedBy": "compliance@example.com"
}
```

Response:
```json
{
  "address": "7nxzn...",
  "mint": "SSSs1...",
  "reason": "OFAC match",
  "addedBy": "compliance@example.com",
  "addedAt": "2024-01-15T10:30:00.000Z",
  "isActive": true
}
```

#### Remove from Blacklist

```http
DELETE /compliance/blacklist/:mint/:address
Content-Type: application/json

{
  "removedBy": "compliance@example.com"
}
```

#### Check Blacklist

```http
GET /compliance/blacklist/:mint/:address
```

Response:
```json
{
  "address": "7nxzn...",
  "mint": "SSSs1...",
  "isBlacklisted": true,
  "entry": {
    "address": "7nxzn...",
    "mint": "SSSs1...",
    "reason": "OFAC match",
    "addedBy": "compliance@example.com",
    "addedAt": "2024-01-15T10:30:00.000Z",
    "isActive": true
  }
}
```

#### Get Blacklist

```http
GET /compliance/blacklist?mint=SSSs1...&active=true
```

Query parameters:
- `mint`: Filter by mint address
- `active`: Filter by active status (default: true)

#### Export Audit Log

```http
GET /compliance/audit?startDate=2024-01-01&endDate=2024-12-31&action=BLACKLIST_ADD
```

Query parameters:
- `startDate`: Start date (ISO 8601)
- `endDate`: End date (ISO 8601)
- `action`: Filter by action type

Response:
```json
[
  {
    "id": "audit_1234567890_abc123",
    "timestamp": "2024-01-15T10:30:00.000Z",
    "action": "BLACKLIST_ADD",
    "actor": "compliance@example.com",
    "target": "7nxzn...",
    "mint": "SSSs1...",
    "details": {
      "reason": "OFAC match"
    }
  }
]
```

### Webhook Service

#### Register Webhook

```http
POST /webhooks
Content-Type: application/json

{
  "url": "https://your-app.com/webhook",
  "events": ["mint", "burn", "blacklist"],
  "secret": "your-webhook-secret",
  "retryCount": 3,
  "retryDelayMs": 1000
}
```

Response:
```json
{
  "id": "wh_1234567890_abc123",
  "url": "https://your-app.com/webhook",
  "events": ["mint", "burn", "blacklist"],
  "active": true,
  "retryCount": 3,
  "retryDelayMs": 1000
}
```

#### List Webhooks

```http
GET /webhooks?active=true
```

#### Get Webhook

```http
GET /webhooks/:id
```

#### Update Webhook

```http
PATCH /webhooks/:id
Content-Type: application/json

{
  "active": false,
  "events": ["mint", "burn"]
}
```

#### Delete Webhook

```http
DELETE /webhooks/:id
```

#### Get Deliveries

```http
GET /webhooks/:id/deliveries?status=delivered
```

#### Get Delivery

```http
GET /webhooks/:id/deliveries/:deliveryId
```

## Webhook Payloads

### Mint Event

```json
{
  "event": "mint",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "data": {
    "signature": "5UfXm...",
    "mint": "SSSs1...",
    "recipient": "7nxzn...",
    "amount": "1000000000",
    "authority": "9QqRz..."
  }
}
```

### Blacklist Event

```json
{
  "event": "blacklist",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "data": {
    "signature": "5UfXm...",
    "mint": "SSSs1...",
    "address": "7nxzn...",
    "action": "add",
    "reason": "OFAC match",
    "authority": "9QqRz..."
  }
}
```

### Seizure Event

```json
{
  "event": "seizure",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "data": {
    "signature": "5UfXm...",
    "mint": "SSSs1...",
    "from": "7nxzn...",
    "to": "9QqRz...",
    "amount": "500000000",
    "authority": "9QqRz..."
  }
}
```

## Webhook Verification

Webhooks include a signature header for verification:

```
X-Signature: sha256=<hmac-sha256-signature>
```

Verify using your webhook secret:

```typescript
import crypto from 'crypto';

function verifyWebhook(payload: string, signature: string, secret: string): boolean {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  return signature === `sha256=${expected}`;
}
```

## Error Responses

All errors follow this format:

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {}
}
```

### HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 404 | Not Found |
| 500 | Internal Server Error |

## Rate Limiting

API requests are limited to:
- 100 requests per minute per IP
- 1000 requests per hour per API key

Headers included in responses:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642245600
```

## Pagination

List endpoints support cursor-based pagination:

```http
GET /events?limit=20&cursor=eyJpZCI6MTIzfQ
```

Response includes pagination info:

```json
{
  "data": [...],
  "pagination": {
    "hasMore": true,
    "nextCursor": "eyJpZCI6NDU2fQ"
  }
}
```
