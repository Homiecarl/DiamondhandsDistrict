import { useWalletConnect } from '@btc-vision/walletconnect';

function truncate(addr: string): string {
    if (addr.length <= 14) return addr;
    return `${addr.slice(0, 7)}…${addr.slice(-5)}`;
}

function formatSats(sats: number | undefined): string {
    if (!sats) return '0 sats';
    if (sats >= 100_000_000) return `${(sats / 100_000_000).toFixed(4)} BTC`;
    return `${sats.toLocaleString()} sats`;
}

interface WalletConnectProps {
    onStatusChange?: (msg: string) => void;
}

export function WalletConnect({ onStatusChange }: WalletConnectProps) {
    const {
        openConnectModal,
        disconnect,
        walletAddress,
        walletBalance,
        connecting,
        network,
    } = useWalletConnect();

    const handleConnect = () => {
        onStatusChange?.('Connecting to wallet…');
        openConnectModal();
    };

    const handleDisconnect = () => {
        disconnect();
        onStatusChange?.('Wallet disconnected.');
    };

    if (connecting) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span
                    className="term term-dim"
                    style={{ fontSize: 11, letterSpacing: '0.12em' }}
                >
                    CONNECTING<span className="blink">_</span>
                </span>
            </div>
        );
    }

    if (walletAddress) {
        const netLabel = network?.network === 'bitcoin' ? 'MAINNET'
            : network?.network === 'regtest' ? 'REGTEST'
            : network?.network?.toUpperCase() ?? 'NET';

        return (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {/* Network badge */}
                <span style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 10,
                    letterSpacing: '0.15em',
                    color: 'var(--blue)',
                    background: 'rgba(0,200,255,0.08)',
                    border: '1px solid rgba(0,200,255,0.25)',
                    padding: '2px 8px',
                }}>
                    {netLabel}
                </span>

                {/* Balance */}
                <span style={{
                    fontFamily: 'var(--font-digit)',
                    fontSize: 12,
                    color: 'var(--blue)',
                    letterSpacing: '0.08em',
                    textShadow: '0 0 8px var(--blue-glow)',
                }}>
                    {formatSats(walletBalance?.total)}
                </span>

                {/* Address */}
                <span
                    className="term"
                    style={{ fontSize: 11, letterSpacing: '0.05em', cursor: 'pointer' }}
                    onClick={handleDisconnect}
                    title={`${walletAddress}\nClick to disconnect`}
                >
                    {truncate(walletAddress)}
                </span>

                {/* Disconnect dot */}
                <button
                    onClick={handleDisconnect}
                    title="Disconnect"
                    style={{
                        background: 'none',
                        border: '1px solid rgba(0,200,255,0.3)',
                        borderRadius: 0,
                        cursor: 'pointer',
                        padding: '3px 7px',
                        fontFamily: 'var(--font-mono)',
                        fontSize: 10,
                        color: 'rgba(0,200,255,0.5)',
                        letterSpacing: '0.1em',
                        transition: 'color 0.2s, border-color 0.2s',
                    }}
                    onMouseEnter={e => {
                        (e.currentTarget as HTMLButtonElement).style.color = 'var(--blue)';
                        (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--blue)';
                    }}
                    onMouseLeave={e => {
                        (e.currentTarget as HTMLButtonElement).style.color = 'rgba(0,200,255,0.5)';
                        (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(0,200,255,0.3)';
                    }}
                >
                    ✕
                </button>
            </div>
        );
    }

    return (
        <button className="btn-jack" style={{ fontSize: 12, padding: '8px 20px' }} onClick={handleConnect}>
            JACK IN
        </button>
    );
}
