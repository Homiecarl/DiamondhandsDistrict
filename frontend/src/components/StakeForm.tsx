import React, { useState, useMemo } from 'react';
import { StakingTier } from '../config/contracts';

interface StakeFormProps {
    selectedTier: StakingTier | null;
    csvAddress: string;
    onStake: (lockBlocks: bigint, satoshis: bigint, csvAddress: string) => Promise<string>;
    txPending: boolean;
    walletConnected: boolean;
}

const REWARD_RATE = 1 / 100_000_000; // 1 HODL per 100M sat-blocks at 1×

function estimateRewards(sats: number, lockBlocks: number, maxMultX1000: number): number {
    if (!sats || !lockBlocks) return 0;
    const multiplier = maxMultX1000 / 1000;
    const avgMult = 1 + (multiplier - 1) / 2; // linear growth average
    return sats * lockBlocks * avgMult * REWARD_RATE;
}

function getMaxMultX1000(lockBlocks: bigint): number {
    if (lockBlocks === 1_008n) return 2_000;
    if (lockBlocks === 2_016n) return 2_500;
    if (lockBlocks === 4_320n) return 3_000;
    if (lockBlocks === 8_640n) return 4_000;
    return 1_000;
}

export const StakeForm: React.FC<StakeFormProps> = ({
    selectedTier,
    csvAddress,
    onStake,
    txPending,
    walletConnected,
}) => {
    const [satsInput, setSatsInput] = useState('');
    const [txId, setTxId] = useState('');
    const [error, setError] = useState('');

    const sats = useMemo(() => {
        const v = parseFloat(satsInput);
        return isNaN(v) || v <= 0 ? 0 : Math.floor(v);
    }, [satsInput]);

    const btcDisplay = useMemo(() => {
        if (!sats) return '0.00000000';
        return (sats / 1e8).toFixed(8);
    }, [sats]);

    const estimatedReward = useMemo(() => {
        if (!selectedTier || !sats) return 0;
        return estimateRewards(
            sats,
            Number(selectedTier.lockBlocks),
            getMaxMultX1000(selectedTier.lockBlocks),
        );
    }, [selectedTier, sats]);

    const handleStake = async () => {
        if (!selectedTier) {
            setError('Please select a lock duration first.');
            return;
        }
        if (sats < 1000) {
            setError('Minimum stake is 1,000 sats.');
            return;
        }
        setError('');
        setTxId('');

        try {
            const id = await onStake(selectedTier.lockBlocks, BigInt(sats), csvAddress);
            setTxId(id);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Transaction failed');
        }
    };

    const canStake = walletConnected && !!selectedTier && sats >= 1000 && !txPending;

    return (
        <div className="card" style={{ marginTop: '24px' }}>
            <h3
                style={{
                    fontSize: '13px',
                    color: '#666',
                    letterSpacing: '0.15em',
                    marginBottom: '20px',
                }}
            >
                STAKE AMOUNT
            </h3>

            {/* Amount input */}
            <div style={{ marginBottom: '20px' }}>
                <label
                    style={{
                        display: 'block',
                        fontSize: '12px',
                        color: '#888',
                        marginBottom: '8px',
                    }}
                >
                    AMOUNT (SATOSHIS)
                </label>
                <div style={{ position: 'relative' }}>
                    <input
                        type="number"
                        value={satsInput}
                        onChange={(e) => setSatsInput(e.target.value)}
                        placeholder="e.g. 100000  (= 0.001 BTC)"
                        min="1000"
                        step="1000"
                        disabled={txPending}
                    />
                    {sats > 0 && (
                        <div
                            style={{
                                position: 'absolute',
                                right: '14px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                fontSize: '13px',
                                color: '#f7931a',
                                pointerEvents: 'none',
                            }}
                        >
                            ₿ {btcDisplay}
                        </div>
                    )}
                </div>
            </div>

            {/* Selected tier summary */}
            {selectedTier && (
                <div
                    style={{
                        background: 'rgba(247,147,26,0.05)',
                        border: '1px solid rgba(247,147,26,0.15)',
                        borderRadius: '8px',
                        padding: '14px',
                        marginBottom: '16px',
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '10px',
                        fontSize: '13px',
                    }}
                >
                    <div>
                        <div style={{ color: '#666', fontSize: '11px', marginBottom: '3px' }}>
                            LOCK DURATION
                        </div>
                        <div style={{ color: '#f7931a', fontWeight: 700 }}>
                            {selectedTier.label}
                        </div>
                    </div>
                    <div>
                        <div style={{ color: '#666', fontSize: '11px', marginBottom: '3px' }}>
                            MAX MULTIPLIER
                        </div>
                        <div style={{ color: '#f7931a', fontWeight: 700 }}>
                            {selectedTier.maxMultiplier}
                        </div>
                    </div>
                    {estimatedReward > 0 && (
                        <div style={{ gridColumn: 'span 2' }}>
                            <div style={{ color: '#666', fontSize: '11px', marginBottom: '3px' }}>
                                EST. TOTAL REWARDS (avg multiplier)
                            </div>
                            <div style={{ color: '#22c55e', fontWeight: 700, fontSize: '15px' }}>
                                ~{estimatedReward.toFixed(4)} HODL
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* CSV address info */}
            {csvAddress && (
                <div
                    style={{
                        background: '#111',
                        border: '1px solid rgba(255,255,255,0.06)',
                        borderRadius: '6px',
                        padding: '10px 12px',
                        marginBottom: '16px',
                        fontSize: '11px',
                        color: '#555',
                        wordBreak: 'break-all',
                    }}
                >
                    <span style={{ color: '#888', marginRight: '8px' }}>CSV LOCK ADDRESS:</span>
                    {csvAddress}
                </div>
            )}

            {/* Error */}
            {error && <div className="error-banner">{error}</div>}

            {/* Success */}
            {txId && (
                <div
                    style={{
                        background: 'rgba(34,197,94,0.08)',
                        border: '1px solid rgba(34,197,94,0.3)',
                        borderRadius: '8px',
                        padding: '12px',
                        marginBottom: '16px',
                        fontSize: '12px',
                        color: '#86efac',
                    }}
                >
                    ✓ Staked! Tx:{' '}
                    <a
                        href={`https://testnet.opnet.org/tx/${txId}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{ color: '#4ade80' }}
                    >
                        {txId.slice(0, 16)}…
                    </a>
                </div>
            )}

            {/* Stake button */}
            <button
                className="btn-primary"
                onClick={handleStake}
                disabled={!canStake}
                style={{ width: '100%', fontSize: '16px', padding: '16px' }}
            >
                {txPending ? (
                    <>
                        <span className="spinner" />
                        STAKING…
                    </>
                ) : (
                    'STAKE BTC'
                )}
            </button>

            {!walletConnected && (
                <p
                    style={{
                        textAlign: 'center',
                        color: '#555',
                        fontSize: '12px',
                        marginTop: '10px',
                    }}
                >
                    Connect OPWallet to stake
                </p>
            )}
        </div>
    );
};
