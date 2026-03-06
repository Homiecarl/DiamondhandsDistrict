import { useState } from 'react';
import { useWalletConnect } from '@btc-vision/walletconnect';
import { type UserPosition } from '../services/ContractService';
import { SAT_PER_BTC, FEE_BPS, FEE_DENOM } from '../config/contracts';

const ERR = '#ff4466';

function satsToBtc(sats: bigint): string {
    return (Number(sats) / Number(SAT_PER_BTC)).toFixed(8);
}

function btcToSats(btc: string): bigint {
    try {
        const n = parseFloat(btc);
        if (isNaN(n) || n <= 0) return 0n;
        return BigInt(Math.round(n * 1e8));
    } catch {
        return 0n;
    }
}

function calcFee(amountSats: bigint): bigint {
    return (amountSats * BigInt(FEE_BPS)) / BigInt(FEE_DENOM);
}


interface Props {
    position: UserPosition;
    txPending: boolean;
    deployed: boolean;
    error: string | null;
    onDeposit: (sats: bigint) => Promise<unknown>;
    onWithdraw: (sats: bigint) => Promise<unknown>;
}

export function StakePanel({ position, txPending, deployed, error, onDeposit, onWithdraw }: Props) {
    const { walletAddress } = useWalletConnect();
    const connected = !!walletAddress;

    const [depositInput, setDepositInput] = useState('');
    const [withdrawInput, setWithdrawInput] = useState('');
    const [actionError, setActionError] = useState<string | null>(null);

    const depositSats = btcToSats(depositInput);
    const depositFee = depositSats > 0n ? calcFee(depositSats) : 0n;
    const depositNet = depositSats - depositFee;

    const withdrawSats = btcToSats(withdrawInput);

    const isEligible = deployed && position.entryBlock > 0n;
    const hasStake = position.stake > 0n;

    async function handleDeposit() {
        if (depositSats <= 0n) return;
        setActionError(null);
        try {
            await onDeposit(depositSats);
            setDepositInput('');
        } catch (e: unknown) {
            setActionError(e instanceof Error ? e.message : String(e));
        }
    }

    async function handleWithdraw() {
        if (withdrawSats <= 0n) return;
        if (withdrawSats > position.stake) {
            setActionError('Amount exceeds your stake');
            return;
        }
        setActionError(null);
        try {
            await onWithdraw(withdrawSats);
            setWithdrawInput('');
        } catch (e: unknown) {
            setActionError(e instanceof Error ? e.message : String(e));
        }
    }

    const displayError = actionError ?? error;

    const inputStyle: React.CSSProperties = {
        flex: 1,
        background: '#0d1a28',
        border: '1px solid rgba(0,210,255,0.12)',
        borderRadius: 8,
        color: '#fff',
        fontFamily: 'var(--font-digit)',
        fontSize: 13,
        padding: '9px 12px',
        outline: 'none',
    };

    return (
        <div className="card">
            <div className="label-sm">YOUR VAULT</div>

            {/* Staked amount */}
            <div style={{ marginBottom: 16 }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'rgba(245,200,76,0.45)', marginBottom: 4 }}>
                    STAKED BTC
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                    <span className="num-gold" style={{ fontSize: 32 }}>
                        {deployed ? satsToBtc(position.stake).replace(/\.?0+$/, '') || '0' : '—'}
                    </span>
                    {deployed && (
                        <span style={{ fontFamily: 'var(--font-digit)', fontSize: 14, color: 'var(--gold-dim)' }}>BTC</span>
                    )}
                </div>

                {/* Eligibility status */}
                {deployed && (
                    <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{
                            width: 6, height: 6, borderRadius: '50%',
                            background: isEligible ? '#4ade80' : 'var(--gold)',
                            boxShadow: isEligible ? '0 0 8px #4ade8080' : '0 0 8px var(--gold-glow)',
                        }} />
                        <span style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: 10,
                            color: isEligible ? '#4ade80' : 'var(--gold)',
                        }}>
                            {isEligible ? 'ELIGIBLE FOR DRAW' : hasStake ? 'QUEUED — ENTERING NEXT WINDOW' : 'NO STAKE'}
                        </span>
                    </div>
                )}

                {/* Tickets info */}
                {deployed && position.tickets > 0n && (
                    <div style={{
                        marginTop: 6,
                        fontFamily: 'var(--font-mono)',
                        fontSize: 10,
                        color: 'var(--cyan)',
                    }}>
                        {position.tickets.toString()} tickets
                        <span style={{ color: 'rgba(61,235,255,0.3)', fontSize: 9, marginLeft: 6 }}>
                            (tickets = √BTC × time)
                        </span>
                    </div>
                )}
            </div>

            <div style={{ borderTop: '1px solid rgba(0,210,255,0.08)', marginBottom: 16 }} />

            {/* Deposit */}
            <div style={{ marginBottom: 14 }}>
                <div className="label-sm" style={{ marginBottom: 8 }}>DEPOSIT (BTC)</div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <input
                        type="number"
                        step="0.00001"
                        min="0"
                        placeholder="0.00000000"
                        value={depositInput}
                        onChange={e => setDepositInput(e.target.value)}
                        disabled={!connected || !deployed || txPending}
                        style={inputStyle}
                    />
                    <button
                        className="btn-cyan"
                        onClick={handleDeposit}
                        disabled={!connected || !deployed || txPending || depositSats <= 0n}
                    >
                        {txPending ? '···' : 'LOCK'}
                    </button>
                </div>
                {depositSats > 0n && (
                    <div style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 9,
                        color: 'rgba(61,235,255,0.3)',
                        marginTop: 5,
                    }}>
                        Fee: {satsToBtc(depositFee)} BTC · Net: {satsToBtc(depositNet)} BTC
                    </div>
                )}
            </div>

            {/* Withdraw */}
            <div>
                <div className="label-sm" style={{ marginBottom: 8 }}>WITHDRAW (BTC)</div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <input
                        type="number"
                        step="0.00001"
                        min="0"
                        placeholder="0.00000000"
                        value={withdrawInput}
                        onChange={e => setWithdrawInput(e.target.value)}
                        disabled={!connected || !deployed || txPending}
                        style={inputStyle}
                    />
                    <button
                        className="btn-gold"
                        onClick={handleWithdraw}
                        disabled={!connected || !deployed || txPending || withdrawSats <= 0n}
                    >
                        {txPending ? '···' : 'UNLOCK'}
                    </button>
                </div>
            </div>

            {displayError && (
                <div style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 10,
                    color: ERR,
                    marginTop: 12,
                    wordBreak: 'break-word',
                    lineHeight: 1.5,
                }}>
                    ⚠ {displayError}
                </div>
            )}

            {!connected && (
                <div style={{
                    marginTop: 14,
                    fontFamily: 'var(--font-mono)',
                    fontSize: 10,
                    color: 'rgba(61,235,255,0.25)',
                    textAlign: 'center',
                }}>
                    Connect wallet to stake BTC
                </div>
            )}
        </div>
    );
}
