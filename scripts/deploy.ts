/**
 * Diamond Hands District — Contract Deployment Script
 * Usage:
 *   npm run deploy:vault   — deploy DiamondVault
 *   npm run deploy:mock    — deploy MockMoto token
 *   npm run deploy:all     — deploy both
 *
 * Prerequisites:
 *   1. Copy .env.example to .env and fill in DEPLOYER_WIF + DEPLOYER_MLDSA
 *   2. Run: npm run build in ../contracts
 *   3. Ensure testnet BTC balance in deployer wallet
 */

import 'dotenv/config';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { JSONRpcProvider } from 'opnet';
import { networks } from '@btc-vision/bitcoin';
import { MLDSASecurityLevel } from '@btc-vision/bip32';
import { Wallet, TransactionFactory } from '@btc-vision/transaction';

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
    const mldsaHex = process.env.DEPLOYER_MLDSA;
    if (!wif) throw new Error('DEPLOYER_WIF not set in .env');
    if (!mldsaHex) throw new Error('DEPLOYER_MLDSA not set in .env');

    console.log(`\n──────────────────────────────────────`);
    console.log(`Deploying: ${name}`);
    console.log(`Network:   OPNet Testnet`);

    const provider = new JSONRpcProvider({ url: TESTNET_URL, network: networks.opnetTestnet });
    const wallet = Wallet.fromWif(wif, mldsaHex, networks.opnetTestnet, MLDSASecurityLevel.LEVEL2);
    const address = wallet.p2tr;
    console.log(`Deployer:  ${address}`);

    // Fetch UTXOs
    console.log('Fetching UTXOs...');
    const utxos = await provider.utxoManager.getUTXOs({
        address,
        filterSpentUTXOs: true,
        mergePendingUTXOs: true,
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
        signer: wallet.keypair,
        mldsaSigner: wallet.mldsaKeypair,
        bytecode,
        utxos,
        feeRate: 10,
        priorityFee: 5_000n,
        gasSatFee: 10_000n,
        challenge,
        network: networks.opnetTestnet,
        revealMLDSAPublicKey: true,
        linkMLDSAPublicKeyToAddress: true,
    });

    console.log(`Contract address: ${result.contractAddress}`);

    // Broadcast both funding + reveal transactions
    const [fundingTx, revealTx] = result.transaction;
    console.log('Broadcasting funding transaction...');
    const fundingRes = await provider.sendRawTransaction(fundingTx, false) as any;
    console.log(`Funding TX: ${fundingRes.result ?? fundingRes}`);

    console.log('Broadcasting deployment transaction...');
    const deployRes = await provider.sendRawTransaction(revealTx, false) as any;
    console.log(`Deploy TX:  ${deployRes.result ?? deployRes}`);

    console.log(`\n✓ ${name} deployed!`);
    console.log(`  Contract: ${result.contractAddress}`);
    console.log(`──────────────────────────────────────`);

    return result.contractAddress;
}

// ─── CLI entry ────────────────────────────────────────────────────────────────

const target = process.argv[2] ?? 'vault';

(async () => {
    try {
        if (target === 'vault' || target === 'all') {
            const vaultAddr = await deployContract('DiamondVault', 'DiamondVault.wasm');
            console.log(`\nAdd to .env: VAULT_ADDRESS=${vaultAddr}`);
        }
        if (target === 'mock' || target === 'all') {
            const mockAddr = await deployContract('MockMoto', 'MockMoto.wasm');
            console.log(`\nAdd to .env: MOCK_MOTO_ADDRESS=${mockAddr}`);
        }
    } catch (err) {
        console.error('\n✗ Deployment failed:', err instanceof Error ? err.message : err);
        process.exit(1);
    }
})();
