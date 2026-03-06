import { type ProtocolStats, type RaffleInfo } from '../services/ContractService';

interface Props {
    stats: ProtocolStats;
    raffle: RaffleInfo;
    vaultMotoBalance: bigint;
}

function fmtMoto(raw: bigint): string {
    const val = Number(raw) / 1e18;
    if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M MOTO`;
    if (val >= 1_000) return `${(val / 1_000).toFixed(0)}K MOTO`;
    return `${val.toFixed(0)} MOTO`;
}

function fmtRate(motoPerBlock: bigint): string {
    const n = Number(motoPerBlock);
    if (n >= 1e15) return `${(n / 1e15).toFixed(0)}P/blk`;
    if (n >= 1e12) return `${(n / 1e12).toFixed(0)}T/blk`;
    if (n >= 1e9) return `${(n / 1e9).toFixed(0)}G/blk`;
    if (n >= 1e6) return `${(n / 1e6).toFixed(0)}M/blk`;
    if (n >= 1e3) return `${(n / 1e3).toFixed(0)}K/blk`;
    return `${n}/blk`;
}

interface Indicator {
    label: string;
    value: string;
    ok: boolean;
    warn: boolean;
}

export function VaultHealthPanel({ stats, raffle, vaultMotoBalance }: Props) {
    const indicators: Indicator[] = [
        {
            label: 'VAULT FUNDED',
            value: vaultMotoBalance > 0n ? fmtMoto(vaultMotoBalance) : '0 MOTO',
            ok: vaultMotoBalance > 0n,
            warn: false,
        },
        {
            label: 'YIELD ACTIVE',
            value: stats.motoPerBlock > 0n ? fmtRate(stats.motoPerBlock) : 'INACTIVE',
            ok: stats.motoPerBlock > 0n,
            warn: false,
        },
        {
            label: 'RAFFLE OPEN',
            value: stats.currentRaffleId === 0n
                ? 'NONE'
                : raffle.state === 0
                ? `#${stats.currentRaffleId}`
                : raffle.state === 1
                ? 'CLOSED'
                : 'DRAWN',
            ok: raffle.state === 0 && stats.currentRaffleId > 0n,
            warn: raffle.state === 1,
        },
    ];

    return (
        <div style={{
            display: 'flex',
            gap: 0,
            padding: '10px 16px',
            background: 'rgba(3,12,21,0.7)',
            border: '1px solid rgba(0,200,255,0.08)',
            borderRadius: 10,
            backdropFilter: 'blur(4px)',
            flexWrap: 'wrap',
        }}>
            {indicators.map((ind, i) => {
                const dotColor = ind.ok
                    ? '#4ade80'
                    : ind.warn
                    ? '#f5c84c'
                    : '#ef4444';
                return (
                    <div key={i} style={{
                        flex: '1 1 140px',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 8,
                        padding: i > 0 ? '0 0 0 20px' : '0 20px 0 0',
                        borderLeft: i > 0 ? '1px solid rgba(0,200,255,0.08)' : undefined,
                    }}>
                        <span style={{
                            width: 7,
                            height: 7,
                            borderRadius: '50%',
                            background: dotColor,
                            boxShadow: `0 0 6px ${dotColor}`,
                            flexShrink: 0,
                            marginTop: 3,
                        }} />
                        <div>
                            <div style={{
                                fontFamily: 'var(--font-mono)',
                                fontSize: 9,
                                letterSpacing: '0.12em',
                                color: 'rgba(61,235,255,0.4)',
                                marginBottom: 3,
                            }}>
                                {ind.label}
                            </div>
                            <div style={{
                                fontFamily: 'var(--font-digit)',
                                fontSize: 12,
                                color: ind.ok
                                    ? 'rgba(255,255,255,0.8)'
                                    : ind.warn
                                    ? '#f5c84c'
                                    : 'rgba(255,100,100,0.7)',
                                letterSpacing: '0.04em',
                            }}>
                                {ind.value}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
