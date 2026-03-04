/**
 * useStaking — React hook for ProofOfHodl contract interactions.
 *
 * Wallet rules:
 *   - signer: null, mldsaSigner: null in sendTransaction() — wallet handles signing
 *   - No raw PSBT
 *   - Always check sim.revert
 *   - setTransactionDetails BEFORE simulate when adding outputs
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { networks } from '@btc-vision/bitcoin';
import { NETWORK } from '../config/contracts';
import { stakingService, StakeInfo } from '../services/StakingService';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WalletState {
    connected: boolean;
    address: string;
    publicKey: string;
    balance: bigint;
}

export interface StakingState {
    wallet: WalletState;
    stakeInfo: StakeInfo | null;
    pendingRewards: bigint;
    totalStaked: bigint;
    loading: boolean;
    txPending: boolean;
    error: string | null;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useStaking() {
    const [state, setState] = useState<StakingState>({
        wallet: { connected: false, address: '', publicKey: '', balance: 0n },
        stakeInfo: null,
        pendingRewards: 0n,
        totalStaked: 0n,
        loading: false,
        txPending: false,
        error: null,
    });

    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // ── Wallet helpers ──────────────────────────────────────────────────────

    const getOpWallet = () => {
        // OPWallet injects itself as window.opnet or window.unisat (OPNet-flavoured)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const w = window as any;
        return w.opnet ?? w.unisat ?? null;
    };

    // ── Connect wallet ──────────────────────────────────────────────────────

    const connectWallet = useCallback(async () => {
        const opwallet = getOpWallet();
        if (!opwallet) {
            setState((s) => ({
                ...s,
                error: 'OPWallet not found. Install it from the Chrome Web Store.',
            }));
            return;
        }

        try {
            setState((s) => ({ ...s, loading: true, error: null }));

            // Request accounts
            const accounts: string[] = await opwallet.requestAccounts();
            const address = accounts[0];
            const publicKey: string = await opwallet.getPublicKey();
            const balanceInfo = await opwallet.getBalance();
            const balance = BigInt(balanceInfo?.confirmed ?? balanceInfo ?? 0);

            setState((s) => ({
                ...s,
                wallet: { connected: true, address, publicKey, balance },
                loading: false,
            }));

            // Initial data fetch
            await refreshStakeData(address);
        } catch (err) {
            setState((s) => ({
                ...s,
                loading: false,
                error: err instanceof Error ? err.message : 'Wallet connection failed',
            }));
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Refresh stake data ──────────────────────────────────────────────────

    const refreshStakeData = useCallback(async (address: string) => {
        try {
            const [stakeInfo, pendingRewards, totalStaked] = await Promise.all([
                stakingService.readStakeInfo(address),
                stakingService.readPendingRewards(address),
                stakingService.readTotalStaked(),
            ]);

            setState((s) => ({ ...s, stakeInfo, pendingRewards, totalStaked }));
        } catch (err) {
            console.error('refreshStakeData error:', err);
        }
    }, []);

    // ── Polling (every 30s) ─────────────────────────────────────────────────

    useEffect(() => {
        if (state.wallet.connected) {
            pollRef.current = setInterval(() => {
                refreshStakeData(state.wallet.address);
            }, 30_000);
        }
        return () => {
            if (pollRef.current) clearInterval(pollRef.current);
        };
    }, [state.wallet.connected, state.wallet.address, refreshStakeData]);

    // ── Stake ───────────────────────────────────────────────────────────────

    const stake = useCallback(
        async (lockBlocks: bigint, satoshis: bigint, csvAddress: string): Promise<string> => {
            const { address } = state.wallet;
            if (!address) throw new Error('Wallet not connected');

            setState((s) => ({ ...s, txPending: true, error: null }));
            try {
                const contract = stakingService.getProofOfHodlContract();

                // Add CSV P2WSH output BEFORE simulating
                // Use bech32 address string directly (do NOT convert to hex via Address.toHex)
                contract.setTransactionDetails({
                    outputs: [{ to: csvAddress, value: satoshis }],
                });

                // Simulate
                const sim = await contract.stake({ lockBlocks });
                if (sim.revert) throw new Error(`Contract reverted: ${sim.revert}`);

                // Send — wallet handles signing (signer: null, mldsaSigner: null)
                const receipt = await sim.sendTransaction({
                    signer: null,
                    mldsaSigner: null,
                    refundTo: address,
                    maximumAllowedSatToSpend: 500_000n,
                    feeRate: 10,
                    network: NETWORK,
                });

                const txId = receipt.transactionId ?? receipt.txId ?? '';
                await refreshStakeData(address);
                return txId;
            } finally {
                setState((s) => ({ ...s, txPending: false }));
            }
        },
        [state.wallet, refreshStakeData],
    );

    // ── Unstake ─────────────────────────────────────────────────────────────

    const unstake = useCallback(async (): Promise<string> => {
        const { address } = state.wallet;
        if (!address) throw new Error('Wallet not connected');

        setState((s) => ({ ...s, txPending: true, error: null }));
        try {
            const contract = stakingService.getProofOfHodlContract();

            const sim = await contract.unstake();
            if (sim.revert) throw new Error(`Contract reverted: ${sim.revert}`);

            const receipt = await sim.sendTransaction({
                signer: null,
                mldsaSigner: null,
                refundTo: address,
                maximumAllowedSatToSpend: 100_000n,
                feeRate: 10,
                network: NETWORK,
            });

            const txId = receipt.transactionId ?? receipt.txId ?? '';
            await refreshStakeData(address);
            return txId;
        } finally {
            setState((s) => ({ ...s, txPending: false }));
        }
    }, [state.wallet, refreshStakeData]);

    // ── Claim rewards ───────────────────────────────────────────────────────

    const claimRewards = useCallback(async (): Promise<string> => {
        const { address } = state.wallet;
        if (!address) throw new Error('Wallet not connected');

        setState((s) => ({ ...s, txPending: true, error: null }));
        try {
            const contract = stakingService.getProofOfHodlContract();

            const sim = await contract.claimRewards();
            if (sim.revert) throw new Error(`Contract reverted: ${sim.revert}`);

            const receipt = await sim.sendTransaction({
                signer: null,
                mldsaSigner: null,
                refundTo: address,
                maximumAllowedSatToSpend: 100_000n,
                feeRate: 10,
                network: NETWORK,
            });

            const txId = receipt.transactionId ?? receipt.txId ?? '';
            await refreshStakeData(address);
            return txId;
        } finally {
            setState((s) => ({ ...s, txPending: false }));
        }
    }, [state.wallet, refreshStakeData]);

    // ── Generate CSV address ────────────────────────────────────────────────

    const getCSVAddress = useCallback(
        (lockBlocks: bigint): string => {
            const { publicKey } = state.wallet;
            if (!publicKey) return '';

            try {
                // Generate a CSV P2MR (quantum-safe, time-locked) address
                // Use the wallet's publicKey + lockBlocks to derive the address
                // The Address.toCSVP2MR is available on wallet.address in @btc-vision/transaction
                // For the frontend we derive it via the opnet provider or use a fallback
                // NOTE: When using OPWallet, the wallet derives this internally.
                // We display it as informational — the wallet creates the actual output.
                return `p2wsh-csv-locked (${lockBlocks} blocks) — derived by OPWallet`;
            } catch {
                return '';
            }
        },
        [state.wallet],
    );

    return {
        ...state,
        connectWallet,
        stake,
        unstake,
        claimRewards,
        getCSVAddress,
        refreshStakeData: () => refreshStakeData(state.wallet.address),
    };
}
