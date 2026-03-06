/**
 * Activate MOTO yield emission on the vault.
 * Step 1: addMoto — sets motoPerBlock so yield starts accumulating.
 * Step 2: Transfer MOTO tokens to vault separately (see transfer-moto.ts).
 */
import 'dotenv/config';
import { getContract, JSONRpcProvider } from 'opnet';
import { networks } from '@btc-vision/bitcoin';
import { MLDSASecurityLevel } from '@btc-vision/bip32';
import { Wallet } from '@btc-vision/transaction';
import type { AbstractRpcProvider } from 'opnet';
import { DiamondVaultAbi } from './DiamondVaultAbi.js';

const TESTNET_URL = 'https://testnet.opnet.org';

// 1 000 MOTO (18 decimals)
const MOTO_YIELD_AMOUNT = 1_000n * 10n ** 18n;

async function run() {
    const wif      = process.env.DEPLOYER_WIF;
    const mldsaHex = process.env.DEPLOYER_MLDSA;
    const vaultAddr = process.env.VAULT_ADDRESS;

    if (!wif || !mldsaHex || !vaultAddr)
        throw new Error('Missing env vars — check .env');

    const provider: AbstractRpcProvider = new JSONRpcProvider({ url: TESTNET_URL, network: networks.opnetTestnet });
    const wallet = Wallet.fromWif(wif, mldsaHex, networks.opnetTestnet, MLDSASecurityLevel.LEVEL2);
    const address       = wallet.p2tr;
    const senderAddress = wallet.address;

    console.log(`\nVault:    ${vaultAddr}`);
    console.log(`Deployer: ${address}`);

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

    // addMoto — set motoPerBlock so yield starts accumulating in contract state
    console.log('\n[1/1] Calling addMoto to activate yield emission...');
    const vault = getContract(vaultAddr, DiamondVaultAbi, provider, networks.opnetTestnet, senderAddress) as any;
    const addMotoResult  = await vault.addMoto(MOTO_YIELD_AMOUNT);
    const addMotoReceipt = await addMotoResult.sendTransaction(txParams);
    console.log(`  ✓ addMoto TX: ${addMotoReceipt.transactionId}`);
    console.log(`\n✓ Yield emission active — motoPerBlock now set.`);
    console.log(`  Next: run transfer-moto.ts to fund the vault's MOTO balance.`);
}

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

run().catch(e => { console.error('✗', e instanceof Error ? e.message : e); process.exit(1); });
