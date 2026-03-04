import { useState } from 'react';
import { useWalletConnect } from '@btc-vision/walletconnect';
import { type UserPosition } from '../services/ContractService';
import { SAT_PER_BTC, FEE_BPS, FEE_DENOM } from '../config/contracts';

const B = '#00c8ff';
const DIM = 'rgba(0,200,255,0.45)';
const ERR = '#ff4466';

function satsToBtc(sats: bigint): string {
    return (Number(sats) / Number(SAT_PER_BTC)).toFixed(6);
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
    onDeposit: (sats: bigint) => Promise<void>;
    onWithdraw: (sats: bigint) => Promise<void>;
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
                [ STAKE ]
            </div>

            {/* Current stake */}
            <div style={{ marginBottom: 16 }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: DIM, marginBottom: 4 }}>
                    YOUR STAKE
                </div>
                <div style={{
                    fontFamily: 'var(--font-digit)',
                    fontSize: 22,
                    color: B,
                    textShadow: `0 0 12px rgba(0,200,255,0.5)`,
                    letterSpacing: '0.1em',
                }}>
                    {deployed ? satsToBtc(position.stake) : '—'} <span style={{ fontSize: 12, color: DIM }}>BTC</span>
                </div>
            </div>

            {/* Deposit */}
            <div style={{ marginBottom: 12 }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: DIM, marginBottom: 6 }}>
                    DEPOSIT (BTC)
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <input
                        type="number"
                        step="0.00001"
                        min="0"
                        placeholder="0.00000000"
                        value={depositInput}
                        onChange={e => setDepositInput(e.target.value)}
                        disabled={!connected || !deployed || txPending}
                        style={{
                            flex: 1,
                            background: 'rgba(0,200,255,0.05)',
                            border: '1px solid rgba(0,200,255,0.2)',
                            borderRadius: 3,
                            color: B,
                            fontFamily: 'var(--font-digit)',
                            fontSize: 13,
                            padding: '7px 10px',
                            outline: 'none',
                        }}
                    />
                    <button
                        onClick={handleDeposit}
                        disabled={!connected || !deployed || txPending || depositSats <= 0n}
                        style={btnStyle(!connected || !deployed || txPending || depositSats <= 0n)}
                    >
                        {txPending ? '...' : 'LOCK'}
                    </button>
                </div>
                {depositSats > 0n && (
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: DIM, marginTop: 4 }}>
                        Fee: {satsToBtc(depositFee)} BTC · Net: {satsToBtc(depositNet)} BTC
                    </div>
                )}
            </div>

            {/* Withdraw */}
            <div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: DIM, marginBottom: 6 }}>
                    WITHDRAW (BTC)
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <input
                        type="number"
                        step="0.00001"
                        min="0"
                        placeholder="0.00000000"
                        value={withdrawInput}
                        onChange={e => setWithdrawInput(e.target.value)}
                        disabled={!connected || !deployed || txPending}
                        style={{
                            flex: 1,
                            background: 'rgba(0,200,255,0.05)',
                            border: '1px solid rgba(0,200,255,0.2)',
                            borderRadius: 3,
                            color: B,
                            fontFamily: 'var(--font-digit)',
                            fontSize: 13,
                            padding: '7px 10px',
                            outline: 'none',
                        }}
                    />
                    <button
                        onClick={handleWithdraw}
                        disabled={!connected || !deployed || txPending || withdrawSats <= 0n}
                        style={btnStyle(!connected || !deployed || txPending || withdrawSats <= 0n)}
                    >
                        {txPending ? '...' : 'UNLOCK'}
                    </button>
                </div>
            </div>

            {displayError && (
                <div style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 10,
                    color: ERR,
                    marginTop: 10,
                    wordBreak: 'break-word',
                }}>
                    ⚠ {displayError}
                </div>
            )}

            {!connected && (
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: DIM, marginTop: 10 }}>
                    Connect wallet to stake
                </div>
            )}
        </div>
    );
}

function btnStyle(disabled: boolean) {
    return {
        background: disabled ? 'rgba(0,200,255,0.06)' : 'rgba(0,200,255,0.12)',
        border: '1px solid rgba(0,200,255,0.3)',
        borderRadius: 3,
        color: disabled ? 'rgba(0,200,255,0.35)' : '#00c8ff',
        fontFamily: 'var(--font-mono)',
        fontSize: 11,
        letterSpacing: '0.12em',
        padding: '7px 14px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all 0.15s',
        whiteSpace: 'nowrap' as const,
    };
}
