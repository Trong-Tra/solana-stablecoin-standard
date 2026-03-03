// Simple test script using the SDK
const { Connection, Keypair, PublicKey } = require('@solana/web3.js');
const fs = require('fs');

// Load IDL
const idl = JSON.parse(fs.readFileSync('./sdk/src/idl/sss_token.json', 'utf-8'));

console.log('=== SSS Token Local Test ===\n');
console.log('Program ID:', idl.address);
console.log('Instructions:', idl.instructions.map(i => i.name).join(', '));
console.log('Accounts:', idl.accounts.map(a => a.name).join(', '));
console.log('\n✅ IDL loaded successfully!');
console.log('\nTo test with the SDK:');
console.log('  1. Start validator: solana-test-validator --reset');
console.log('  2. Run SDK tests: npm test');
console.log('  3. Use CLI: npm run cli -- status');
