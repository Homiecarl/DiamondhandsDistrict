import { useRaffle } from '../hooks/useRaffle';
import { type ProtocolStats } from '../services/ContractService';
import { BLOCKS_PER_DAY } from '../config/contracts';

const B = '#00c8ff';
const DIM = 'rgba(0,200,255,0.45)';

const STATE_LABELS = ['OPEN', 'CLOSED', 'DRAWN'];

function blocksToTime(blocks: bigint): string {
    const b = Number(blocks);
    if (b <= 0) return 'now';
    const days = Math.floor(b / BLOCKS_PER_DAY);
    const hours = Math.floor((b % BLOCKS_PER_DAY) / 6);
    if (days > 0) return `~${days}d ${hours}h`;
    if (hours > 0) return `~${hours}h`;
    return `~${b} blocks`;
}

interface Props {
    stats: ProtocolStats;
    userTickets: bigint;
}

export function RafflePanel({ stats, userTickets }: Props) {
    const raffleId = stats.currentRaffleId;
    const { raffle } = useRaffle(raffleId);

    const stateLabel = raffleId === 0n ? 'NO RAFFLE YET' : STATE_LABELS[raffle.state] ?? 'UNKNOWN';

    const currentBlock = 0n; // We don't have current block easily — show target blocks
    const blocksToClose = raffle.entryCloseBlock > currentBlock
        ? raffle.entryCloseBlock - currentBlock
        : 0n;
    const drawBlock = raffle.drawBlock;

    const totalTix = raffle.totalTickets;
    const userPct = totalTix > 0n
        ? ((Number(userTickets) / Number(totalTix)) * 100).toFixed(2)
        : '0.00';

    return (
        <div style={{
            border: '1px solid rgba(0,200,255,0.18)',
            borderRadius: 4,
            background: 'rgba(0,10,25,0.85)',
            padding: '20px 22px',
        }}>
            <div style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                letterSpacing: '0.18em',
                color: DIM,
                marginBottom: 14,
            }}>
                [ RAFFLE ]
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: DIM, marginBottom: 4 }}>
                        RAFFLE #{raffleId.toString()}
                    </div>
                    <div style={{
                        fontFamily: 'var(--font-digit)',
                        fontSize: 18,
                        color: raffle.state === 0 ? B : DIM,
                        letterSpacing: '0.1em',
                        marginBottom: 12,
                    }}>
                        {stateLabel}
                    </div>

                    <Row label="PARTICIPANTS" value={raffle.participantCount.toString()} />
                    <Row label="TOTAL TICKETS" value={totalTix.toString()} />
                    {userTickets > 0n && (
                        <Row label="YOUR TICKETS" value={`${userTickets.toString()} (${userPct}%)`} highlight />
                    )}
                </div>

                <div style={{ textAlign: 'right' }}>
                    {raffle.state === 0 && drawBlock > 0n && (
                        <>
                            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: DIM, marginBottom: 4 }}>
                                ENTRIES CLOSE
                            </div>
                            <div style={{ fontFamily: 'var(--font-digit)', fontSize: 13, color: B, marginBottom: 10 }}>
                                {blocksToTime(blocksToClose)}
                            </div>
                            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: DIM, marginBottom: 4 }}>
                                DRAW BLOCK
                            </div>
                            <div style={{ fontFamily: 'var(--font-digit)', fontSize: 13, color: B }}>
                                #{drawBlock.toString()}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
    return (
        <div style={{ display: 'flex', gap: 12, marginBottom: 4 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: DIM, minWidth: 100 }}>
                {label}
            </span>
            <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                color: highlight ? '#00c8ff' : 'rgba(0,200,255,0.7)',
            }}>
                {value}
            </span>
        </div>
    );
}
