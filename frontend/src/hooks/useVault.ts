import { useState, useEffect, useCallback } from 'react';
import { useWalletConnect } from '@btc-vision/walletconnect';
import {
    fetchProtocolStats,
    fetchUserPosition,
    fetchCurrentBlock,
    fetchVaultMotoBalance,
    txDeposit,
    txWithdraw,
    txClaimYield,
    type ProtocolStats,
    type UserPosition,
} from '../services/ContractService';
import { VAULT_ADDRESS } from '../config/contracts';

const EMPTY_STATS: ProtocolStats = {
    totalStaked: 0n,
    prizePool: 0n,
    nftTreasury: 0n,
    currentRaffleId: 0n,
    motoPerBlock: 0n,
    boostActive: false,
    milestoneIdx: 0,
};

const EMPTY_POSITION: UserPosition = {
    stake: 0n,
    pendingMoto: 0n,
    raffleId: 0n,
    tickets: 0n,
    entryBlock: 0n,
};

export function useVault() {
    const { provider, address, walletAddress } = useWalletConnect();

    const [stats, setStats] = useState<ProtocolStats>(EMPTY_STATS);
    const [position, setPosition] = useState<UserPosition>(EMPTY_POSITION);
    const [currentBlock, setCurrentBlock] = useState(0n);
    const [vaultMotoBalance, setVaultMotoBalance] = useState(0n);
    const [loading, setLoading] = useState(false);
    const [txPending, setTxPending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lastTxId, setLastTxId] = useState<string | null>(null);

    const deployed = !!VAULT_ADDRESS;

    const refresh = useCallback(async () => {
        if (!deployed) return;
        setLoading(true);
        setError(null);
        try {
            const [s, block, motoBalance] = await Promise.all([
                fetchProtocolStats(provider),
                fetchCurrentBlock(provider),
                fetchVaultMotoBalance(provider),
            ]);
            setStats(s);
            setCurrentBlock(block);
            setVaultMotoBalance(motoBalance);
            if (address) {
                const pos = await fetchUserPosition(address, provider);
                setPosition(pos);
            }
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : String(e);
            if (msg !== 'CONTRACT_NOT_DEPLOYED') setError(msg);
        } finally {
            setLoading(false);
        }
    }, [deployed, provider, address]);

    useEffect(() => {
        refresh();
        const interval = setInterval(refresh, 30_000);
        return () => clearInterval(interval);
    }, [refresh]);

    async function deposit(amountSats: bigint) {
        if (!provider || !address || !walletAddress) throw new Error('Wallet not connected');
        setTxPending(true);
        setError(null);
        try {
            const txId = await txDeposit(amountSats, { walletAddress }, provider, address);
            setLastTxId(txId);
            setTimeout(refresh, 3000);
            return txId;
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : String(e);
            setError(msg);
            throw e;
        } finally {
            setTxPending(false);
        }
    }

    async function withdraw(amountSats: bigint) {
        if (!provider || !address || !walletAddress) throw new Error('Wallet not connected');
        setTxPending(true);
        setError(null);
        try {
            const txId = await txWithdraw(amountSats, { walletAddress }, provider, address);
            setLastTxId(txId);
            setTimeout(refresh, 3000);
            return txId;
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : String(e);
            setError(msg);
            throw e;
        } finally {
            setTxPending(false);
        }
    }

    async function claimYield() {
        if (!provider || !address || !walletAddress) throw new Error('Wallet not connected');
        setTxPending(true);
        setError(null);
        try {
            const txId = await txClaimYield({ walletAddress }, provider, address);
            setLastTxId(txId);
            setTimeout(refresh, 3000);
            return txId;
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : String(e);
            setError(msg);
            throw e;
        } finally {
            setTxPending(false);
        }
    }

    return {
        stats,
        position,
        currentBlock,
        vaultMotoBalance,
        loading,
        txPending,
        error,
        lastTxId,
        deployed,
        refresh,
        deposit,
        withdraw,
        claimYield,
    };
}
