import { useState, useEffect } from 'react';
import { type ProtocolStats } from '../services/ContractService';
import { type RaffleInfo } from '../services/ContractService';
import { SAT_PER_BTC, MILESTONES, BLOCKS_PER_DAY } from '../config/contracts';

const MINS_PER_BLOCK = 10; // OPNet testnet

function satsToBtc(sats: bigint, decimals = 8): string {
    return (Number(sats) / Number(SAT_PER_BTC)).toFixed(decimals);
}

function satsToNum(sats: bigint): number {
    return Number(sats) / Number(SAT_PER_BTC);
}

function blocksToCountdown(blocks: bigint): string {
    const b = Number(blocks);
    if (b <= 0) return 'drawing now';
    const days  = Math.floor(b / BLOCKS_PER_DAY);
    const hours = Math.floor((b % BLOCKS_PER_DAY) / 6);
    const mins  = b * MINS_PER_BLOCK;
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h`;
    return `${mins}m`;
}

interface Props {
    stats: ProtocolStats;
    raffle: RaffleInfo;
    loading: boolean;
    deployed: boolean;
    currentBlock?: bigint;
}

export function JackpotCard({ stats, raffle, loading, deployed, currentBlock }: Props) {
    const pool    = stats.prizePool;
    const poolBtc = satsToNum(pool);

    // Multi-milestone progress
    const maxMs  = MILESTONES[MILESTONES.length - 1];
    const maxBtc = maxMs ? satsToNum(maxMs.sats) : 1;
    const overallPct = Math.min((poolBtc / maxBtc) * 100, 100);

    // BTC display with muted trailing zeros
    const btcFull = deployed ? satsToBtc(pool) : null;
    let btcMain = btcFull ?? '—';
    let btcTrail = '';
    if (btcFull) {
        const dotIdx = btcFull.indexOf('.');
        const significant = btcFull.slice(dotIdx + 1).replace(/0+$/, '');
        if (significant.length < 8) {
            btcMain  = btcFull.slice(0, dotIdx + 1 + significant.length);
            btcTrail = btcFull.slice(dotIdx + 1 + significant.length);
        }
    }

    // Compute draw countdown — use live currentBlock if available
    const drawBlocksRemaining = raffle.drawBlock > 0n && currentBlock && currentBlock > 0n
        ? raffle.drawBlock > currentBlock
            ? raffle.drawBlock - currentBlock
            : 0n
        : raffle.drawBlock;
    const drawTime = drawBlocksRemaining > 0n
        ? blocksToCountdown(drawBlocksRemaining)
        : raffle.drawBlock > 0n ? 'drawing now' : 'soon';

    // Rotating messages
    const MESSAGES = [
        `Next Draw: ${drawTime}`,
        'Up to 10 Winners',
        'Release Range: 33% – 100%',
        'Someone in the District could hit the entire jackpot.',
    ];
    const [msgIdx, setMsgIdx] = useState(0);
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        const interval = setInterval(() => {
            setVisible(false);
            setTimeout(() => {
                setMsgIdx(i => (i + 1) % MESSAGES.length);
                setVisible(true);
            }, 300);
        }, 3500);
        return () => clearInterval(interval);
    // MESSAGES changes each render but we only want to run once
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [drawTime]);

    return (
        <div className="card" style={{ animation: 'goldPulse 4s ease-in-out infinite' }}>
            {/* Gold top accent */}
            <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: 2,
                background: 'linear-gradient(90deg, transparent, var(--gold), transparent)',
                opacity: 0.7,
            }} />

            <div className="label-sm">DISTRICT JACKPOT</div>

            {/* Big gold number */}
            <div style={{ marginBottom: 2 }}>
                <span className="num-gold" style={{ fontSize: 46 }}>
                    {loading ? '···' : btcMain}
                </span>
                {btcTrail && (
                    <span style={{
                        fontFamily: 'var(--font-digit)',
                        fontSize: 46,
                        color: 'rgba(245,200,76,0.25)',
                        letterSpacing: '0.08em',
                    }}>
                        {btcTrail}
                    </span>
                )}
                {deployed && !loading && (
                    <span style={{
                        fontFamily: 'var(--font-digit)',
                        fontSize: 18,
                        color: 'var(--gold-dim)',
                        marginLeft: 8,
                    }}>
                        BTC
                    </span>
                )}
            </div>

            {/* Rotating message line */}
            <div style={{
                minHeight: 20,
                marginBottom: 16,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
            }}>
                <span style={{
                    width: 6, height: 6, borderRadius: '50%',
                    background: 'var(--gold)',
                    boxShadow: '0 0 8px var(--gold-glow)',
                    flexShrink: 0,
                    animation: 'blink 1.8s ease-in-out infinite',
                }} />
                <span
                    key={msgIdx}
                    className="rotator-text"
                    style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 11,
                        color: 'rgba(245,200,76,0.6)',
                        letterSpacing: '0.04em',
                        opacity: visible ? 1 : 0,
                        transition: 'opacity 0.3s ease',
                    }}
                >
                    {MESSAGES[msgIdx]}
                </span>
            </div>

            {/* Boost badge */}
            {stats.boostActive && (
                <span className="boost-badge" style={{ display: 'inline-flex', marginBottom: 14 }}>
                    ⚡ BOOST ACTIVE — Prize Yield 10%
                </span>
            )}

            {/* Milestone progress bar */}
            {deployed && (
                <div>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: 8,
                    }}>
                        <span className="label-sm" style={{ marginBottom: 0 }}>MILESTONE PROGRESS</span>
                        <span style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: 9,
                            color: 'rgba(245,200,76,0.5)',
                        }}>
                            {overallPct.toFixed(1)}% to 1 BTC
                        </span>
                    </div>

                    <div style={{ position: 'relative', marginBottom: 8 }}>
                        <div style={{
                            height: 6,
                            background: 'rgba(245,200,76,0.08)',
                            borderRadius: 3,
                            overflow: 'visible',
                            position: 'relative',
                        }}>
                            <div style={{
                                height: '100%',
                                width: `${overallPct}%`,
                                background: stats.boostActive
                                    ? 'linear-gradient(90deg, var(--gold), #ff9900)'
                                    : 'linear-gradient(90deg, rgba(245,200,76,0.4), var(--gold))',
                                borderRadius: 3,
                                transition: 'width 0.8s ease',
                                boxShadow: '0 0 10px var(--gold-glow)',
                            }} />

                            {MILESTONES.map((ms, i) => {
                                const msNum     = satsToNum(ms.sats);
                                const markerPct = (msNum / maxBtc) * 100;
                                const reached   = poolBtc >= msNum;
                                return (
                                    <div
                                        key={i}
                                        title={ms.label}
                                        style={{
                                            position: 'absolute',
                                            left: `${markerPct}%`,
                                            top: '50%',
                                            transform: 'translate(-50%, -50%)',
                                            width: 10, height: 10,
                                            borderRadius: '50%',
                                            background: reached ? 'var(--gold)' : 'rgba(245,200,76,0.15)',
                                            border: `1.5px solid ${reached ? 'var(--gold)' : 'rgba(245,200,76,0.35)'}`,
                                            boxShadow: reached ? '0 0 8px var(--gold-glow)' : 'none',
                                            transition: 'all 0.4s',
                                        }}
                                    />
                                );
                            })}
                        </div>

                        <div style={{ position: 'relative', height: 16, marginTop: 4 }}>
                            {MILESTONES.map((ms, i) => {
                                const msNum     = satsToNum(ms.sats);
                                const markerPct = (msNum / maxBtc) * 100;
                                return (
                                    <span
                                        key={i}
                                        style={{
                                            position: 'absolute',
                                            left: `${markerPct}%`,
                                            transform: 'translateX(-50%)',
                                            fontFamily: 'var(--font-mono)',
                                            fontSize: 8,
                                            color: 'rgba(245,200,76,0.4)',
                                            whiteSpace: 'nowrap',
                                        }}
                                    >
                                        {ms.label}
                                    </span>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {!deployed && (
                <div style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 10,
                    color: 'rgba(61,235,255,0.3)',
                    marginTop: 4,
                }}>
                    Deploying to OPNet testnet...
                </div>
            )}
        </div>
    );
}
