import { useState, useEffect, useCallback } from 'react';
import { useWalletConnect } from '@btc-vision/walletconnect';
import { fetchRaffleInfo, type RaffleInfo } from '../services/ContractService';
import { VAULT_ADDRESS } from '../config/contracts';

const EMPTY_RAFFLE: RaffleInfo = {
    startBlock: 0n,
    entryCloseBlock: 0n,
    drawBlock: 0n,
    state: 0,
    participantCount: 0n,
    totalTickets: 0n,
};

export function useRaffle(raffleId: bigint) {
    const { provider } = useWalletConnect();
    const [raffle, setRaffle] = useState<RaffleInfo>(EMPTY_RAFFLE);
    const [loading, setLoading] = useState(false);

    const refresh = useCallback(async () => {
        if (!VAULT_ADDRESS || raffleId === 0n) return;
        setLoading(true);
        try {
            const info = await fetchRaffleInfo(raffleId, provider);
            setRaffle(info);
        } catch {
            // silently fail for raffle fetch
        } finally {
            setLoading(false);
        }
    }, [raffleId, provider]);

    useEffect(() => {
        refresh();
        const interval = setInterval(refresh, 30_000);
        return () => clearInterval(interval);
    }, [refresh]);

    return { raffle, loading, refresh };
}
