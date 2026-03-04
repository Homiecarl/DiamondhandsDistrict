import React from 'react';

interface HeaderProps {
    connected: boolean;
    address: string;
    balance: bigint;
    onConnect: () => void;
    loading: boolean;
}

function truncate(addr: string): string {
    if (!addr || addr.length < 12) return addr;
    return `${addr.slice(0, 8)}…${addr.slice(-6)}`;
}

function formatBtc(sats: bigint): string {
    const btc = Number(sats) / 1e8;
    return `${btc.toFixed(5)} BTC`;
}

export const Header: React.FC<HeaderProps> = ({
    connected,
    address,
    balance,
    onConnect,
    loading,
}) => {
    return (
        <header
            style={{
                borderBottom: '1px solid rgba(247,147,26,0.2)',
                background: 'rgba(10,10,10,0.95)',
                backdropFilter: 'blur(12px)',
                position: 'sticky',
                top: 0,
                zIndex: 100,
            }}
        >
            <div
                className="container"
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    height: '64px',
                }}
            >
                {/* Logo */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '28px', lineHeight: 1 }}>₿</span>
                    <div>
                        <div
                            style={{
                                fontSize: '18px',
                                fontWeight: 700,
                                color: '#f7931a',
                                letterSpacing: '0.1em',
                            }}
                        >
                            PROOF OF HODL
                        </div>
                        <div style={{ fontSize: '10px', color: '#666', letterSpacing: '0.15em' }}>
                            BITCOIN STAKING PROTOCOL
                        </div>
                    </div>
                </div>

                {/* Right side */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <span className="badge badge-testnet">TESTNET</span>

                    {connected ? (
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                background: 'rgba(247,147,26,0.08)',
                                border: '1px solid rgba(247,147,26,0.25)',
                                borderRadius: '8px',
                                padding: '8px 14px',
                            }}
                        >
                            <span
                                style={{
                                    width: '8px',
                                    height: '8px',
                                    borderRadius: '50%',
                                    background: '#22c55e',
                                    boxShadow: '0 0 8px #22c55e',
                                    flexShrink: 0,
                                }}
                            />
                            <div>
                                <div style={{ fontSize: '12px', color: '#f7931a', fontWeight: 700 }}>
                                    {truncate(address)}
                                </div>
                                <div style={{ fontSize: '11px', color: '#888' }}>
                                    {formatBtc(balance)}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <button
                            className="btn-primary"
                            onClick={onConnect}
                            disabled={loading}
                            style={{ padding: '10px 20px', fontSize: '13px' }}
                        >
                            {loading ? (
                                <>
                                    <span className="spinner" />
                                    CONNECTING…
                                </>
                            ) : (
                                'CONNECT OPWALLET'
                            )}
                        </button>
                    )}
                </div>
            </div>
        </header>
    );
};
