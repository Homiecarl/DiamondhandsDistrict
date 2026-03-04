import React, { useEffect, useRef, useState } from 'react';

interface RewardCounterProps {
    pendingRewards: bigint;
    onClaim: () => Promise<string>;
    txPending: boolean;
    walletConnected: boolean;
}

/** Format a bigint HODL token value (raw integer units, 0 decimals) */
function formatHodl(raw: bigint): string {
    if (raw === 0n) return '0.0000';
    // Display as-is — HODL tokens are whole units in the contract
    return raw.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4 });
}

export const RewardCounter: React.FC<RewardCounterProps> = ({
    pendingRewards,
    onClaim,
    txPending,
    walletConnected,
}) => {
    const [txId, setTxId] = useState('');
    const [error, setError] = useState('');
    const [animClass, setAnimClass] = useState('');
    const prevRewards = useRef(pendingRewards);

    // Trigger tick animation when rewards change
    useEffect(() => {
        if (pendingRewards !== prevRewards.current) {
            prevRewards.current = pendingRewards;
            setAnimClass('counter-tick');
            const t = setTimeout(() => setAnimClass(''), 350);
            return () => clearTimeout(t);
        }
    }, [pendingRewards]);

    const handleClaim = async () => {
        if (pendingRewards === 0n) return;
        setError('');
        setTxId('');
        try {
            const id = await onClaim();
            setTxId(id);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Claim failed');
        }
    };

    const hasPending = pendingRewards > 0n;

    return (
        <div
            style={{
                background: 'linear-gradient(135deg, #111 0%, #0d0d0d 100%)',
                border: `1px solid ${hasPending ? 'rgba(247,147,26,0.35)' : 'rgba(255,255,255,0.06)'}`,
                borderRadius: '14px',
                padding: '28px 24px',
                marginTop: '24px',
                textAlign: 'center',
                boxShadow: hasPending ? '0 0 30px rgba(247,147,26,0.15)' : 'none',
                transition: 'all 400ms ease',
            }}
        >
            {/* Label */}
            <div
                style={{
                    fontSize: '11px',
                    color: '#666',
                    letterSpacing: '0.2em',
                    marginBottom: '12px',
                }}
            >
                PENDING HODL REWARDS
            </div>

            {/* Counter */}
            <div
                className={`${hasPending ? 'glow-text' : ''} ${animClass}`}
                style={{
                    fontSize: '48px',
                    fontWeight: 700,
                    letterSpacing: '0.04em',
                    fontVariantNumeric: 'tabular-nums',
                    color: hasPending ? '#f7931a' : '#333',
                    lineHeight: 1.1,
                    marginBottom: '6px',
                    transition: 'color 400ms ease',
                }}
            >
                {formatHodl(pendingRewards)}
            </div>

            <div style={{ fontSize: '13px', color: '#555', marginBottom: '24px' }}>
                HODL tokens · updates ~every 10s
            </div>

            {/* Rate info */}
            {hasPending && (
                <div
                    style={{
                        display: 'inline-block',
                        background: 'rgba(247,147,26,0.07)',
                        border: '1px solid rgba(247,147,26,0.15)',
                        borderRadius: '6px',
                        padding: '6px 14px',
                        fontSize: '11px',
                        color: '#888',
                        marginBottom: '20px',
                    }}
                >
                    1 HODL per 100,000,000 sat-blocks · multiplier grows over lock period
                </div>
            )}

            {/* Error / success */}
            {error && (
                <div className="error-banner" style={{ marginBottom: '16px' }}>
                    {error}
                </div>
            )}
            {txId && (
                <div
                    style={{
                        background: 'rgba(34,197,94,0.08)',
                        border: '1px solid rgba(34,197,94,0.3)',
                        borderRadius: '8px',
                        padding: '10px 14px',
                        marginBottom: '16px',
                        fontSize: '12px',
                        color: '#86efac',
                    }}
                >
                    ✓ Rewards claimed! Tx:{' '}
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

            {/* Claim button */}
            <button
                className="btn-primary"
                onClick={handleClaim}
                disabled={!walletConnected || !hasPending || txPending}
                style={{
                    minWidth: '200px',
                    fontSize: '15px',
                    padding: '14px 28px',
                    opacity: !hasPending ? 0.4 : 1,
                }}
            >
                {txPending ? (
                    <>
                        <span className="spinner" />
                        CLAIMING…
                    </>
                ) : (
                    'CLAIM REWARDS'
                )}
            </button>
        </div>
    );
};
