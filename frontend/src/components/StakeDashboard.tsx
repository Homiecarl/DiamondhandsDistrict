import React, { useEffect, useState } from 'react';
import { StakeInfo } from '../services/StakingService';

interface StakeDashboardProps {
    stakeInfo: StakeInfo;
    currentBlock: bigint;
    onUnstake: () => Promise<string>;
    txPending: boolean;
}

function formatSats(sats: bigint): string {
    const btc = Number(sats) / 1e8;
    return `${btc.toFixed(6)} BTC`;
}

function getMultiplier(elapsed: bigint, lockBlocks: bigint, maxMultX1000: number): number {
    if (lockBlocks === 0n) return 1;
    const progress = Number(elapsed > lockBlocks ? lockBlocks : elapsed) / Number(lockBlocks);
    return 1 + (progress * (maxMultX1000 / 1000 - 1));
}

function getMaxMultX1000(lockBlocks: bigint): number {
    if (lockBlocks === 1_008n) return 2_000;
    if (lockBlocks === 2_016n) return 2_500;
    if (lockBlocks === 4_320n) return 3_000;
    if (lockBlocks === 8_640n) return 4_000;
    return 1_000;
}

function getTierLabel(lockBlocks: bigint): string {
    if (lockBlocks === 1_008n) return '1 WEEK';
    if (lockBlocks === 2_016n) return '2 WEEKS';
    if (lockBlocks === 4_320n) return '1 MONTH';
    if (lockBlocks === 8_640n) return '2 MONTHS';
    return `${lockBlocks} blocks`;
}

export const StakeDashboard: React.FC<StakeDashboardProps> = ({
    stakeInfo,
    currentBlock,
    onUnstake,
    txPending,
}) => {
    const [txId, setTxId] = useState('');
    const [error, setError] = useState('');

    const { satoshis, startBlock, lockBlocks, unlockBlock } = stakeInfo;

    const elapsed = currentBlock > startBlock ? currentBlock - startBlock : 0n;
    const progressPct = lockBlocks > 0n
        ? Math.min(100, Number((elapsed * 100n) / lockBlocks))
        : 0;
    const isUnlocked = currentBlock >= unlockBlock;
    const blocksRemaining = isUnlocked ? 0n : unlockBlock - currentBlock;
    const maxMultX1000 = getMaxMultX1000(lockBlocks);
    const multiplier = getMultiplier(elapsed, lockBlocks, maxMultX1000);

    const handleUnstake = async () => {
        setError('');
        setTxId('');
        try {
            const id = await onUnstake();
            setTxId(id);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unstake failed');
        }
    };

    return (
        <div
            className="card card-orange"
            style={{ marginTop: '32px' }}
        >
            {/* Header */}
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '24px',
                }}
            >
                <div>
                    <div
                        style={{
                            fontSize: '11px',
                            color: '#666',
                            letterSpacing: '0.15em',
                            marginBottom: '6px',
                        }}
                    >
                        ACTIVE STAKE
                    </div>
                    <div
                        style={{
                            fontSize: '28px',
                            fontWeight: 700,
                            color: '#f7931a',
                        }}
                    >
                        {formatSats(satoshis)}
                    </div>
                    <div style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>
                        {satoshis.toLocaleString()} sats · {getTierLabel(lockBlocks)}
                    </div>
                </div>

                {/* Multiplier gauge */}
                <div
                    style={{
                        textAlign: 'right',
                        background: 'rgba(247,147,26,0.08)',
                        border: '1px solid rgba(247,147,26,0.2)',
                        borderRadius: '10px',
                        padding: '12px 18px',
                    }}
                >
                    <div style={{ fontSize: '10px', color: '#888', marginBottom: '4px' }}>
                        MULTIPLIER
                    </div>
                    <div
                        style={{
                            fontSize: '32px',
                            fontWeight: 700,
                            color: '#f7931a',
                            fontVariantNumeric: 'tabular-nums',
                        }}
                        className="glow-text"
                    >
                        {multiplier.toFixed(2)}×
                    </div>
                    <div style={{ fontSize: '10px', color: '#666' }}>
                        max {(maxMultX1000 / 1000).toFixed(1)}×
                    </div>
                </div>
            </div>

            {/* Progress bar */}
            <div style={{ marginBottom: '24px' }}>
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: '8px',
                        fontSize: '12px',
                    }}
                >
                    <span style={{ color: '#888' }}>LOCK PROGRESS</span>
                    <span style={{ color: isUnlocked ? '#22c55e' : '#f7931a', fontWeight: 700 }}>
                        {isUnlocked ? '✓ UNLOCKED' : `${progressPct.toFixed(1)}%`}
                    </span>
                </div>
                <div className="progress-track">
                    <div
                        className="progress-fill"
                        style={{ width: `${progressPct}%` }}
                    />
                </div>
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginTop: '6px',
                        fontSize: '11px',
                        color: '#555',
                    }}
                >
                    <span>Block #{startBlock.toString()}</span>
                    <span>Block #{unlockBlock.toString()}</span>
                </div>
            </div>

            {/* Stats grid */}
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '12px',
                    marginBottom: '24px',
                }}
            >
                <Stat label="START BLOCK" value={`#${startBlock}`} />
                <Stat label="UNLOCK BLOCK" value={`#${unlockBlock}`} />
                <Stat
                    label={isUnlocked ? 'UNLOCKED' : 'BLOCKS LEFT'}
                    value={isUnlocked ? '✓ READY' : blocksRemaining.toString()}
                    highlight={isUnlocked}
                />
            </div>

            {/* Error / success */}
            {error && <div className="error-banner">{error}</div>}
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
                    ✓ Unstaked! Tx:{' '}
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

            {/* Unstake button */}
            <button
                className={isUnlocked ? 'btn-secondary' : 'btn-danger'}
                onClick={handleUnstake}
                disabled={!isUnlocked || txPending}
                style={{ width: '100%' }}
                title={!isUnlocked ? `Locked for ${blocksRemaining} more blocks` : undefined}
            >
                {txPending ? (
                    <>
                        <span className="spinner" />
                        PROCESSING…
                    </>
                ) : isUnlocked ? (
                    'UNSTAKE BTC'
                ) : (
                    `LOCKED — ${blocksRemaining} blocks remaining`
                )}
            </button>
        </div>
    );
};

interface StatProps {
    label: string;
    value: string;
    highlight?: boolean;
}

const Stat: React.FC<StatProps> = ({ label, value, highlight }) => (
    <div
        style={{
            background: '#111',
            borderRadius: '8px',
            padding: '12px',
            textAlign: 'center',
        }}
    >
        <div style={{ fontSize: '10px', color: '#555', marginBottom: '5px' }}>{label}</div>
        <div
            style={{
                fontSize: '14px',
                fontWeight: 700,
                color: highlight ? '#22c55e' : '#e0e0e0',
            }}
        >
            {value}
        </div>
    </div>
);
