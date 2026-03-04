export function ScanLines() {
    const lines = [
        { top: '27%', left: '2%',  w: '9%',  c: '#00ff41', o: 0.55 },
        { top: '29%', left: '4%',  w: '14%', c: '#00ff41', o: 0.3  },
        { top: '33%', left: '2%',  w: '6%',  c: '#ff2244', o: 0.45 },
        { top: '38%', left: '3%',  w: '20%', c: '#00ff41', o: 0.25 },
        { top: '42%', left: '1%',  w: '5%',  c: '#8800ff', o: 0.5  },
        { top: '43%', left: '5%',  w: '8%',  c: '#00ffff', o: 0.35 },
        { top: '52%', left: '3%',  w: '7%',  c: '#00ff41', o: 0.45 },
        { top: '53%', left: '6%',  w: '18%', c: '#00ff41', o: 0.2  },
        { top: '58%', left: '1%',  w: '4%',  c: '#ff2244', o: 0.3  },
        { top: '30%', right: '2%', w: '3%',  c: '#00ff41', o: 0.25 },
        { top: '45%', right: '3%', w: '6%',  c: '#00ff41', o: 0.2  },
        { top: '55%', right: '1%', w: '4%',  c: '#ff2244', o: 0.25 },
    ] as const;

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1, pointerEvents: 'none', overflow: 'hidden' }}>
            {lines.map((l, i) => (
                <div key={i} style={{
                    position: 'absolute',
                    top: l.top,
                    left: 'left' in l ? l.left : undefined,
                    right: 'right' in l ? (l as { right?: string }).right : undefined,
                    width: l.w, height: 2,
                    background: l.c, opacity: l.o,
                    animation: `scanFlicker ${3 + (i % 4)}s ease-in-out infinite`,
                    animationDelay: `${i * 0.3}s`,
                }} />
            ))}
        </div>
    );
}
