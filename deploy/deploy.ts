/**
 * Deploy ProofOfHodl to OPNet testnet.
 *
 * Usage:
 *   DEPLOYER_WIF=<wif> npx ts-node --esm deploy.ts
 *
 * After deploy, paste the printed contract address into:
 *   frontend/src/config/contracts.ts
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

import { networks } from '@btc-vision/bitcoin';
import { JSONRpcProvider, Wallet } from 'opnet';
import { TransactionFactory } from '@btc-vision/transaction';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ─── Config ────────────────────────────────────────────────────────────────

const NETWORK = networks.opnetTestnet;
const RPC_URL = 'https://testnet.opnet.org';
const GAS_SAT_FEE = 10_000n; // minimum for deployments

// ─── Main ──────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
    const wif = process.env.DEPLOYER_WIF;
    if (!wif) {
        console.error('Error: DEPLOYER_WIF environment variable is required.');
        console.error('  export DEPLOYER_WIF=<your-WIF-key>');
        process.exit(1);
    }

    // Load WASM bytecode
    const wasmPath = resolve(__dirname, '../contract/build/ProofOfHodl.wasm');
    let bytecode: Buffer;
    try {
        bytecode = readFileSync(wasmPath);
        console.log(`Loaded WASM: ${bytecode.length} bytes from ${wasmPath}`);
    } catch (err) {
        console.error(`Failed to load WASM from ${wasmPath}`);
        console.error('Run `cd contract && npm run build` first.');
        process.exit(1);
    }

    // Set up provider and wallet
    const provider = new JSONRpcProvider({ url: RPC_URL, network: NETWORK });
    const wallet = Wallet.fromWif(wif, NETWORK);

    console.log(`Deployer address: ${wallet.p2tr}`);
    console.log(`Network: ${RPC_URL}`);

    // Check balance
    const balance = await provider.getBalance(wallet.p2tr);
    console.log(`Balance: ${balance.toString()} sats`);

    if (balance < GAS_SAT_FEE) {
        console.error('Insufficient balance for deployment. Get testnet BTC from a faucet.');
        process.exit(1);
    }

    // Build deployment transaction
    const factory = new TransactionFactory();

    console.log('Building deployment transaction…');
    const deployTx = await factory.signDeployment({
        signer: wallet.keypair,
        mldsaSigner: wallet.mldsaKeypair,
        from: wallet.p2tr,
        bytecode: new Uint8Array(bytecode),
        gasSatFee: GAS_SAT_FEE,
        network: NETWORK,
        priorityFee: 10n,
    });

    console.log('Broadcasting…');
    const receipt = await provider.sendRawTransaction(deployTx.transaction[0], false);
    console.log(`Commit tx: ${receipt.result}`);

    if (deployTx.transaction[1]) {
        const receipt2 = await provider.sendRawTransaction(deployTx.transaction[1], false);
        console.log(`Reveal tx: ${receipt2.result}`);
        console.log(`\n✅ Contract address: ${deployTx.contractAddress}`);
        console.log('\nNext step: paste address into frontend/src/config/contracts.ts');
    }
}

main().catch((err) => {
    console.error('Deployment failed:', err);
    process.exit(1);
});
