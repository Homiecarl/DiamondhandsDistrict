// Horizontal glitch artifacts — ice blue / crystal palette
export function ScanLines() {
    const lines = [
        { top: '26%', left: '2%',  w: '9%',  c: '#00c8ff', o: 0.5  },
        { top: '28%', left: '4%',  w: '14%', c: '#00c8ff', o: 0.28 },
        { top: '33%', left: '2%',  w: '6%',  c: '#7dd3fc', o: 0.4  },
        { top: '37%', left: '3%',  w: '20%', c: '#00c8ff', o: 0.2  },
        { top: '41%', left: '1%',  w: '5%',  c: '#a78bfa', o: 0.45 },
        { top: '43%', left: '5%',  w: '8%',  c: '#bae6fd', o: 0.3  },
        { top: '51%', left: '3%',  w: '7%',  c: '#00c8ff', o: 0.4  },
        { top: '52%', left: '7%',  w: '16%', c: '#00c8ff', o: 0.18 },
        { top: '57%', left: '1%',  w: '4%',  c: '#7dd3fc', o: 0.35 },
        { top: '60%', left: '4%',  w: '11%', c: '#a78bfa', o: 0.25 },
        { top: '29%', right: '2%', w: '3%',  c: '#00c8ff', o: 0.25 },
        { top: '44%', right: '3%', w: '6%',  c: '#7dd3fc', o: 0.2  },
        { top: '56%', right: '1%', w: '4%',  c: '#a78bfa', o: 0.3  },
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
                    animationDelay: `${i * 0.35}s`,
                }} />
            ))}
        </div>
    );
}
