import { useState } from 'react';

const SEGMENTS = [
    { label: '33%',  pct: 28.1, color: '#F5C84C', desc: 'release 33% of prize pool' },
    { label: '50%',  pct: 42.0, color: '#3DEBFF', desc: 'release 50% of prize pool' },
    { label: '75%',  pct: 23.0, color: '#8B5CF6', desc: 'release 75% of prize pool' },
    { label: '100%', pct: 6.9,  color: '#ff6b6b', desc: 'release full prize pool!' },
];

// Build conic gradient string
function buildConic(): string {
    let acc = 0;
    return SEGMENTS.map(s => {
        const from = acc;
        acc += s.pct;
        return `${s.color} ${from.toFixed(2)}% ${acc.toFixed(2)}%`;
    }).join(', ');
}

const CONIC = buildConic();

// Mock last draw data (replace with real data when available)
const LAST_DRAW = {
    raffleId: '—',
    outcome: '—',
    released: '—',
    vrfProof: null as string | null,
};

export function WheelPanel() {
    const [spinning, setSpinning] = useState(false);

    function handleSpin() {
        setSpinning(true);
        setTimeout(() => setSpinning(false), 2000);
    }

    return (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="label-sm" style={{ marginBottom: 0 }}>PRIZE WHEEL</div>
                <div style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 10,
                    color: 'rgba(61, 235, 255, 0.4)',
                }}>
                    Provably Fair VRF
                </div>
            </div>

            <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
                {/* Wheel visual */}
                <div style={{ position: 'relative', flexShrink: 0 }}>
                    <div
                        onClick={handleSpin}
                        title="Click to preview spin"
                        style={{
                            width: 140,
                            height: 140,
                            borderRadius: '50%',
                            background: `conic-gradient(${CONIC})`,
                            boxShadow: '0 0 32px rgba(0,0,0,0.6), 0 0 0 2px rgba(0,210,255,0.12)',
                            animation: spinning ? 'wheelSpin 2s cubic-bezier(0.2,0,0.4,1) forwards' : 'none',
                            cursor: 'pointer',
                            position: 'relative',
                        }}
                    >
                        {/* Center hole */}
                        <div style={{
                            position: 'absolute',
                            top: '50%', left: '50%',
                            transform: 'translate(-50%, -50%)',
                            width: 44, height: 44,
                            borderRadius: '50%',
                            background: 'var(--bg-card)',
                            border: '1px solid rgba(0,210,255,0.15)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}>
                            <span style={{
                                fontFamily: 'var(--font-digit)',
                                fontSize: 8,
                                color: 'var(--cyan)',
                                letterSpacing: '0.1em',
                            }}>VRF</span>
                        </div>
                    </div>
                    {/* Pointer */}
                    <div style={{
                        position: 'absolute',
                        top: -8, left: '50%',
                        transform: 'translateX(-50%)',
                        width: 0, height: 0,
                        borderLeft: '6px solid transparent',
                        borderRight: '6px solid transparent',
                        borderTop: '12px solid rgba(255,255,255,0.7)',
                    }} />
                </div>

                {/* Probability table */}
                <div style={{ flex: 1, minWidth: 140 }}>
                    <div className="label-sm" style={{ marginBottom: 10 }}>OUTCOMES</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                        {SEGMENTS.map(s => (
                            <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <div style={{
                                    width: 10, height: 10,
                                    borderRadius: 2,
                                    background: s.color,
                                    flexShrink: 0,
                                    boxShadow: `0 0 6px ${s.color}60`,
                                }} />
                                <span style={{
                                    fontFamily: 'var(--font-digit)',
                                    fontSize: 13,
                                    color: s.color,
                                    minWidth: 40,
                                }}>
                                    {s.label}
                                </span>
                                <span style={{
                                    fontFamily: 'var(--font-mono)',
                                    fontSize: 10,
                                    color: 'rgba(255,255,255,0.45)',
                                    flex: 1,
                                }}>
                                    {s.pct}% chance
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Divider */}
            <div style={{ borderTop: '1px solid rgba(0,210,255,0.08)' }} />

            {/* Last draw outcome */}
            <div>
                <div className="label-sm" style={{ marginBottom: 10 }}>LAST DRAW OUTCOME</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <div style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: 10,
                            color: 'rgba(61,235,255,0.35)',
                            marginBottom: 3,
                        }}>RAFFLE</div>
                        <div style={{ fontFamily: 'var(--font-digit)', fontSize: 14, color: 'var(--cyan)' }}>
                            #{LAST_DRAW.raffleId}
                        </div>
                    </div>
                    <div>
                        <div style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: 10,
                            color: 'rgba(61,235,255,0.35)',
                            marginBottom: 3,
                        }}>WHEEL</div>
                        <div style={{ fontFamily: 'var(--font-digit)', fontSize: 14, color: 'var(--gold)' }}>
                            {LAST_DRAW.outcome}
                        </div>
                    </div>
                    <div>
                        <div style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: 10,
                            color: 'rgba(61,235,255,0.35)',
                            marginBottom: 3,
                        }}>RELEASED</div>
                        <div style={{ fontFamily: 'var(--font-digit)', fontSize: 14, color: 'var(--gold)' }}>
                            {LAST_DRAW.released}
                        </div>
                    </div>
                </div>

                {LAST_DRAW.vrfProof ? (
                    <a
                        href={LAST_DRAW.vrfProof}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                            display: 'inline-block',
                            marginTop: 12,
                            fontFamily: 'var(--font-mono)',
                            fontSize: 10,
                            color: 'var(--purple)',
                            textDecoration: 'none',
                            borderBottom: '1px solid rgba(139,92,246,0.3)',
                        }}
                    >
                        View VRF Proof →
                    </a>
                ) : (
                    <div style={{
                        marginTop: 10,
                        fontFamily: 'var(--font-mono)',
                        fontSize: 10,
                        color: 'rgba(61,235,255,0.25)',
                    }}>
                        VRF proof available after first draw
                    </div>
                )}
            </div>
        </div>
    );
}
