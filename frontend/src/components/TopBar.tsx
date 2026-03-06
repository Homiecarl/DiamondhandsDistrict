import { useWalletConnect } from '@btc-vision/walletconnect';
import { type ProtocolStats, type UserPosition, type RaffleInfo } from '../services/ContractService';
import { SAT_PER_BTC, BLOCKS_PER_DAY } from '../config/contracts';
import { WalletConnect } from './WalletConnect';

function satsToBtc(sats: bigint, decimals = 6): string {
    return (Number(sats) / Number(SAT_PER_BTC)).toFixed(decimals);
}

function blocksToLabel(blocks: bigint): string {
    const b = Number(blocks);
    if (b <= 0) return 'NOW';
    const days = Math.floor(b / BLOCKS_PER_DAY);
    const hours = Math.floor((b % BLOCKS_PER_DAY) / 6);
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h`;
    return `${b} blk`;
}

interface Props {
    stats: ProtocolStats;
    position: UserPosition;
    raffle: RaffleInfo;
    loading: boolean;
    deployed: boolean;
}

export function TopBar({ stats, position, raffle, loading, deployed }: Props) {
    const { walletAddress } = useWalletConnect();
    const connected = !!walletAddress;

    const jackpot = deployed ? satsToBtc(stats.prizePool) : '—';
    const drawCountdown = raffle.drawBlock > 0n ? blocksToLabel(raffle.drawBlock) : '—';
    const tickets = deployed && connected ? Number(position.tickets).toLocaleString() : '—';

    return (
        <header style={{
            position: 'sticky',
            top: 0,
            zIndex: 500,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 28px',
            height: 52,
            background: 'rgba(5, 7, 11, 0.92)',
            borderBottom: '1px solid rgba(0, 210, 255, 0.1)',
            backdropFilter: 'blur(12px)',
            gap: 16,
        }}>
            {/* Left: Logo */}
            <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                letterSpacing: '0.18em',
                color: 'rgba(61, 235, 255, 0.45)',
                whiteSpace: 'nowrap',
                flexShrink: 0,
            }}>
                DIAMOND DISTRICT
            </span>

            {/* Center: Mini metrics */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                flex: 1,
                justifyContent: 'center',
                flexWrap: 'wrap',
            }}>
                <MetricPill
                    label="JACKPOT"
                    value={`${jackpot} BTC`}
                    valueColor="var(--gold)"
                    loading={loading}
                />
                <Sep />
                <MetricPill
                    label="NEXT DRAW"
                    value={drawCountdown}
                    valueColor="rgba(255,255,255,0.7)"
                />
                <Sep />
                <MetricPill
                    label="YOUR TICKETS"
                    value={tickets}
                    valueColor="var(--cyan)"
                />
            </div>

            {/* Right: Network badge + wallet */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                <span style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 9,
                    letterSpacing: '0.14em',
                    color: 'rgba(139, 92, 246, 0.8)',
                    background: 'rgba(139, 92, 246, 0.1)',
                    border: '1px solid rgba(139, 92, 246, 0.3)',
                    borderRadius: 4,
                    padding: '2px 8px',
                }}>
                    TESTNET
                </span>
                <WalletConnect onStatusChange={() => {}} />
            </div>
        </header>
    );
}

function Sep() {
    return (
        <div style={{
            width: 1,
            height: 16,
            background: 'rgba(0, 210, 255, 0.12)',
            margin: '0 8px',
        }} />
    );
}

function MetricPill({ label, value, valueColor, loading }: {
    label: string;
    value: string;
    valueColor: string;
    loading?: boolean;
}) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 9,
                letterSpacing: '0.12em',
                color: 'rgba(61, 235, 255, 0.35)',
            }}>
                {label}:
            </span>
            <span style={{
                fontFamily: 'var(--font-digit)',
                fontSize: 11,
                color: loading ? 'rgba(255,255,255,0.3)' : valueColor,
                letterSpacing: '0.06em',
            }}>
                {loading ? '···' : value}
            </span>
        </div>
    );
}
