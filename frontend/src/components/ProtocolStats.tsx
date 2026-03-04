import { type ProtocolStats } from '../services/ContractService';
import { SAT_PER_BTC } from '../config/contracts';

const DIM = 'rgba(0,200,255,0.45)';
const B = '#00c8ff';

function satsToBtc(sats: bigint): string {
    return (Number(sats) / Number(SAT_PER_BTC)).toFixed(4);
}

interface Props {
    stats: ProtocolStats;
    loading: boolean;
    deployed: boolean;
}

export function ProtocolStats({ stats, loading, deployed }: Props) {
    const items = deployed
        ? [
              { label: 'TVL', value: `${satsToBtc(stats.totalStaked)} BTC` },
              { label: 'PRIZE POOL', value: `${satsToBtc(stats.prizePool)} BTC` },
              { label: 'NFT TREASURY', value: `${satsToBtc(stats.nftTreasury)} BTC` },
              { label: 'RAFFLE', value: `#${stats.currentRaffleId.toString()}` },
              { label: 'MOTO/BLOCK', value: (Number(stats.motoPerBlock) / 1e12).toFixed(4) },
              { label: 'BOOST', value: stats.boostActive ? 'ACTIVE ⚡' : 'INACTIVE' },
          ]
        : [
              { label: 'STATUS', value: 'TESTNET — DEPLOYING' },
              { label: 'NETWORK', value: 'OPNET TESTNET' },
              { label: 'FEE', value: '0.09%' },
              { label: 'YIELD', value: 'MOTO TOKEN' },
              { label: 'DRAW', value: 'EVERY 28 DAYS' },
              { label: 'WINNERS', value: 'UP TO 10' },
          ];

    return (
        <div style={{
            borderTop: '1px solid rgba(0,200,255,0.12)',
            background: 'rgba(0,10,25,0.7)',
            padding: '10px 28px',
            display: 'flex',
            gap: '32px',
            flexWrap: 'wrap',
            alignItems: 'center',
        }}>
            {loading && (
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: DIM }}>
                    syncing...
                </span>
            )}
            {items.map(({ label, value }) => (
                <div key={label} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: DIM, letterSpacing: '0.12em' }}>
                        {label}
                    </span>
                    <span style={{
                        fontFamily: 'var(--font-digit)',
                        fontSize: 11,
                        color: value.includes('ACTIVE') ? '#ffcc00' : B,
                        letterSpacing: '0.08em',
                    }}>
                        {value}
                    </span>
                </div>
            ))}
        </div>
    );
}
