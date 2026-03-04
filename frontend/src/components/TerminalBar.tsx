import { useEffect, useRef, useState } from 'react';

export function TerminalBar({ message }: { message: string }) {
    const [text, setText] = useState('');
    const prev = useRef('');
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (!message || message === prev.current) return;
        prev.current = message;
        if (timer.current) clearTimeout(timer.current);
        setText('');
        let i = 0;
        const type = () => {
            setText(message.slice(0, i++));
            if (i <= message.length) timer.current = setTimeout(type, 20);
        };
        type();
        return () => { if (timer.current) clearTimeout(timer.current); };
    }, [message]);

    return (
        <div style={{
            position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
            background: 'rgba(0,0,0,0.8)',
            borderTop: '1px solid rgba(0,255,65,0.15)',
            padding: '8px 28px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            backdropFilter: 'blur(4px)',
        }}>
            <span className="term" style={{ fontSize: '12px' }}>
                &gt;_ {text}<span className="blink">▋</span>
            </span>
            <span className="term term-dim" style={{ fontSize: '11px' }}>
                &gt;_ Transmission received.
            </span>
        </div>
    );
}
