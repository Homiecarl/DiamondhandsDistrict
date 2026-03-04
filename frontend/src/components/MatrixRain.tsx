import { useEffect, useRef } from 'react';

// Mix of binary, hex, and diamond/crystal characters
const CHARS = '01◆◇✦✧⬡⬢ABCDEFabcdef0123456789▲△▴▵░▒▓';

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
            if (ts - last < 45) return;
            last = ts;

            // Fade with dark blue instead of pure black
            ctx.fillStyle = 'rgba(2, 11, 24, 0.07)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.font = `${FS}px "Courier New", monospace`;

            for (let i = 0; i < drops.length; i++) {
                const y = drops[i] * FS;
                const x = i * FS;
                if (y > 0) {
                    // Head — bright ice blue / near white
                    ctx.fillStyle = 'rgba(200, 240, 255, 0.92)';
                    ctx.fillText(CHARS[Math.floor(Math.random() * CHARS.length)], x, y);
                    // Second char — cyan blue
                    ctx.fillStyle = 'rgba(0, 200, 255, 0.7)';
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
