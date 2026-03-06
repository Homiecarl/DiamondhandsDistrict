import { useState, useEffect, useRef } from 'react';
import { type ProtocolStats } from '../services/ContractService';
import { SAT_PER_BTC } from '../config/contracts';

interface FeedEvent {
    id: number;
    type: 'whale' | 'tx' | 'jackpot' | 'info';
    icon: string;
    message: string;
    time: string;
    color: string;
}

let _counter = 0;
function makeEvent(partial: Omit<FeedEvent, 'id'>): FeedEvent {
    return { ...partial, id: ++_counter };
}

const IDLE_EVENT = makeEvent({
    type: 'info',
    icon: '👁',
    message: 'District is watching the block stream...',
    time: 'live',
    color: 'rgba(61,235,255,0.35)',
});

interface Props {
    stats: ProtocolStats;
    lastTxId: string | null;
    deployed: boolean;
}

export function ActivityFeed({ stats, lastTxId, deployed }: Props) {
    const [events, setEvents] = useState<FeedEvent[]>([IDLE_EVENT]);
    const prevStaked = useRef<bigint>(0n);
    const prevPool   = useRef<bigint>(0n);

    // Detect TVL changes between polls → whale alerts
    useEffect(() => {
        if (!deployed || stats.totalStaked === 0n) return;

        const prev = prevStaked.current;
        const curr = stats.totalStaked;

        if (prev > 0n && curr > prev) {
            const delta = curr - prev;
            const btc = Number(delta) / Number(SAT_PER_BTC);

            if (btc >= 0.01) {
                const label = btc >= 0.5 ? '🐋 WHALE ALERT' : btc >= 0.1 ? '🦈 Large Deposit' : '₿ Deposit';
                addEvent(makeEvent({
                    type:    'whale',
                    icon:    btc >= 0.5 ? '🐋' : '🦈',
                    message: `${label}: +${btc.toFixed(4)} BTC added to the vault`,
                    time:    'just now',
                    color:   'var(--gold)',
                }));
            }
        }

        prevStaked.current = curr;
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [stats.totalStaked]);

    // Detect prize pool growth
    useEffect(() => {
        if (!deployed || stats.prizePool === 0n) return;
        const prev = prevPool.current;
        const curr = stats.prizePool;

        if (prev > 0n && curr > prev) {
            const delta = curr - prev;
            const btc = Number(delta) / Number(SAT_PER_BTC);
            if (btc >= 0.0001) {
                addEvent(makeEvent({
                    type:    'jackpot',
                    icon:    '💎',
                    message: `Jackpot growing: +${btc.toFixed(6)} BTC added to prize pool`,
                    time:    'just now',
                    color:   'var(--gold)',
                }));
            }
        }
        prevPool.current = curr;
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [stats.prizePool]);

    // User TX
    useEffect(() => {
        if (!lastTxId) return;
        addEvent(makeEvent({
            type:    'tx',
            icon:    '✅',
            message: `Your TX broadcast: ${lastTxId.slice(0, 14)}…`,
            time:    'just now',
            color:   '#4ade80',
        }));
    }, [lastTxId]);

    function addEvent(ev: FeedEvent) {
        setEvents(prev => {
            const filtered = prev.filter(e => e.id !== IDLE_EVENT.id);
            return [ev, ...filtered].slice(0, 8);
        });
    }

    return (
        <div className="card" style={{ padding: '16px 20px' }}>
            {/* Header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 12,
            }}>
                <div className="label-sm" style={{ marginBottom: 0 }}>DISTRICT ACTIVITY</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{
                        width: 6, height: 6, borderRadius: '50%',
                        background: '#4ade80',
                        animation: 'liveRing 2s ease-in-out infinite',
                    }} />
                    <span style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 9,
                        letterSpacing: '0.12em',
                        color: '#4ade80',
                    }}>LIVE</span>
                </div>
            </div>

            {/* Feed */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {events.map(ev => (
                    <div key={ev.id} className="activity-item">
                        <span style={{ fontSize: 14, flexShrink: 0, lineHeight: 1 }}>{ev.icon}</span>
                        <div style={{ flex: 1 }}>
                            <span style={{ color: ev.color }}>{ev.message}</span>
                        </div>
                        <span style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: 9,
                            color: 'rgba(255,255,255,0.2)',
                            flexShrink: 0,
                            paddingTop: 1,
                        }}>
                            {ev.time}
                        </span>
                    </div>
                ))}
            </div>

            {!deployed && (
                <div style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 9,
                    color: 'rgba(61,235,255,0.2)',
                    marginTop: 8,
                }}>
                    Contract deploying to OPNet testnet — activity will appear here
                </div>
            )}
        </div>
    );
}
