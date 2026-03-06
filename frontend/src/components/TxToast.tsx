import { useState, useEffect, useRef } from 'react';
import { OPNET_EXPLORER_URL } from '../config/contracts';

interface Props {
    txId: string | null;
}

const DISMISS_MS = 12_000;

export function TxToast({ txId }: Props) {
    const [visible, setVisible] = useState(false);
    const [copied, setCopied] = useState(false);
    const [progress, setProgress] = useState(100);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const startRef = useRef<number>(0);

    useEffect(() => {
        if (!txId) return;

        if (timerRef.current) clearTimeout(timerRef.current);
        if (intervalRef.current) clearInterval(intervalRef.current);

        setVisible(true);
        setProgress(100);
        setCopied(false);
        startRef.current = Date.now();

        intervalRef.current = setInterval(() => {
            const elapsed = Date.now() - startRef.current;
            const pct = Math.max(0, 100 - (elapsed / DISMISS_MS) * 100);
            setProgress(pct);
        }, 100);

        timerRef.current = setTimeout(() => {
            if (intervalRef.current) clearInterval(intervalRef.current);
            setVisible(false);
        }, DISMISS_MS);

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [txId]);

    function copy() {
        if (!txId) return;
        navigator.clipboard.writeText(txId).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    }

    if (!visible || !txId) return null;

    const short = `${txId.slice(0, 10)}...${txId.slice(-6)}`;

    return (
        <div style={{
            position: 'fixed',
            top: 80,
            right: 20,
            zIndex: 9999,
            width: 320,
            background: '#030c15',
            border: '1px solid rgba(0,200,255,0.4)',
            borderRadius: 10,
            overflow: 'hidden',
            boxShadow: '0 4px 32px rgba(0,200,255,0.15)',
            fontFamily: 'var(--font-mono)',
        }}>
            {/* Header */}
            <div style={{
                padding: '10px 14px 8px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid rgba(0,200,255,0.12)',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{
                        width: 7, height: 7, borderRadius: '50%',
                        background: '#00c8ff',
                        boxShadow: '0 0 8px #00c8ff',
                        animation: 'blink 1.2s ease-in-out infinite',
                        flexShrink: 0,
                    }} />
                    <span style={{ fontSize: 10, letterSpacing: '0.15em', color: 'var(--cyan)' }}>
                        TX SUBMITTED
                    </span>
                </div>
                <button
                    onClick={() => setVisible(false)}
                    style={{
                        background: 'none',
                        border: 'none',
                        color: 'rgba(255,255,255,0.3)',
                        cursor: 'pointer',
                        fontSize: 16,
                        lineHeight: 1,
                        padding: '0 2px',
                    }}
                >
                    ×
                </button>
            </div>

            {/* TX hash + actions */}
            <div style={{ padding: '10px 14px 12px' }}>
                <div style={{
                    fontSize: 12,
                    color: 'rgba(255,255,255,0.5)',
                    marginBottom: 10,
                    letterSpacing: '0.04em',
                }}>
                    {short}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button
                        onClick={copy}
                        style={{
                            flex: 1,
                            padding: '6px 0',
                            background: 'rgba(0,200,255,0.06)',
                            border: '1px solid rgba(0,200,255,0.2)',
                            borderRadius: 6,
                            color: copied ? '#4ade80' : 'var(--cyan)',
                            fontSize: 10,
                            letterSpacing: '0.08em',
                            cursor: 'pointer',
                            fontFamily: 'var(--font-mono)',
                            transition: 'color 0.2s',
                        }}
                    >
                        {copied ? '✓ COPIED' : 'COPY'}
                    </button>
                    <a
                        href={`${OPNET_EXPLORER_URL}${txId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                            flex: 2,
                            padding: '6px 0',
                            background: 'rgba(0,200,255,0.08)',
                            border: '1px solid rgba(0,200,255,0.25)',
                            borderRadius: 6,
                            color: 'var(--cyan)',
                            fontSize: 10,
                            letterSpacing: '0.08em',
                            cursor: 'pointer',
                            fontFamily: 'var(--font-mono)',
                            textDecoration: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 4,
                        }}
                    >
                        View on Explorer →
                    </a>
                </div>
            </div>

            {/* Countdown progress bar */}
            <div style={{ height: 3, background: 'rgba(0,200,255,0.1)' }}>
                <div style={{
                    height: '100%',
                    width: `${progress}%`,
                    background: 'linear-gradient(90deg, rgba(0,200,255,0.3), var(--cyan))',
                    transition: 'width 0.1s linear',
                }} />
            </div>
        </div>
    );
}
