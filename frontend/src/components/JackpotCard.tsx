import { type ProtocolStats } from '../services/ContractService';
import { SAT_PER_BTC, MILESTONES } from '../config/contracts';

const B = '#00c8ff';
const DIM = 'rgba(0,200,255,0.45)';

function satsToBtc(sats: bigint): string {
    const btc = Number(sats) / Number(SAT_PER_BTC);
    return btc.toFixed(6);
}

function satsToNum(sats: bigint): number {
    return Number(sats) / Number(SAT_PER_BTC);
}

interface Props {
    stats: ProtocolStats;
    loading: boolean;
    deployed: boolean;
}

export function JackpotCard({ stats, loading, deployed }: Props) {
    const pool = stats.prizePool;
    const msIdx = Math.min(stats.milestoneIdx, MILESTONES.length - 1);
    const ms = MILESTONES[msIdx];
    const msTarget = ms ? satsToNum(ms.sats) : 0;
    const poolBtc = satsToNum(pool);
    const pct = msTarget > 0 ? Math.min((poolBtc / msTarget) * 100, 100) : 0;

    const stateLabel = !deployed
        ? 'COMING SOON'
        : loading
        ? 'SYNCING...'
        : `${satsToBtc(pool)} BTC`;

    return (
        <div style={{
            border: '1px solid rgba(0,200,255,0.18)',
            borderRadius: 4,
            background: 'rgba(0,10,25,0.85)',
            padding: '24px 28px',
            minWidth: 300,
            position: 'relative',
            overflow: 'hidden',
        }}>
            {/* Glow sweep */}
            <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: 2,
                background: `linear-gradient(90deg, transparent, ${B}, transparent)`,
                opacity: 0.7,
            }} />

            <div style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                letterSpacing: '0.18em',
                color: DIM,
                marginBottom: 8,
            }}>
                [ PRIZE POOL ]
            </div>

            {/* Main number */}
            <div style={{
                fontFamily: 'var(--font-digit)',
                fontSize: 36,
                color: B,
                letterSpacing: '0.08em',
                textShadow: `0 0 24px rgba(0,200,255,0.6)`,
                lineHeight: 1.1,
                marginBottom: 4,
            }}>
                {stateLabel}
            </div>

            {deployed && (
                <div style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 11,
                    color: DIM,
                    marginBottom: 16,
                }}>
                    {stats.boostActive && (
                        <span style={{ color: '#ffcc00', marginRight: 8 }}>⚡ BOOST ACTIVE</span>
                    )}
                    Raffle #{stats.currentRaffleId.toString()} · NFT treasury: {satsToBtc(stats.nftTreasury)} BTC
                </div>
            )}

            {/* Milestone progress */}
            {deployed && ms && (
                <div>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontFamily: 'var(--font-mono)',
                        fontSize: 10,
                        color: DIM,
                        marginBottom: 6,
                    }}>
                        <span>MILESTONE {msIdx + 1}/{MILESTONES.length} — {ms.label}</span>
                        <span>{pct.toFixed(1)}%</span>
                    </div>
                    <div style={{
                        height: 4,
                        background: 'rgba(0,200,255,0.12)',
                        borderRadius: 2,
                        overflow: 'hidden',
                    }}>
                        <div style={{
                            height: '100%',
                            width: `${pct}%`,
                            background: stats.boostActive
                                ? 'linear-gradient(90deg, #00c8ff, #ffcc00)'
                                : 'linear-gradient(90deg, rgba(0,200,255,0.5), #00c8ff)',
                            transition: 'width 0.6s ease',
                            boxShadow: `0 0 8px ${B}`,
                        }} />
                    </div>
                </div>
            )}

            {!deployed && (
                <div style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 11,
                    color: DIM,
                    marginTop: 8,
                }}>
                    Contract deploying to testnet...
                </div>
            )}
        </div>
    );
}
