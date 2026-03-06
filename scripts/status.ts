/**
 * Diamond Hands District — Contract health-check script
 * Reads and prints live contract state without modifying anything.
 *
 * Usage: npm run status
 * Requires: VAULT_ADDRESS, MOCK_MOTO_ADDRESS in .env
 */

import 'dotenv/config';
import { getContract, JSONRpcProvider, ABIDataTypes, BitcoinAbiTypes } from 'opnet';
import { networks } from '@btc-vision/bitcoin';
import type { AbstractRpcProvider } from 'opnet';
import { DiamondVaultAbi } from './DiamondVaultAbi.js';

const TESTNET_URL = 'https://testnet.opnet.org';
const MINS_PER_BLOCK = 10; // OPNet testnet ~10 min blocks

const BalanceOfAbi = [
    {
        name: 'balanceOf',
        inputs: [{ name: 'account', type: ABIDataTypes.ADDRESS }],
        outputs: [{ name: 'balance', type: ABIDataTypes.UINT256 }],
        type: BitcoinAbiTypes.Function,
    },
];

const STATE_NAMES = ['OPEN', 'CLOSED', 'DRAWN'];

function fmtSats(sats: bigint): string {
    const btc = (Number(sats) / 1e8).toFixed(8);
    return `${Number(sats).toLocaleString()} sats (${btc} BTC)`;
}

function fmtMoto(raw: bigint): string {
    return (Number(raw) / 1e18).toFixed(4);
}

function blocksToEta(blocks: bigint): string {
    const b = Number(blocks);
    if (b <= 0) return 'now';
    const totalMins = b * MINS_PER_BLOCK;
    const hours = Math.floor(totalMins / 60);
    const mins = totalMins % 60;
    if (hours >= 24) {
        const days = Math.floor(hours / 24);
        const remH = hours % 24;
        return `~${days}d ${remH}h`;
    }
    if (hours > 0) return `~${hours}h ${mins}m`;
    return `~${mins}m`;
}

async function main() {
    const vaultAddr = process.env.VAULT_ADDRESS;
    const motoAddr = process.env.MOCK_MOTO_ADDRESS;

    if (!vaultAddr) throw new Error('VAULT_ADDRESS not set');
    if (!motoAddr) throw new Error('MOCK_MOTO_ADDRESS not set');

    const provider: AbstractRpcProvider = new JSONRpcProvider({
        url: TESTNET_URL,
        network: networks.opnetTestnet,
    });

    // 1. Current block
    const currentBlock = BigInt((await (provider as any).getBlockNumber()) ?? 0);

    // 2. Protocol stats
    const vault = getContract(vaultAddr, DiamondVaultAbi, provider, networks.opnetTestnet) as any;
    const statsResult = await vault.getProtocolStats();
    const s = statsResult.properties;

    // 3. Raffle info
    const raffleId: bigint = s.currentRaffleId;
    let raffle: any = null;
    if (raffleId > 0n) {
        const raffleResult = await vault.getRaffleInfo(raffleId);
        raffle = raffleResult.properties;
    }

    // 4. Vault MOTO balance
    let vaultMoto = 0n;
    try {
        const rawInfo = await (provider as any).getPublicKeysInfoRaw([vaultAddr]);
        const tweakedPubkey = Buffer.from(rawInfo[vaultAddr].tweakedPubkey, 'hex');
        const motoContract = getContract(
            motoAddr,
            BalanceOfAbi as any,
            provider,
            networks.opnetTestnet,
        ) as any;
        const balResult = await motoContract.balanceOf(tweakedPubkey);
        vaultMoto = balResult?.properties?.balance ?? 0n;
    } catch (e) {
        console.error(
            '  (vault MOTO balance fetch failed:',
            e instanceof Error ? e.message : e,
            ')',
        );
    }

    // 5. Print formatted output
    const SEP = '─'.repeat(61);
    console.log(`\n── DiamondVault Status ─────────────────────────────────────`);
    console.log(`  Block:        #${currentBlock}`);
    console.log(`  Jackpot:      ${fmtSats(s.prizePool)}`);
    console.log(`  Total Staked: ${fmtSats(s.totalStaked)}`);

    if (raffle && raffleId > 0n) {
        const drawBlock: bigint = raffle.drawBlock;
        const remaining = drawBlock > currentBlock ? drawBlock - currentBlock : 0n;
        const stateName = STATE_NAMES[Number(raffle.state)] ?? 'UNKNOWN';
        const drawEta = remaining > 0n ? `, ~${remaining} blocks / ${blocksToEta(remaining)}` : '';
        console.log(
            `  Raffle:       #${raffleId} — ${stateName} (draw at block #${drawBlock}${drawEta})`,
        );
    } else {
        console.log(`  Raffle:       None yet`);
    }

    const motoActive = s.motoPerBlock > 0n;
    console.log(
        `  motoPerBlock: ${s.motoPerBlock} ${motoActive ? '✓ ACTIVE' : '✗ INACTIVE'}`,
    );

    const motoFunded = vaultMoto > 0n;
    console.log(
        `  Vault MOTO:   ${fmtMoto(vaultMoto)} ${motoFunded ? '(claimYield funded ✓)' : '(NOT FUNDED ✗)'}`,
    );
    console.log(SEP);
}

main().catch(err => {
    console.error('✗ Status check failed:', err instanceof Error ? err.message : err);
    process.exit(1);
});
