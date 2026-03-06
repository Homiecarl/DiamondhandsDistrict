import { useState } from 'react';
import { useWalletConnect } from '@btc-vision/walletconnect';
import { type UserPosition, type ProtocolStats } from '../services/ContractService';

const MOTO_DECIMALS = 1e18;
const BLOCKS_PER_DAY = 144;
const BLOCKS_PER_YEAR = 52_560;
const ACC_SCALE = 1_000_000_000_000n; // 1e12 — matches contract ACC_SCALE

/**
 * Show MOTO with enough precision that dust is never displayed as "0".
 * Returns raw-unit suffix when < 0.00000001 (shouldn't happen, but defensive).
 */
function formatMoto(raw: bigint): string {
    if (raw === 0n) return '0';
    const n = Number(raw) / MOTO_DECIMALS;
    if (n >= 1_000) return n.toLocaleString('en-US', { maximumFractionDigits: 2 });
    if (n >= 1)     return n.toFixed(4);
    if (n >= 0.01)  return n.toFixed(6);
    // dust: always show 8 decimal places so it's never "0"
    return n.toFixed(8);
}

/** User's share of MOTO per block in raw token units (18 decimals). */
function userMotoPerBlock(stats: ProtocolStats, position: UserPosition): bigint {
    if (stats.totalStaked === 0n || position.stake === 0n) return 0n;
    // motoPerBlock from contract is pre-scaled by ACC_SCALE (1e12); divide it out.
    return stats.motoPerBlock * position.stake / stats.totalStaked / ACC_SCALE;
}

interface Props {
    position: UserPosition;
    stats: ProtocolStats;
    txPending: boolean;
    deployed: boolean;
    onClaim: () => Promise<unknown>;
}

export function YieldPanel({ position, stats, txPending, deployed, onClaim }: Props) {
    const { walletAddress } = useWalletConnect();
    const connected = !!walletAddress;

    const [open, setOpen] = useState(false);

    const hasPending   = deployed && position.pendingMoto > 0n;
    const isStaked     = deployed && position.stake > 0n;
    const pendingStr   = deployed ? formatMoto(position.pendingMoto) : '—';

    // Per-user accrual rates
    const motoPerBlock  = userMotoPerBlock(stats, position);
    const motoPerDay    = motoPerBlock * BigInt(BLOCKS_PER_DAY);
    const motoPerWeek   = motoPerBlock * BigInt(BLOCKS_PER_DAY * 7);
    const motoPerYearN  = motoPerBlock > 0n
        ? Number(motoPerBlock) / MOTO_DECIMALS * BLOCKS_PER_YEAR
        : null;

    const earningActive = isStaked && motoPerBlock > 0n;

    return (
        <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div className="label-sm" style={{ marginBottom: 0 }}>YIELD ENGINE</div>

                {/* Accrual status pill */}
                {deployed && (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 5,
                        background: earningActive ? 'rgba(74,222,128,0.08)' : 'rgba(61,235,255,0.05)',
                        border: `1px solid ${earningActive ? 'rgba(74,222,128,0.3)' : 'rgba(61,235,255,0.1)'}`,
                        borderRadius: 6,
                        padding: '3px 9px',
                    }}>
                        <div style={{
                            width: 5, height: 5, borderRadius: '50%',
                            background: earningActive ? '#4ade80' : 'rgba(255,255,255,0.2)',
                            boxShadow: earningActive ? '0 0 6px #4ade8080' : 'none',
                            animation: earningActive ? 'blink 2s ease-in-out infinite' : 'none',
                        }} />
                        <span style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: 9,
                            letterSpacing: '0.12em',
                            color: earningActive ? '#4ade80' : 'rgba(255,255,255,0.2)',
                        }}>
                            {earningActive ? 'ACCRUING' : 'IDLE'}
                        </span>
                    </div>
                )}
            </div>

            {/* Pending MOTO */}
            <div style={{ marginBottom: 8 }}>
                <div style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 9,
                    color: 'var(--purple-dim)',
                    marginBottom: 4,
                }}>
                    CLAIMABLE MOTO
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
                    <span className="num-purple" style={{
                        fontSize: position.pendingMoto > 0n && pendingStr.length > 8 ? 22 : 36,
                        transition: 'font-size 0.2s',
                    }}>
                        {pendingStr}
                    </span>
                    {deployed && (
                        <span style={{
                            fontFamily: 'var(--font-digit)',
                            fontSize: 13,
                            color: 'var(--purple-dim)',
                        }}>
                            MOTO
                        </span>
                    )}
                </div>

                {/* Raw sats helper for dust */}
                {deployed && position.pendingMoto > 0n && position.pendingMoto < 10_000n && (
                    <div style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 9,
                        color: 'rgba(139,92,246,0.4)',
                        marginTop: 3,
                    }}>
                        {position.pendingMoto.toString()} raw units — dust accumulating
                    </div>
                )}
            </div>

            {/* Accrual rate — always visible when staked */}
            {deployed && isStaked && motoPerBlock > 0n && (
                <div style={{
                    background: '#0f1020',
                    border: '1px solid rgba(139,92,246,0.22)',
                    borderRadius: 8,
                    padding: '10px 12px',
                    marginBottom: 14,
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr 1fr',
                    gap: 8,
                }}>
                    <RateCell label="PER BLOCK" value={formatMoto(motoPerBlock)} />
                    <RateCell label="PER DAY"   value={formatMoto(motoPerDay)} />
                    <RateCell label="PER WEEK"  value={formatMoto(motoPerWeek)} />
                </div>
            )}

            {/* No stake hint */}
            {deployed && !isStaked && connected && (
                <div style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 10,
                    color: 'rgba(255,255,255,0.25)',
                    marginBottom: 14,
                }}>
                    Stake BTC to start earning MOTO
                </div>
            )}

            {/* Claim button */}
            <button
                className="btn-purple"
                onClick={onClaim}
                disabled={!connected || !hasPending || txPending}
                style={{ width: '100%', marginBottom: 14 }}
            >
                {txPending ? '···' : hasPending ? 'CLAIM MOTO' : 'NOTHING TO CLAIM YET'}
            </button>

            <div style={{ borderTop: '1px solid rgba(0,210,255,0.08)', marginBottom: 12 }} />

            {/* Yield breakdown accordion */}
            <button
                onClick={() => setOpen(o => !o)}
                style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    width: '100%',
                    padding: 0,
                }}
            >
                <span style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 10,
                    letterSpacing: '0.12em',
                    color: 'var(--cyan)',
                }}>
                    YIELD BREAKDOWN
                </span>
                <span style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 10,
                    color: 'rgba(61,235,255,0.4)',
                    display: 'inline-block',
                    transform: open ? 'rotate(180deg)' : 'none',
                    transition: 'transform 0.2s',
                }}>
                    ▾
                </span>
            </button>

            {open && (
                <div style={{
                    marginTop: 12,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                    animation: 'fadeUp 0.2s ease-out',
                }}>
                    <YieldRow
                        label="Annual Est."
                        value={motoPerYearN !== null
                            ? `${motoPerYearN < 0.01 ? motoPerYearN.toFixed(8) : motoPerYearN.toFixed(4)} MOTO/yr`
                            : '—'}
                        valueColor="var(--purple)"
                    />
                    <YieldRow label="Yield Token" value="MOTO" valueColor="var(--purple)" />
                    <YieldRow label="Pool Rate"   value={stats.motoPerBlock > 0n ? `${formatMoto(stats.motoPerBlock)}/blk` : '—'} />
                    <YieldRow
                        label="Your Raffle"
                        value={deployed ? `#${position.raffleId.toString()}` : '—'}
                    />
                    <YieldRow
                        label="Entry Block"
                        value={deployed && position.entryBlock > 0n ? `#${position.entryBlock.toString()}` : '—'}
                    />
                </div>
            )}

            {!connected && (
                <div style={{
                    marginTop: 12,
                    fontFamily: 'var(--font-mono)',
                    fontSize: 10,
                    color: 'rgba(61,235,255,0.25)',
                    textAlign: 'center',
                }}>
                    Connect wallet to see yield
                </div>
            )}
        </div>
    );
}

function RateCell({ label, value }: { label: string; value: string }) {
    return (
        <div style={{ textAlign: 'center' }}>
            <div style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 8,
                letterSpacing: '0.1em',
                color: 'rgba(139,92,246,0.45)',
                marginBottom: 4,
            }}>
                {label}
            </div>
            <div style={{
                fontFamily: 'var(--font-digit)',
                fontSize: 10,
                color: 'var(--purple)',
            }}>
                {value}
            </div>
        </div>
    );
}

function YieldRow({ label, value, valueColor = 'rgba(255,255,255,0.55)' }: {
    label: string;
    value: string;
    valueColor?: string;
}) {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'rgba(61,235,255,0.35)' }}>
                {label}
            </span>
            <span style={{ fontFamily: 'var(--font-digit)', fontSize: 11, color: valueColor }}>
                {value}
            </span>
        </div>
    );
}
