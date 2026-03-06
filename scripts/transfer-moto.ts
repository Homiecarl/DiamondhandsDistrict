/**
 * Transfer MOTO tokens from the deployer's wallet to the vault contract.
 * Uses getPublicKeysInfoRaw to get the vault's tweaked X-only pubkey (32 bytes).
 *
 * Run this after addmoto.ts — it funds the vault so claimYield payouts work.
 */
import 'dotenv/config';
import { getContract, JSONRpcProvider, OP_20_ABI } from 'opnet';
import { networks } from '@btc-vision/bitcoin';
import { MLDSASecurityLevel } from '@btc-vision/bip32';
import { Wallet } from '@btc-vision/transaction';
import type { AbstractRpcProvider } from 'opnet';

const TESTNET_URL = 'https://testnet.opnet.org';

// 1 000 MOTO (18 decimals)
const MOTO_AMOUNT = 1_000n * 10n ** 18n;

async function run() {
    const wif       = process.env.DEPLOYER_WIF;
    const mldsaHex  = process.env.DEPLOYER_MLDSA;
    const vaultAddr = process.env.VAULT_ADDRESS;
    const motoAddr  = process.env.MOCK_MOTO_ADDRESS;

    if (!wif || !mldsaHex || !vaultAddr || !motoAddr)
        throw new Error('Missing env vars — check .env');

    const provider: AbstractRpcProvider = new JSONRpcProvider({ url: TESTNET_URL, network: networks.opnetTestnet });
    const wallet = Wallet.fromWif(wif, mldsaHex, networks.opnetTestnet, MLDSASecurityLevel.LEVEL2);
    const address       = wallet.p2tr;
    const senderAddress = wallet.address;

    console.log(`\nVault:    ${vaultAddr}`);
    console.log(`MockMoto: ${motoAddr}`);
    console.log(`Deployer: ${address}`);

    // Get vault's tweaked X-only pubkey (32 bytes) — works for contract addresses
    console.log('\nResolving vault tweaked pubkey...');
    const rawInfo = await (provider as any).getPublicKeysInfoRaw([vaultAddr]);
    const vaultInfo = rawInfo[vaultAddr];
    if (!vaultInfo?.tweakedPubkey) throw new Error('Could not resolve vault tweaked pubkey');
    const vaultPubkey = Buffer.from(vaultInfo.tweakedPubkey, 'hex');
    console.log(`Vault tweakedPubkey: ${vaultInfo.tweakedPubkey} (${vaultPubkey.length} bytes)`);

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

    console.log(`\nTransferring ${MOTO_AMOUNT.toString()} raw MOTO to vault...`);
    // Use the official OP_20_ABI from opnet — correct selector + no return value for transfer
    const motoContract = getContract(motoAddr, OP_20_ABI, provider, networks.opnetTestnet, senderAddress) as any;
    const transferResult  = await motoContract.transfer(vaultPubkey, MOTO_AMOUNT);
    const transferReceipt = await transferResult.sendTransaction(txParams);
    console.log(`  ✓ Transfer TX: ${transferReceipt.transactionId}`);
    console.log('\n✓ Vault funded! claimYield payouts will now work.');
}

run().catch(e => { console.error('✗', e instanceof Error ? e.message : e); process.exit(1); });
