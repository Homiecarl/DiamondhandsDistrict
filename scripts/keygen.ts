/**
 * Diamond Hands District — New wallet keygen
 * Generates a fresh Bitcoin + ML-DSA keypair and writes it to .env
 *
 * Usage: npm run keygen
 */

import { Wallet } from '@btc-vision/transaction';
import { MLDSASecurityLevel } from '@btc-vision/bip32';
import { networks } from '@btc-vision/bitcoin';
import { writeFileSync } from 'fs';

const wallet  = Wallet.generate(networks.opnetTestnet, MLDSASecurityLevel.LEVEL2);
const wif     = wallet.keypair.toWIF();
const mldsa   = Buffer.from((wallet.mldsaKeypair as any)._privateKey).toString('hex');
const address = wallet.p2tr;

const env = [
    `DEPLOYER_WIF=${wif}`,
    `DEPLOYER_MLDSA=${mldsa}`,
    `VAULT_ADDRESS=`,
    `MOCK_MOTO_ADDRESS=`,
].join('\n') + '\n';

writeFileSync('.env', env, 'utf8');

console.log('\n── New Wallet Generated ────────────────────────────────────');
console.log(`  Address:  ${address}`);
console.log(`  WIF:      ${wif}`);
console.log(`  MLDSA:    ${mldsa.slice(0, 16)}...${mldsa.slice(-8)} (${mldsa.length / 2} bytes)`);
console.log('');
console.log('  ✓ Written to scripts/.env');
console.log('');
console.log('  Next steps:');
console.log('  1. Fund this address on OPNet testnet (Signet):');
console.log('     https://signetfaucet.com');
console.log(`     → ${address}`);
console.log('  2. Wait for funding TX to confirm (~10 min)');
console.log('  3. npm run deploy:all   — deploys MockMoto + DiamondVault');
console.log('  4. npm run setup        — initializes vault, raffle, yield');
console.log('  5. npm run status       — verify everything is live');
console.log('─────────────────────────────────────────────────────────────\n');
