import { useState } from 'react';
import { useWalletConnect } from '@btc-vision/walletconnect';
import { useRaffle } from '../hooks/useRaffle';
import { type ProtocolStats } from '../services/ContractService';
import { BLOCKS_PER_DAY } from '../config/contracts';

const STATE_LABELS = ['OPEN', 'CLOSED', 'DRAWN'];
const STATE_COLORS = ['#4ade80', 'var(--gold)', 'var(--purple)'];

const MINS_PER_BLOCK = 10; // OPNet testnet

function blocksToTime(blocks: bigint): string {
    const b = Number(blocks);
    if (b <= 0) return 'now';
    const days  = Math.floor(b / BLOCKS_PER_DAY);
    const hours = Math.floor((b % BLOCKS_PER_DAY) / 6);
    const mins  = b * MINS_PER_BLOCK;
    if (days > 0) return `~${days}d ${hours}h`;
    if (hours > 0) return `~${hours}h`;
    return `~${mins}m`;
}

interface Props {
    stats: ProtocolStats;
    userTickets: bigint;
    currentBlock?: bigint;
}

export function RafflePanel({ stats, userTickets, currentBlock = 0n }: Props) {
    const { walletAddress } = useWalletConnect();
    const connected = !!walletAddress;

    const [showTooltip, setShowTooltip] = useState(false);

    const raffleId    = stats.currentRaffleId;
    const { raffle }  = useRaffle(raffleId);

    const stateLabel  = raffleId === 0n ? 'NO RAFFLE YET' : (STATE_LABELS[raffle.state] ?? 'UNKNOWN');
    const stateColor  = raffleId === 0n ? 'rgba(255,255,255,0.3)' : (STATE_COLORS[raffle.state] ?? 'var(--cyan)');

    const drawBlock       = raffle.drawBlock;
    const entryCloseBlock = raffle.entryCloseBlock;

    // Compute remaining blocks using current block when available
    const drawRemaining = currentBlock > 0n && drawBlock > currentBlock
        ? drawBlock - currentBlock
        : drawBlock > 0n ? drawBlock : 0n;
    const closeRemaining = currentBlock > 0n && entryCloseBlock > currentBlock
        ? entryCloseBlock - currentBlock
        : entryCloseBlock > 0n ? entryCloseBlock : 0n;

    const totalTix      = raffle.totalTickets;
    const winChancePct  = totalTix > 0n && userTickets > 0n
        ? ((Number(userTickets) / Number(totalTix)) * 100).toFixed(2)
        : null;

    return (
        <div className="card">
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                <div>
                    <div className="label-sm" style={{ marginBottom: 4 }}>RAFFLE STATUS</div>
                    <div style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 9,
                        color: 'rgba(61,235,255,0.3)',
                    }}>
                        {raffleId > 0n ? `Raffle #${raffleId.toString()}` : 'Awaiting deployment'}
                    </div>
                </div>
                <div style={{
                    fontFamily: 'var(--font-digit)',
                    fontSize: 11,
                    letterSpacing: '0.1em',
                    color: stateColor,
                    background: `${stateColor}18`,
                    border: `1px solid ${stateColor}40`,
                    borderRadius: 6,
                    padding: '4px 12px',
                }}>
                    {stateLabel}
                </div>
            </div>

            {/* Countdown */}
            {raffle.state === 0 && drawBlock > 0n && (
                <div style={{
                    background: '#0c1825',
                    border: '1px solid rgba(61,235,255,0.12)',
                    borderRadius: 10,
                    padding: '12px 16px',
                    marginBottom: 14,
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: 12,
                }}>
                    <div>
                        <div className="label-sm" style={{ marginBottom: 4 }}>ENTRY CLOSES</div>
                        <div className="num-cyan" style={{ fontSize: 20 }}>
                            {blocksToTime(closeRemaining)}
                        </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div className="label-sm" style={{ marginBottom: 2 }}>DRAW IN</div>
                        <div className="num-cyan" style={{ fontSize: 20 }}>
                            {blocksToTime(drawRemaining)}
                        </div>
                        <div style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: 9,
                            color: 'rgba(61,235,255,0.35)',
                            marginTop: 2,
                        }}>
                            block #{drawBlock.toString()}
                        </div>
                    </div>
                </div>
            )}

            {/* Stats */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
                <StatRow label="PARTICIPANTS"  value={raffle.participantCount.toString()} />
                <StatRow label="TOTAL TICKETS" value={Number(totalTix).toLocaleString()} />

                {/* Your tickets with tooltip */}
                {connected && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, position: 'relative' }}>
                            <span style={{
                                fontFamily: 'var(--font-mono)',
                                fontSize: 10,
                                color: 'rgba(61,235,255,0.35)',
                            }}>
                                YOUR TICKETS
                            </span>
                            {/* Info icon + tooltip */}
                            <button
                                onClick={() => setShowTooltip(v => !v)}
                                style={{
                                    background: 'none',
                                    border: '1px solid rgba(61,235,255,0.2)',
                                    borderRadius: '50%',
                                    color: 'rgba(61,235,255,0.4)',
                                    fontFamily: 'var(--font-mono)',
                                    fontSize: 9,
                                    cursor: 'pointer',
                                    width: 14,
                                    height: 14,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    lineHeight: 1,
                                    padding: 0,
                                    flexShrink: 0,
                                }}
                                title="Ticket formula"
                            >
                                ?
                            </button>

                            {showTooltip && (
                                <div style={{
                                    position: 'absolute',
                                    bottom: '100%',
                                    left: 0,
                                    marginBottom: 6,
                                    background: '#05070b',
                                    border: '1px solid rgba(139,92,246,0.3)',
                                    borderRadius: 8,
                                    padding: '10px 14px',
                                    width: 220,
                                    zIndex: 100,
                                    boxShadow: '0 4px 20px rgba(0,0,0,0.6)',
                                }}>
                                    <div style={{
                                        fontFamily: 'var(--font-mono)',
                                        fontSize: 10,
                                        color: 'var(--purple)',
                                        marginBottom: 6,
                                        letterSpacing: '0.1em',
                                    }}>
                                        TICKET FORMULA
                                    </div>
                                    <div style={{
                                        fontFamily: 'var(--font-digit)',
                                        fontSize: 11,
                                        color: 'var(--cyan)',
                                        marginBottom: 6,
                                        letterSpacing: '0.04em',
                                    }}>
                                        tickets = √stake × time
                                    </div>
                                    <div style={{
                                        fontFamily: 'var(--font-mono)',
                                        fontSize: 9,
                                        color: 'rgba(255,255,255,0.4)',
                                        lineHeight: 1.6,
                                    }}>
                                        More BTC staked + longer hold time = more tickets.
                                        Tickets reset when you enter a new raffle.
                                    </div>
                                </div>
                            )}
                        </div>
                        <span style={{
                            fontFamily: 'var(--font-digit)',
                            fontSize: 12,
                            color: 'var(--cyan)',
                        }}>
                            {Number(userTickets).toLocaleString()}
                        </span>
                    </div>
                )}
            </div>

            {/* Win chance */}
            {connected && winChancePct && (
                <div style={{
                    background: '#0f1020',
                    border: '1px solid rgba(139,92,246,0.25)',
                    borderRadius: 8,
                    padding: '12px 14px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 10,
                }}>
                    <div>
                        <div style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: 9,
                            color: 'var(--purple-dim)',
                            marginBottom: 3,
                            letterSpacing: '0.12em',
                        }}>
                            EST. WIN CHANCE
                        </div>
                        <div style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: 9,
                            color: 'rgba(255,255,255,0.25)',
                        }}>
                            Based on your current ticket share
                        </div>
                    </div>
                    <div className="num-purple" style={{ fontSize: 24 }}>
                        {winChancePct}%
                    </div>
                </div>
            )}

            {/* VRF note */}
            <div style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 9,
                color: 'rgba(61,235,255,0.2)',
            }}>
                Provably fair · Verified Random Function (VRF) draw
            </div>
        </div>
    );
}

function StatRow({ label, value, valueColor = 'rgba(255,255,255,0.6)' }: {
    label: string;
    value: string;
    valueColor?: string;
}) {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'rgba(61,235,255,0.35)' }}>
                {label}
            </span>
            <span style={{ fontFamily: 'var(--font-digit)', fontSize: 12, color: valueColor }}>
                {value}
            </span>
        </div>
    );
}
