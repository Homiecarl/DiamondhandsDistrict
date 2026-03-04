/**
 * Horizontal glitch / scan-line artifacts scattered on the left side —
 * matching the colored dashes in the reference image.
 */

export function ScanLines() {
    const lines = [
        { top: '27%', left: '2%',  w: '9%',  color: '#00ff41', op: 0.55, h: 2 },
        { top: '29%', left: '4%',  w: '14%', color: '#00ff41', op: 0.35, h: 2 },
        { top: '33%', left: '2%',  w: '6%',  color: '#ff2244', op: 0.45, h: 2 },
        { top: '38%', left: '3%',  w: '20%', color: '#00ff41', op: 0.3,  h: 2 },
        { top: '42%', left: '1%',  w: '5%',  color: '#8800ff', op: 0.5,  h: 2 },
        { top: '43%', left: '5%',  w: '8%',  color: '#00ffff', op: 0.4,  h: 2 },
        { top: '47%', left: '2%',  w: '12%', color: '#00ff41', op: 0.25, h: 2 },
        { top: '52%', left: '3%',  w: '7%',  color: '#00ff41', op: 0.5,  h: 2 },
        { top: '53%', left: '6%',  w: '18%', color: '#00ff41', op: 0.2,  h: 2 },
        { top: '58%', left: '1%',  w: '4%',  color: '#ff2244', op: 0.3,  h: 2 },
        { top: '60%', left: '4%',  w: '10%', color: '#8800ff', op: 0.35, h: 2 },
        { top: '64%', left: '2%',  w: '16%', color: '#00ff41', op: 0.2,  h: 2 },
        // right side
        { top: '30%', right: '2%', w: '3%',  color: '#00ff41', op: 0.3,  h: 2 },
        { top: '45%', right: '3%', w: '6%',  color: '#00ff41', op: 0.2,  h: 2 },
        { top: '55%', right: '1%', w: '4%',  color: '#ff2244', op: 0.25, h: 2 },
    ] as const;

    return (
        <div
            style={{
                position: 'fixed', inset: 0,
                zIndex: 1, pointerEvents: 'none',
                overflow: 'hidden',
            }}
        >
            {lines.map((l, i) => (
                <div
                    key={i}
                    style={{
                        position: 'absolute',
                        top: l.top,
                        left: 'left' in l ? l.left : undefined,
                        right: 'right' in l ? (l as { right?: string }).right : undefined,
                        width: l.w,
                        height: l.h,
                        background: l.color,
                        opacity: l.op,
                        animation: `scanFlicker ${3 + (i % 4)}s ease-in-out infinite`,
                        animationDelay: `${i * 0.4}s`,
                    }}
                />
            ))}
        </div>
    );
}
