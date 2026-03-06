import { type ProtocolStats } from '../services/ContractService';
import { type RaffleInfo } from '../services/ContractService';
import { SAT_PER_BTC, BLOCKS_PER_DAY } from '../config/contracts';

function satsToBtc(sats: bigint, dec = 6): string {
    return (Number(sats) / Number(SAT_PER_BTC)).toFixed(dec);
}

function formatMoto(raw: bigint): string {
    if (raw === 0n) return '—';
    const n = Number(raw) / 1e8;
    if (n >= 1000) return n.toLocaleString('en-US', { maximumFractionDigits: 0 });
    if (n >= 1)    return n.toFixed(2);
    return n.toFixed(6);
}

function blocksToCountdown(blocks: bigint): string {
    const b = Number(blocks);
    if (b <= 0) return 'NOW';
    const days  = Math.floor(b / BLOCKS_PER_DAY);
    const hours = Math.floor((b % BLOCKS_PER_DAY) / 6);
    const mins  = Math.floor((b % 6) * 10);
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${b} blocks`;
}

interface Props {
    stats: ProtocolStats;
    raffle: RaffleInfo;
    loading: boolean;
    deployed: boolean;
}

export function MetricsBar({ stats, raffle, loading, deployed }: Props) {
    const tvl       = deployed ? satsToBtc(stats.totalStaked, 4) : null;
    const jackpot   = deployed ? satsToBtc(stats.prizePool)       : null;
    const motoDaily = deployed ? formatMoto(stats.motoPerBlock * BigInt(BLOCKS_PER_DAY)) : null;
    const countdown = raffle.drawBlock > 0n ? blocksToCountdown(raffle.drawBlock) : null;

    return (
        <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 12,
        }}>
            <MetricCard
                label="TOTAL BTC LOCKED"
                value={tvl ? `${tvl} BTC` : '—'}
                subLabel="TVL"
                color="var(--gold)"
                glowColor="rgba(245,200,76,0.15)"
                icon="🔒"
                loading={loading}
            />
            <MetricCard
                label="BTC JACKPOT"
                value={jackpot ? `${jackpot} BTC` : '—'}
                subLabel="Prize Pool"
                color="var(--gold)"
                glowColor="rgba(245,200,76,0.2)"
                icon="💎"
                loading={loading}
                pulse
            />
            <MetricCard
                label="MOTO REWARDS"
                value={motoDaily ? `~${motoDaily} MOTO` : '—'}
                subLabel="Daily pool emission"
                color="var(--purple)"
                glowColor="rgba(139,92,246,0.15)"
                icon="⚡"
                loading={loading}
            />
            <MetricCard
                label="NEXT DRAW"
                value={countdown ?? '—'}
                subLabel={raffle.drawBlock > 0n ? `Block #${raffle.drawBlock.toString()}` : 'Awaiting first raffle'}
                color="var(--cyan)"
                glowColor="rgba(61,235,255,0.1)"
                icon="⏰"
                loading={loading}
            />
        </div>
    );
}

function MetricCard({
    label, value, subLabel, color, glowColor, icon, loading, pulse,
}: {
    label: string;
    value: string;
    subLabel: string;
    color: string;
    glowColor: string;
    icon: string;
    loading?: boolean;
    pulse?: boolean;
}) {
    return (
        <div className="metric-card" style={{
            boxShadow: `0 4px 24px ${glowColor}, 0 0 0 1px rgba(0,210,255,0.04)`,
            animation: pulse ? 'goldPulse 4s ease-in-out infinite' : 'none',
        }}>
            {/* Top row: label + icon */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="label-sm" style={{ marginBottom: 0 }}>{label}</span>
                <span style={{ fontSize: 16 }}>{icon}</span>
            </div>

            {/* Main value */}
            <div style={{
                fontFamily: 'var(--font-digit)',
                fontSize: 'clamp(18px, 2.5vw, 28px)',
                color: loading ? 'rgba(255,255,255,0.2)' : color,
                textShadow: loading ? 'none' : `0 0 20px ${color}50`,
                letterSpacing: '0.04em',
                lineHeight: 1.1,
                minHeight: 34,
                display: 'flex',
                alignItems: 'center',
                animation: loading ? 'none' : 'countUp 0.4s ease-out',
            }}>
                {loading ? '···' : value}
            </div>

            {/* Sub label */}
            <div style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 9,
                color: 'rgba(255,255,255,0.25)',
                letterSpacing: '0.08em',
            }}>
                {subLabel}
            </div>
        </div>
    );
}
