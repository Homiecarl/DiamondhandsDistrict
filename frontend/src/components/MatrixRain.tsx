import { useEffect, useRef } from 'react';

const CHARS = '01アイウエオカキクケコABCDEF0123456789₿ΩΔ░▒';

export function MatrixRain() {
    const ref = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = ref.current!;
        const ctx = canvas.getContext('2d')!;
        const FS = 14;

        let drops: number[] = [];

        const init = () => {
            canvas.width  = window.innerWidth;
            canvas.height = window.innerHeight;
            const cols = Math.floor(canvas.width / FS);
            drops = Array.from({ length: cols }, () => Math.random() * -(canvas.height / FS));
        };
        init();
        window.addEventListener('resize', init);

        let raf: number;
        let last = 0;

        const draw = (ts: number) => {
            raf = requestAnimationFrame(draw);
            if (ts - last < 40) return;
            last = ts;

            ctx.fillStyle = 'rgba(0,0,0,0.06)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.font = `${FS}px "Courier New", monospace`;

            for (let i = 0; i < drops.length; i++) {
                const y = drops[i] * FS;
                const x = i * FS;
                if (y > 0) {
                    ctx.fillStyle = 'rgba(220,255,230,0.9)';
                    ctx.fillText(CHARS[Math.floor(Math.random() * CHARS.length)], x, y);
                    ctx.fillStyle = 'rgba(0,255,65,0.75)';
                    ctx.fillText(CHARS[Math.floor(Math.random() * CHARS.length)], x, y - FS);
                }
                drops[i]++;
                if (drops[i] * FS > canvas.height && Math.random() > 0.97) {
                    drops[i] = Math.random() * -20;
                }
            }
        };
        raf = requestAnimationFrame(draw);

        return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', init); };
    }, []);

    return (
        <canvas ref={ref} style={{
            position: 'fixed', inset: 0,
            width: '100%', height: '100%',
            zIndex: 0, pointerEvents: 'none',
        }} />
    );
}
