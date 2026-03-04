/**
 * Diamond Hands District — Full setup script
 * Runs after deploy.ts — performs all owner-only initialization calls:
 *   1. setMotoToken(mockMotoAddress)
 *   2. seedJackpot(initialSeedSats)
 *   3. openRaffle()
 *
 * Usage: npm run setup
 * Requires: DEPLOYER_WIF, DEPLOYER_MLDSA, VAULT_ADDRESS, MOCK_MOTO_ADDRESS in .env
 */

import 'dotenv/config';
import { getContract, JSONRpcProvider } from 'opnet';
import { networks } from '@btc-vision/bitcoin';
import { MLDSASecurityLevel } from '@btc-vision/bip32';
import { Wallet } from '@btc-vision/transaction';
import type { AbstractRpcProvider } from 'opnet';
import { DiamondVaultAbi } from './DiamondVaultAbi.js';

const TESTNET_URL = 'https://testnet.opnet.org';

// ─── Initial jackpot seed: 0.01 BTC in sats ─────────────────────────────────
const INITIAL_SEED_SATS = 1_000_000n;

async function setupVault() {
    const wif = process.env.DEPLOYER_WIF;
    const mldsaHex = process.env.DEPLOYER_MLDSA;
    const vaultAddr = process.env.VAULT_ADDRESS;
    const motoAddr = process.env.MOCK_MOTO_ADDRESS;

    if (!wif) throw new Error('DEPLOYER_WIF not set');
    if (!mldsaHex) throw new Error('DEPLOYER_MLDSA not set');
    if (!vaultAddr) throw new Error('VAULT_ADDRESS not set — deploy vault first');
    if (!motoAddr) throw new Error('MOCK_MOTO_ADDRESS not set — deploy mock moto first');

    console.log('\n── Vault Setup ─────────────────────────────────────');
    console.log(`Vault:     ${vaultAddr}`);
    console.log(`MockMoto:  ${motoAddr}`);

    const provider: AbstractRpcProvider = new JSONRpcProvider({ url: TESTNET_URL, network: networks.opnetTestnet });
    const wallet = Wallet.fromWif(wif, mldsaHex, networks.opnetTestnet, MLDSASecurityLevel.LEVEL2);
    const address = wallet.p2tr;

    // Use the wallet's Address object directly (avoid getPublicKeyInfo which fails for unregistered Taproot)
    const senderAddress = wallet.address;

    const contract = getContract(vaultAddr, DiamondVaultAbi, provider, networks.opnetTestnet, senderAddress) as any;

    const txParams = {
        signer: wallet.keypair,
        mldsaSigner: wallet.mldsaKeypair,
        refundTo: address,
        sender: address,
        maximumAllowedSatToSpend: 500_000n,
        network: networks.opnetTestnet,
        feeRate: 10,
        priorityFee: 5_000n,
        gasSatFee: 10_000n,
    };

    // 1. setMotoToken — tell vault which token is MOTO
    console.log('\n[1/3] Setting MOTO token address...');
    const motoInfo = await provider.getPublicKeyInfo(motoAddr, true);
    if (!motoInfo) throw new Error('Could not resolve MockMoto address info');
    const motoHashedKey = BigInt('0x' + Buffer.from(motoInfo).toString('hex'));
    const setMotoResult = await contract.setMotoToken(motoHashedKey);
    const setMotoReceipt = await setMotoResult.sendTransaction(txParams);
    console.log(`  ✓ setMotoToken TX: ${setMotoReceipt.transactionId}`);

    // Wait a block
    await sleep(15000);

    // 2. seedJackpot — initial prize pool seed
    console.log('\n[2/3] Seeding jackpot...');
    const seedResult = await contract.seedJackpot(INITIAL_SEED_SATS);
    const seedReceipt = await seedResult.sendTransaction({
        ...txParams,
        maximumAllowedSatToSpend: INITIAL_SEED_SATS + 500_000n,
    });
    console.log(`  ✓ seedJackpot TX: ${seedReceipt.transactionId}`);

    await sleep(15000);

    // 3. openRaffle — start first raffle
    console.log('\n[3/3] Opening first raffle...');
    const raffleResult = await contract.openRaffle();
    const raffleReceipt = await raffleResult.sendTransaction(txParams);
    console.log(`  ✓ openRaffle TX: ${raffleReceipt.transactionId}`);

    console.log('\n✓ Vault fully initialized!');
    console.log('────────────────────────────────────────────────────');
}

function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

setupVault().catch(err => {
    console.error('\n✗ Setup failed:', err instanceof Error ? err.message : err);
    process.exit(1);
});
