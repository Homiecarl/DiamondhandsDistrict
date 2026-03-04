// Ice-blue vanishing-point floor grid
export function PerspectiveGrid() {
    return (
        <div style={{
            position: 'fixed',
            bottom: 0, left: '-30%', right: '-30%',
            height: '38vh',
            backgroundImage: `
                linear-gradient(rgba(0, 200, 255, 0.1) 1px, transparent 1px),
                linear-gradient(90deg, rgba(0, 200, 255, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '72px 72px',
            transform: 'perspective(380px) rotateX(58deg)',
            transformOrigin: '50% 0%',
            zIndex: 0, pointerEvents: 'none',
            maskImage: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.5) 30%, black 70%)',
            WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.5) 30%, black 70%)',
        }} />
    );
}
