/**
 * Diamond Hands District — Contract Deployment Script
 * Usage:
 *   npm run deploy:vault   — deploy DiamondVault
 *   npm run deploy:mock    — deploy MockMoto token
 *   npm run deploy:all     — deploy both
 *
 * Prerequisites:
 *   1. Copy .env.example to .env and fill in DEPLOYER_WIF
 *   2. Run: npm run build in ../contracts
 *   3. Ensure testnet BTC balance in deployer wallet
 */

import 'dotenv/config';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { JSONRpcProvider } from 'opnet';
import { networks } from '@btc-vision/bitcoin';
import { EcKeyPair, TransactionFactory } from '@btc-vision/transaction';

const __dir = dirname(fileURLToPath(import.meta.url));
const BUILD_DIR = join(__dir, '..', 'contracts', 'build');
const TESTNET_URL = 'https://testnet.opnet.org';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function loadWasm(filename: string): Uint8Array {
    const path = join(BUILD_DIR, filename);
    console.log(`Loading bytecode: ${path}`);
    return new Uint8Array(readFileSync(path));
}

async function deployContract(
    name: string,
    wasmFile: string,
): Promise<string> {
    const wif = process.env.DEPLOYER_WIF;
    if (!wif) throw new Error('DEPLOYER_WIF not set in .env');

    console.log(`\n──────────────────────────────────────`);
    console.log(`Deploying: ${name}`);
    console.log(`Network:   OPNet Testnet`);

    const provider = new JSONRpcProvider(TESTNET_URL, networks.opnetTestnet);
    const keypair = EcKeyPair.fromWIF(wif, networks.opnetTestnet);

    // Get deployer address
    const address = EcKeyPair.getP2WPKHAddress(keypair, networks.opnetTestnet);
    console.log(`Deployer:  ${address}`);

    // Fetch UTXOs
    console.log('Fetching UTXOs...');
    const utxos = await provider.utxoManager.getUTXOs({
        address,
        filterSpentUTXOs: true,
        mergePendingUTXOs: false,
        optimize: true,
    });

    if (!utxos?.length) {
        throw new Error(`No UTXOs found for ${address}. Fund your testnet wallet first.`);
    }
    console.log(`Found ${utxos.length} UTXO(s)`);

    // Get PoW challenge
    console.log('Fetching challenge...');
    const challenge = await provider.getChallenge();

    // Load bytecode
    const bytecode = loadWasm(wasmFile);
    console.log(`Bytecode size: ${bytecode.length} bytes`);

    // Build deployment params
    const factory = new TransactionFactory();
    const result = await factory.signDeployment({
        signer: keypair,
        bytecode,
        utxos,
        feeRate: 10,
        priorityFee: 5_000n,
        gasSatFee: 10_000n,
        challenge,
        network: networks.opnetTestnet,
    });

    console.log(`Contract address: ${result.contractAddress}`);

    // Broadcast both funding + reveal transactions
    const [fundingTx, revealTx] = result.transaction;
    console.log('Broadcasting funding transaction...');
    const fundingBroadcast = await provider.sendRawTransaction(fundingTx, false);
    console.log(`Funding TX: ${fundingBroadcast.transactionId}`);

    console.log('Broadcasting deployment transaction...');
    const deployBroadcast = await provider.sendRawTransaction(revealTx, false);
    console.log(`Deploy TX:  ${deployBroadcast.transactionId}`);

    console.log(`\n✓ ${name} deployed!`);
    console.log(`  Contract: ${result.contractAddress}`);
    console.log(`  Update frontend/src/config/contracts.ts → VAULT_ADDRESS`);
    console.log(`──────────────────────────────────────`);

    return result.contractAddress;
}

// ─── CLI entry ────────────────────────────────────────────────────────────────

const target = process.argv[2] ?? 'vault';

(async () => {
    try {
        if (target === 'vault' || target === 'all') {
            await deployContract('DiamondVault', 'DiamondVault.wasm');
        }
        if (target === 'mock' || target === 'all') {
            await deployContract('MockMoto', 'MockMoto.wasm');
        }
    } catch (err) {
        console.error('\n✗ Deployment failed:', err instanceof Error ? err.message : err);
        process.exit(1);
    }
})();
