/**
 * Diamond Hands District — Full setup script
 * Runs after deploy.ts — performs all owner-only initialization calls:
 *   1. setMotoToken(mockMotoAddress)
 *   2. seedJackpot(initialSeedSats)
 *   3. openRaffle()
 *   4. Transfer MOTO tokens to vault (so it can pay yield)
 *   5. addMoto(amount) — activates the yield emission rate
 *
 * Usage: npm run setup
 * Requires: DEPLOYER_WIF, DEPLOYER_MLDSA, VAULT_ADDRESS, MOCK_MOTO_ADDRESS in .env
 */

import 'dotenv/config';
import { getContract, JSONRpcProvider, ABIDataTypes, BitcoinAbiTypes } from 'opnet';
import { networks } from '@btc-vision/bitcoin';
import { MLDSASecurityLevel } from '@btc-vision/bip32';
import { Wallet } from '@btc-vision/transaction';
import type { AbstractRpcProvider } from 'opnet';
import { DiamondVaultAbi } from './DiamondVaultAbi.js';

// Minimal OP20 ABI — only what we need for transfer
const OP20TransferAbi = [
    {
        name: 'transfer',
        inputs: [
            { name: 'to', type: ABIDataTypes.ADDRESS },
            { name: 'amount', type: ABIDataTypes.UINT256 },
        ],
        outputs: [{ name: 'success', type: ABIDataTypes.BOOL }],
        type: BitcoinAbiTypes.Function,
    },
];

const TESTNET_URL = 'https://testnet.opnet.org';

// ─── Initial jackpot seed: 0.01 BTC in sats ─────────────────────────────────
const INITIAL_SEED_SATS = 1_000_000n;

// ─── MOTO yield pool: 1 000 MOTO tokens (18 decimals) ───────────────────────
// Distributed over one raffle period (~4 032 blocks / ~28 days)
const MOTO_YIELD_AMOUNT = 1_000n * 10n ** 18n;

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
    console.log('\n[1/5] Setting MOTO token address...');
    const motoInfo = await provider.getPublicKeyInfo(motoAddr, true);
    if (!motoInfo) throw new Error('Could not resolve MockMoto address info');
    const motoHashedKey = BigInt('0x' + Buffer.from(motoInfo).toString('hex'));
    const setMotoResult = await contract.setMotoToken(motoHashedKey);
    const setMotoReceipt = await setMotoResult.sendTransaction(txParams);
    console.log(`  ✓ setMotoToken TX: ${setMotoReceipt.transactionId}`);

    await waitForConfirmation(provider, setMotoReceipt.transactionId);

    // 2. seedJackpot — initial prize pool seed
    console.log('\n[2/5] Seeding jackpot...');
    const seedResult = await contract.seedJackpot(INITIAL_SEED_SATS);
    const seedReceipt = await seedResult.sendTransaction({
        ...txParams,
        maximumAllowedSatToSpend: INITIAL_SEED_SATS + 500_000n,
    });
    console.log(`  ✓ seedJackpot TX: ${seedReceipt.transactionId}`);

    await waitForConfirmation(provider, seedReceipt.transactionId);

    // 3. openRaffle — start first raffle
    console.log('\n[3/5] Opening first raffle...');
    const raffleResult = await contract.openRaffle();
    const raffleReceipt = await raffleResult.sendTransaction(txParams);
    console.log(`  ✓ openRaffle TX: ${raffleReceipt.transactionId}`);

    await waitForConfirmation(provider, raffleReceipt.transactionId);

    // 4. Transfer MOTO tokens to vault so it can pay out yield
    console.log('\n[4/5] Transferring MOTO to vault...');
    // Resolve vault address to its hashed public key for use as OP20 recipient
    const vaultInfo = await provider.getPublicKeyInfo(vaultAddr, true);
    if (!vaultInfo) throw new Error('Could not resolve vault address info');
    const motoContract = getContract(motoAddr, OP20TransferAbi as any, provider, networks.opnetTestnet, senderAddress) as any;
    const transferResult = await motoContract.transfer(vaultInfo, MOTO_YIELD_AMOUNT);
    const transferReceipt = await transferResult.sendTransaction(txParams);
    console.log(`  ✓ Transfer MOTO TX: ${transferReceipt.transactionId}`);

    await waitForConfirmation(provider, transferReceipt.transactionId);

    // 5. addMoto — register yield pool and set emission rate
    console.log('\n[5/5] Activating yield emission (addMoto)...');
    const addMotoResult = await contract.addMoto(MOTO_YIELD_AMOUNT);
    const addMotoReceipt = await addMotoResult.sendTransaction(txParams);
    console.log(`  ✓ addMoto TX: ${addMotoReceipt.transactionId}`);
    console.log(`  Emission: ${MOTO_YIELD_AMOUNT.toString()} raw MOTO over ~4032 blocks`);

    console.log('\n✓ Vault fully initialized!');
    console.log('────────────────────────────────────────────────────');
}

async function waitForConfirmation(provider: AbstractRpcProvider, txId: string): Promise<void> {
    console.log(`  Waiting for block confirmation (OPNet testnet ~10 min/block)...`);
    const start = Date.now();
    const TIMEOUT = 30 * 60 * 1000; // 30 min
    while (Date.now() - start < TIMEOUT) {
        await sleep(10_000);
        try {
            const receipt = await (provider as any).getTransactionReceipt(txId);
            if (receipt) {
                process.stdout.write('\n');
                console.log(`  ✓ Confirmed in block #${receipt.blockNumber ?? receipt.blockHeight ?? '?'}`);
                return;
            }
        } catch { /* keep waiting */ }
        const elapsed = Math.round((Date.now() - start) / 1000);
        process.stdout.write(`\r  Still waiting... ${elapsed}s elapsed`);
    }
    process.stdout.write('\n');
    throw new Error(`TX ${txId} not confirmed after 30 minutes`);
}

function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

setupVault().catch(err => {
    console.error('\n✗ Setup failed:', err instanceof Error ? err.message : err);
    process.exit(1);
});
