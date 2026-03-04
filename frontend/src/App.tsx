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
        setStatus(`Processing: ${field1 || 'anonymous'} — ${field2 || 'no data'}…`);
    };

    return (
        <div style={{ position: 'relative', minHeight: '100vh', overflow: 'hidden' }}>

            {/* Backgrounds */}
            <MatrixRain />
            <PerspectiveGrid />
            <ScanLines />

            {/* Content */}
            <div style={{ position: 'relative', zIndex: 10, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

                {/* Top bar */}
                <header style={{
                    padding: '12px 32px',
                    borderBottom: '1px solid rgba(0,255,65,0.12)',
                    background: 'rgba(0,0,0,0.5)',
                    backdropFilter: 'blur(6px)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                    <span className="term term-dim" style={{ fontSize: '11px', letterSpacing: '0.15em' }}>
                        PROJECT_NAME.EXE
                    </span>
                    <span className="term term-dim" style={{ fontSize: '11px' }}>
                        16:9
                    </span>
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
                    {/* Upper row — headline + card */}
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
                                ENTER THE RAFFLE.<br />
                                FOLLOW THE<br />
                                <span className="green">WHITE RABBIT.</span>
                            </h1>
                            <button
                                className="btn-jack"
                                onClick={() => setStatus('Jacking in…')}
                            >
                                JACK IN
                            </button>
                        </div>

                        {/* Right — glowing card */}
                        <div
                            className="glow-card"
                            style={{
                                width: 220, flexShrink: 0,
                                borderRadius: 4, overflow: 'hidden',
                            }}
                        >
                            {/* Indicator dot */}
                            <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0', borderBottom: '1px solid rgba(0,255,65,0.15)' }}>
                                <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--green)', boxShadow: '0 0 10px var(--green)' }} className="blink" />
                            </div>

                            {/* Card image / icon area */}
                            <div style={{
                                height: 160,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                borderBottom: '1px solid rgba(0,255,65,0.15)',
                                background: 'linear-gradient(135deg, rgba(0,20,5,0.8) 0%, rgba(0,8,2,0.95) 100%)',
                                position: 'relative',
                            }}>
                                {/* Ornate corner brackets */}
                                {['topLeft','topRight','bottomLeft','bottomRight'].map(pos => (
                                    <div key={pos} style={{
                                        position: 'absolute',
                                        width: 14, height: 14,
                                        borderColor: 'rgba(180,140,40,0.7)',
                                        borderStyle: 'solid',
                                        borderWidth: 0,
                                        borderTopWidth:    pos.includes('top')    ? 2 : 0,
                                        borderBottomWidth: pos.includes('bottom') ? 2 : 0,
                                        borderLeftWidth:   pos.includes('Left')   ? 2 : 0,
                                        borderRightWidth:  pos.includes('Right')  ? 2 : 0,
                                        top:    pos.includes('top')    ? 10 : undefined,
                                        bottom: pos.includes('bottom') ? 10 : undefined,
                                        left:   pos.includes('Left')   ? 10 : undefined,
                                        right:  pos.includes('Right')  ? 10 : undefined,
                                    }} />
                                ))}
                                {/* Placeholder icon — replace with project image */}
                                <div style={{
                                    fontSize: 56,
                                    filter: 'drop-shadow(0 0 20px rgba(0,255,65,0.4))',
                                    userSelect: 'none',
                                }}>
                                    🐇
                                </div>
                            </div>

                            {/* Digital display */}
                            <div style={{ padding: '12px 0', textAlign: 'center' }}>
                                <div style={{ fontFamily: 'var(--font-digit)', fontSize: 22, color: 'var(--green)', letterSpacing: '0.12em', textShadow: '0 0 14px var(--green-glow)' }}>
                                    00:00:00
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Lower row — terminal form */}
                    <div style={{ background: 'rgba(0,5,1,0.88)', border: '1px solid rgba(0,255,65,0.35)', boxShadow: '0 0 30px rgba(0,255,65,0.07)' }}>

                        {/* Row 1 */}
                        <div style={{ display: 'grid', gridTemplateColumns: '220px 1px 1fr', borderBottom: '1px solid rgba(0,255,65,0.18)' }}>
                            <div style={{ padding: '18px 20px', fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--green)', letterSpacing: '0.06em', display: 'flex', alignItems: 'center' }}>
                                INPUT HANDLE
                            </div>
                            <div style={{ background: 'rgba(0,255,65,0.25)' }} />
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
                            <div style={{ padding: '18px 20px', fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--green)', letterSpacing: '0.06em', display: 'flex', alignItems: 'center' }}>
                                INPUT RESISTANCE NODE
                            </div>
                            <div style={{ background: 'rgba(0,255,65,0.25)' }} />
                            <div style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
                                <input
                                    className="matrix-input"
                                    placeholder="email"
                                    value={field2}
                                    onChange={e => setField2(e.target.value)}
                                    style={{ flex: 1 }}
                                />
                                <button
                                    className="btn-green"
                                    onClick={handleAction}
                                    style={{ width: 'auto', padding: '12px 22px', whiteSpace: 'nowrap' }}
                                >
                                    INITIATE TRANSFER.
                                </button>
                            </div>
                        </div>

                    </div>

                    {/* Status line below form */}
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
