const MOCK_DRAW = {
    raffleId: '—',
    poolBefore: '—',
    poolAfter: '—',
    wheelOutcome: '—',
    released: '—',
    winnersPayout: '—',
    recycled: '9% → prize pool',
    nftTreasury: '1% → NFT fund',
    vrfProof: null as string | null,
};

const MOCK_WINNERS: Array<{
    rank: number;
    payout: string;
    address: string;
    txId: string | null;
}> = [];

export function HistoryPanel() {
    const hasData = MOCK_DRAW.raffleId !== '—';
    const hasWinners = MOCK_WINNERS.length > 0;

    return (
        <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: 16,
        }}>
            {/* Last Draw Summary */}
            <div className="card">
                <div className="label-sm" style={{ marginBottom: 16 }}>LAST DRAW SUMMARY</div>

                {!hasData ? (
                    <EmptyState label="No draws completed yet. First draw after raffle closes." />
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <DrawRow label="Raffle" value={`#${MOCK_DRAW.raffleId}`} />
                        <DrawRow label="Pool Before" value={`${MOCK_DRAW.poolBefore} BTC`} valueColor="var(--gold)" />
                        <DrawRow label="Pool After" value={`${MOCK_DRAW.poolAfter} BTC`} valueColor="var(--gold)" />
                        <DrawRow label="Wheel Outcome" value={MOCK_DRAW.wheelOutcome} valueColor="var(--cyan)" />
                        <DrawRow label="Released" value={`${MOCK_DRAW.released} BTC`} valueColor="var(--gold)" />

                        <div style={{ borderTop: '1px solid rgba(0,210,255,0.08)', margin: '4px 0' }} />

                        <DrawRow label="Winners Payout" value={`${MOCK_DRAW.winnersPayout} BTC`} />
                        <DrawRow label="Recycled" value={MOCK_DRAW.recycled} />
                        <DrawRow label="NFT Treasury" value={MOCK_DRAW.nftTreasury} />

                        {MOCK_DRAW.vrfProof && (
                            <a
                                href={MOCK_DRAW.vrfProof}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                    marginTop: 8,
                                    display: 'inline-block',
                                    fontFamily: 'var(--font-mono)',
                                    fontSize: 10,
                                    color: 'var(--purple)',
                                    textDecoration: 'none',
                                    borderBottom: '1px solid rgba(139,92,246,0.3)',
                                }}
                            >
                                View VRF Proof →
                            </a>
                        )}
                    </div>
                )}
            </div>

            {/* Recent Winners */}
            <div className="card">
                <div className="label-sm" style={{ marginBottom: 16 }}>RECENT WINNERS</div>

                {!hasWinners ? (
                    <EmptyState label="No winners yet. First draw coming after jackpot accumulates." />
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {/* Header row */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: '28px 1fr 80px',
                            gap: 12,
                            marginBottom: 4,
                        }}>
                            {['#', 'ADDRESS', 'PAYOUT'].map(h => (
                                <span key={h} style={{
                                    fontFamily: 'var(--font-mono)',
                                    fontSize: 9,
                                    letterSpacing: '0.12em',
                                    color: 'rgba(61,235,255,0.3)',
                                }}>
                                    {h}
                                </span>
                            ))}
                        </div>

                        {MOCK_WINNERS.map(w => (
                            <div key={w.rank} style={{
                                display: 'grid',
                                gridTemplateColumns: '28px 1fr 80px',
                                gap: 12,
                                alignItems: 'center',
                                padding: '7px 0',
                                borderTop: '1px solid rgba(0,210,255,0.06)',
                            }}>
                                <span style={{
                                    fontFamily: 'var(--font-digit)',
                                    fontSize: 11,
                                    color: w.rank === 1 ? 'var(--gold)' : 'rgba(255,255,255,0.4)',
                                }}>
                                    {w.rank}
                                </span>
                                <span style={{
                                    fontFamily: 'var(--font-mono)',
                                    fontSize: 10,
                                    color: 'rgba(61,235,255,0.6)',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                }}>
                                    {w.address.length > 16
                                        ? `${w.address.slice(0, 8)}…${w.address.slice(-6)}`
                                        : w.address}
                                </span>
                                <span style={{
                                    fontFamily: 'var(--font-digit)',
                                    fontSize: 11,
                                    color: 'var(--gold)',
                                    textAlign: 'right',
                                }}>
                                    {w.payout} BTC
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function DrawRow({ label, value, valueColor = 'rgba(255,255,255,0.6)' }: {
    label: string;
    value: string;
    valueColor?: string;
}) {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
            <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                color: 'rgba(61,235,255,0.35)',
            }}>
                {label}
            </span>
            <span style={{
                fontFamily: 'var(--font-digit)',
                fontSize: 11,
                color: valueColor,
            }}>
                {value}
            </span>
        </div>
    );
}

function EmptyState({ label }: { label: string }) {
    return (
        <div style={{
            textAlign: 'center',
            padding: '28px 0',
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            color: 'rgba(61,235,255,0.22)',
            lineHeight: 1.7,
        }}>
            {label}
        </div>
    );
}
