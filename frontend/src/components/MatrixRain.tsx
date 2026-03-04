import { useEffect, useRef } from 'react';

const CHARS =
    '01アイウエオカキクケコサシスセソタチツテトナニヌネノABCDEF0123456789₿ΩΔΨ░▒▓';

interface Column {
    y: number;
    speed: number;
    opacity: number;
}

export function MatrixRain() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const FS = 14;
        let cols: Column[] = [];

        const init = () => {
            canvas.width  = window.innerWidth;
            canvas.height = window.innerHeight;
            const count = Math.floor(canvas.width / FS);
            cols = Array.from({ length: count }, () => ({
                y:       Math.random() * -canvas.height,
                speed:   0.4 + Math.random() * 1.4,
                opacity: 0.4 + Math.random() * 0.6,
            }));
        };
        init();

        const onResize = () => init();
        window.addEventListener('resize', onResize);

        let raf: number;
        let last = 0;
        const INTERVAL = 40; // ~25fps for the rain

        const draw = (ts: number) => {
            raf = requestAnimationFrame(draw);
            if (ts - last < INTERVAL) return;
            last = ts;

            const W = canvas.width;
            const H = canvas.height;

            // Fade trail
            ctx.fillStyle = 'rgba(0,0,0,0.06)';
            ctx.fillRect(0, 0, W, H);

            for (let i = 0; i < cols.length; i++) {
                const col = cols[i];
                const x = i * FS;
                const y = col.y;

                if (y < 0) {
                    col.y += col.speed * FS;
                    continue;
                }

                // Head character — bright white-green
                const headChar = CHARS[Math.floor(Math.random() * CHARS.length)];
                ctx.fillStyle = `rgba(220,255,230,${col.opacity})`;
                ctx.font = `${FS}px "Courier New", monospace`;
                ctx.fillText(headChar, x, y);

                // Second character — full green
                if (y > FS) {
                    const c2 = CHARS[Math.floor(Math.random() * CHARS.length)];
                    ctx.fillStyle = `rgba(0,255,65,${col.opacity * 0.85})`;
                    ctx.fillText(c2, x, y - FS);
                }

                col.y += col.speed;

                // Random restart
                if (col.y > H + FS * 8 && Math.random() > 0.97) {
                    col.y       = FS * (Math.random() * -20);
                    col.speed   = 0.4 + Math.random() * 1.4;
                    col.opacity = 0.4 + Math.random() * 0.6;
                }
            }
        };

        raf = requestAnimationFrame(draw);

        return () => {
            cancelAnimationFrame(raf);
            window.removeEventListener('resize', onResize);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: 'fixed',
                top: 0, left: 0,
                width: '100%', height: '100%',
                zIndex: 0,
                pointerEvents: 'none',
            }}
        />
    );
}
