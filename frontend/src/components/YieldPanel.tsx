import { useWalletConnect } from '@btc-vision/walletconnect';
import { type UserPosition } from '../services/ContractService';

const B = '#00c8ff';
const DIM = 'rgba(0,200,255,0.45)';
const GOLD = '#ffcc00';

interface Props {
    position: UserPosition;
    txPending: boolean;
    deployed: boolean;
    onClaim: () => Promise<void>;
}

export function YieldPanel({ position, txPending, deployed, onClaim }: Props) {
    const { walletAddress } = useWalletConnect();
    const connected = !!walletAddress;

    const hasPending = deployed && position.pendingMoto > 0n;
    const pendingMotoStr = deployed
        ? (Number(position.pendingMoto) / 1e8).toFixed(4)
        : '—';

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
                [ YIELD ]
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 14 }}>
                <div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: DIM, marginBottom: 4 }}>
                        PENDING MOTO
                    </div>
                    <div style={{
                        fontFamily: 'var(--font-digit)',
                        fontSize: 24,
                        color: hasPending ? GOLD : B,
                        textShadow: hasPending
                            ? '0 0 14px rgba(255,204,0,0.6)'
                            : '0 0 10px rgba(0,200,255,0.4)',
                        letterSpacing: '0.1em',
                    }}>
                        {pendingMotoStr}
                    </div>
                </div>

                <button
                    onClick={onClaim}
                    disabled={!connected || !hasPending || txPending}
                    style={{
                        background: hasPending && connected
                            ? 'rgba(255,204,0,0.12)'
                            : 'rgba(0,200,255,0.06)',
                        border: `1px solid ${hasPending && connected ? 'rgba(255,204,0,0.4)' : 'rgba(0,200,255,0.2)'}`,
                        borderRadius: 3,
                        color: hasPending && connected ? GOLD : DIM,
                        fontFamily: 'var(--font-mono)',
                        fontSize: 11,
                        letterSpacing: '0.14em',
                        padding: '10px 18px',
                        cursor: !connected || !hasPending || txPending ? 'not-allowed' : 'pointer',
                        transition: 'all 0.15s',
                    }}
                >
                    {txPending ? '...' : 'CLAIM'}
                </button>
            </div>

            {deployed && (
                <div style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 10,
                    color: DIM,
                }}>
                    Raffle #{position.raffleId.toString()} · Tickets: {position.tickets.toString()}
                </div>
            )}
        </div>
    );
}
