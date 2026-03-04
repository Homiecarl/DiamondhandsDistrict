/**
 * Fixed bottom terminal status bar — ">_ message" style.
 * Mirrors the ">_ Transmission received." from the reference image.
 */

import React, { useEffect, useRef, useState } from 'react';

interface TerminalBarProps {
    messages: string[];
}

export const TerminalBar: React.FC<TerminalBarProps> = ({ messages }) => {
    const [displayed, setDisplayed] = useState('');
    const [typing, setTyping] = useState(false);
    const lastMsg = useRef('');
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const latest = messages.length > 0 ? messages[messages.length - 1] : '';

    // Typewriter effect when message changes
    useEffect(() => {
        if (!latest || latest === lastMsg.current) return;
        lastMsg.current = latest;

        if (timerRef.current) clearTimeout(timerRef.current);
        setTyping(true);
        setDisplayed('');

        let i = 0;
        const type = () => {
            if (i <= latest.length) {
                setDisplayed(latest.slice(0, i));
                i++;
                timerRef.current = setTimeout(type, 18);
            } else {
                setTyping(false);
            }
        };
        type();

        return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    }, [latest]);

    return (
        <div
            style={{
                position: 'fixed',
                bottom: 0, left: 0, right: 0,
                zIndex: 50,
                background: 'rgba(0,0,0,0.75)',
                borderTop: '1px solid rgba(0,255,65,0.15)',
                padding: '8px 24px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backdropFilter: 'blur(4px)',
            }}
        >
            {/* Left — current message */}
            <div className="terminal" style={{ fontSize: '12px' }}>
                &gt;_ {displayed}
                {typing && <span className="anim-blink">▋</span>}
                {!typing && displayed && <span className="anim-blink" style={{ opacity: 0.5 }}>_</span>}
            </div>

            {/* Right — mini ticker */}
            <div
                className="terminal"
                style={{ fontSize: '11px', color: 'rgba(0,255,65,0.35)', letterSpacing: '0.1em' }}
            >
                &gt;_ Transmission received.
            </div>
        </div>
    );
};
