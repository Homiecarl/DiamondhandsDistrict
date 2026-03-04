import { useState } from 'react';
import { MatrixRain }      from './components/MatrixRain';
import { ScanLines }       from './components/ScanLines';
import { PerspectiveGrid } from './components/PerspectiveGrid';
import { TerminalBar }     from './components/TerminalBar';
import './styles/globals.css';

export default function App() {
    const [field1, setField1] = useState('');
    const [field2, setField2] = useState('');
    const [status, setStatus] = useState('System initialized. Awaiting input…');

    const handleAction = () => {
        if (!field1 && !field2) return;
        setStatus(`Transfer initiated — ${field1 || 'anonymous'} · ${field2 || 'no node'}`);
    };

    return (
        <div style={{ position: 'relative', minHeight: '100vh', overflow: 'hidden' }}>

            {/* ── Backgrounds ── */}
            <MatrixRain />
            <PerspectiveGrid />
            <ScanLines />

            {/* ── Content ── */}
            <div style={{
                position: 'relative', zIndex: 10,
                minHeight: '100vh', display: 'flex', flexDirection: 'column',
            }}>

                {/* Top bar */}
                <header style={{
                    padding: '12px 32px',
                    borderBottom: '1px solid rgba(0,200,255,0.1)',
                    background: 'rgba(2,11,24,0.6)',
                    backdropFilter: 'blur(8px)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                    <span className="term term-dim" style={{ fontSize: '11px', letterSpacing: '0.15em' }}>
                        DIAMONDHANDS_DISTRICT.EXE
                    </span>
                    <span className="term term-dim" style={{ fontSize: '11px' }}>16:9</span>
                </header>

                {/* Hero */}
                <main style={{
                    flex: 1,
                    padding: '0 6vw',
                    paddingBottom: '160px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                }}>

                    {/* Upper row */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '40px',
                        marginBottom: '40px',
                    }}>

                        {/* Left — headline + CTA */}
                        <div>
                            <h1 className="headline" style={{ marginBottom: '32px' }}>
                                ENTER THE DISTRICT.<br />
                                HOLD THE<br />
                                <span className="blue">LINE.</span>
                            </h1>
                            <button
                                className="btn-jack"
                                onClick={() => setStatus('Jacking in to the district…')}
                            >
                                JACK IN
                            </button>
                        </div>

                        {/* Right — diamond glow card */}
                        <div
                            className="glow-card diamond-facet"
                            style={{
                                width: 220, flexShrink: 0,
                                borderRadius: 3, overflow: 'hidden',
                                position: 'relative',
                            }}
                        >
                            {/* Indicator */}
                            <div style={{
                                display: 'flex', justifyContent: 'center',
                                padding: '12px 0',
                                borderBottom: '1px solid rgba(0,200,255,0.12)',
                            }}>
                                <div style={{
                                    width: 10, height: 10, borderRadius: '50%',
                                    background: 'var(--blue)',
                                    boxShadow: '0 0 12px var(--blue-glow)',
                                }} className="blink" />
                            </div>

                            {/* Card center — diamond */}
                            <div style={{
                                height: 160,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                borderBottom: '1px solid rgba(0,200,255,0.12)',
                                background: 'linear-gradient(160deg, rgba(0,30,60,0.6) 0%, rgba(2,14,30,0.95) 100%)',
                                position: 'relative',
                            }}>
                                {/* Corner brackets */}
                                {(['tl','tr','bl','br'] as const).map(c => (
                                    <div key={c} style={{
                                        position: 'absolute',
                                        width: 14, height: 14,
                                        borderColor: 'rgba(0,180,230,0.55)',
                                        borderStyle: 'solid', borderWidth: 0,
                                        borderTopWidth:    c[0]==='t' ? 2 : 0,
                                        borderBottomWidth: c[0]==='b' ? 2 : 0,
                                        borderLeftWidth:   c[1]==='l' ? 2 : 0,
                                        borderRightWidth:  c[1]==='r' ? 2 : 0,
                                        top:    c[0]==='t' ? 10 : undefined,
                                        bottom: c[0]==='b' ? 10 : undefined,
                                        left:   c[1]==='l' ? 10 : undefined,
                                        right:  c[1]==='r' ? 10 : undefined,
                                    }} />
                                ))}

                                {/* Diamond gem */}
                                <div style={{
                                    fontSize: 64,
                                    filter: 'drop-shadow(0 0 18px rgba(0,200,255,0.7)) drop-shadow(0 0 40px rgba(0,200,255,0.3))',
                                    userSelect: 'none',
                                    lineHeight: 1,
                                }}>
                                    💎
                                </div>

                                {/* Shimmer line */}
                                <div style={{
                                    position: 'absolute',
                                    bottom: 0, left: '15%', right: '15%', height: 2,
                                    background: 'linear-gradient(90deg, transparent, var(--blue), transparent)',
                                    opacity: 0.5,
                                }} />
                            </div>

                            {/* Digital display */}
                            <div style={{ padding: '12px 0', textAlign: 'center' }}>
                                <div style={{
                                    fontFamily: 'var(--font-digit)',
                                    fontSize: 22,
                                    color: 'var(--blue)',
                                    letterSpacing: '0.12em',
                                    textShadow: '0 0 16px var(--blue-glow)',
                                }}>
                                    00:00:00
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Lower row — terminal form */}
                    <div style={{
                        background: 'rgba(2,11,24,0.88)',
                        border: '1px solid rgba(0,200,255,0.3)',
                        boxShadow: '0 0 30px rgba(0,200,255,0.06)',
                    }}>

                        {/* Row 1 */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: '220px 1px 1fr',
                            borderBottom: '1px solid rgba(0,200,255,0.15)',
                        }}>
                            <div style={{
                                padding: '18px 20px',
                                fontFamily: 'var(--font-mono)', fontSize: 13,
                                color: 'var(--blue)', letterSpacing: '0.06em',
                                display: 'flex', alignItems: 'center',
                            }}>
                                INPUT HANDLE
                            </div>
                            <div style={{ background: 'rgba(0,200,255,0.2)' }} />
                            <div style={{ padding: '18px 20px', display: 'flex', alignItems: 'center' }}>
                                <input
                                    className="matrix-input"
                                    placeholder="Name"
                                    value={field1}
                                    onChange={e => setField1(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Row 2 */}
                        <div style={{ display: 'grid', gridTemplateColumns: '220px 1px 1fr' }}>
                            <div style={{
                                padding: '18px 20px',
                                fontFamily: 'var(--font-mono)', fontSize: 13,
                                color: 'var(--blue)', letterSpacing: '0.06em',
                                display: 'flex', alignItems: 'center',
                            }}>
                                INPUT RESISTANCE NODE
                            </div>
                            <div style={{ background: 'rgba(0,200,255,0.2)' }} />
                            <div style={{
                                padding: '18px 20px',
                                display: 'flex', alignItems: 'center', gap: 12,
                            }}>
                                <input
                                    className="matrix-input"
                                    placeholder="email"
                                    value={field2}
                                    onChange={e => setField2(e.target.value)}
                                    style={{ flex: 1 }}
                                    onKeyDown={e => e.key === 'Enter' && handleAction()}
                                />
                                <button
                                    className="btn-blue"
                                    onClick={handleAction}
                                    style={{ width: 'auto', padding: '12px 22px', whiteSpace: 'nowrap' }}
                                >
                                    INITIATE TRANSFER.
                                </button>
                            </div>
                        </div>

                    </div>

                    {/* Status line */}
                    <div style={{ marginTop: 8 }}>
                        <span className="term term-dim" style={{ fontSize: 12 }}>
                            &gt;_ {status}
                        </span>
                    </div>

                </main>
            </div>

            <TerminalBar message={status} />
        </div>
    );
}
