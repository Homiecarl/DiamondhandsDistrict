/**
 * Right-side glowing card:
 * - Green neon border with glow
 * - Bitcoin ₿ in an ornate frame
 * - Digital block / multiplier display at bottom
 */

import React from 'react';
import { StakeInfo } from '../services/StakingService';

interface BitcoinCardProps {
    currentBlock: bigint;
    stakeInfo: StakeInfo | null;
}

function pad2(n: number): string {
    return n.toString().padStart(2, '0');
}

/** Format bigint block as 00:00:00 display */
function blockDisplay(n: bigint): string {
    const num = Number(n % 1_000_000n);
    const a = Math.floor(num / 10000);
    const b = Math.floor((num % 10000) / 100);
    const c = num % 100;
    return `${pad2(a)}:${pad2(b)}:${pad2(c)}`;
}

function getMultiplier(elapsed: bigint, lockBlocks: bigint, maxMultX1000: number): number {
    if (lockBlocks === 0n) return 1;
    const p = Number(elapsed > lockBlocks ? lockBlocks : elapsed) / Number(lockBlocks);
    return 1 + p * (maxMultX1000 / 1000 - 1);
}

function getMaxMultX1000(lockBlocks: bigint): number {
    if (lockBlocks === 1_008n) return 2_000;
    if (lockBlocks === 2_016n) return 2_500;
    if (lockBlocks === 4_320n) return 3_000;
    if (lockBlocks === 8_640n) return 4_000;
    return 1_000;
}

export const BitcoinCard: React.FC<BitcoinCardProps> = ({ currentBlock, stakeInfo }) => {
    const isStaking = stakeInfo && stakeInfo.satoshis > 0n;

    const elapsed = isStaking
        ? currentBlock > stakeInfo!.startBlock
            ? currentBlock - stakeInfo!.startBlock
            : 0n
        : 0n;

    const multiplier = isStaking
        ? getMultiplier(elapsed, stakeInfo!.lockBlocks, getMaxMultX1000(stakeInfo!.lockBlocks))
        : null;

    const progressPct = isStaking && stakeInfo!.lockBlocks > 0n
        ? Math.min(100, Number((elapsed * 100n) / stakeInfo!.lockBlocks))
        : 0;

    return (
        <div
            className="glow-card anim-glow-pulse"
            style={{
                width: '220px',
                borderRadius: '4px',
                padding: 0,
                overflow: 'hidden',
                flexShrink: 0,
            }}
        >
            {/* Top indicator */}
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'center',
                    paddingTop: '12px',
                    paddingBottom: '8px',
                    borderBottom: '1px solid rgba(0,255,65,0.15)',
                }}
            >
                <div
                    style={{
                        width: 10, height: 10,
                        borderRadius: '50%',
                        background: 'var(--green)',
                        boxShadow: '0 0 10px var(--green-glow)',
                    }}
                    className="anim-blink"
                />
            </div>

            {/* Center — Bitcoin logo in ornate frame */}
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '20px 16px',
                    minHeight: '160px',
                    position: 'relative',
                }}
            >
                {/* Ornate frame border */}
                <div
                    style={{
                        position: 'relative',
                        width: '130px', height: '130px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: '2px solid rgba(180, 140, 40, 0.7)',
                        background: 'linear-gradient(135deg, rgba(20,12,0,0.9) 0%, rgba(10,8,0,0.95) 100%)',
                        boxShadow: '0 0 20px rgba(180,120,0,0.25), inset 0 0 30px rgba(180,120,0,0.1)',
                    }}
                >
                    {/* Corner ornaments */}
                    {['-6px','-6px'].map((_, ci) => (
                        <div key={ci} style={{
                            position: 'absolute',
                            width: 10, height: 10,
                            border: '2px solid rgba(200,160,50,0.7)',
                            top: ci === 0 ? -3 : undefined,
                            bottom: ci === 1 ? -3 : undefined,
                            left: -3,
                        }} />
                    ))}
                    {[0,1].map((ci) => (
                        <div key={ci} style={{
                            position: 'absolute',
                            width: 10, height: 10,
                            border: '2px solid rgba(200,160,50,0.7)',
                            top: ci === 0 ? -3 : undefined,
                            bottom: ci === 1 ? -3 : undefined,
                            right: -3,
                        }} />
                    ))}

                    {/* Bitcoin symbol */}
                    <div
                        style={{
                            fontFamily: 'var(--font-display)',
                            fontSize: '64px',
                            fontWeight: 700,
                            color: '#f7931a',
                            textShadow: '0 0 30px rgba(247,147,26,0.6), 0 0 60px rgba(247,147,26,0.2)',
                            lineHeight: 1,
                            userSelect: 'none',
                        }}
                    >
                        ₿
                    </div>

                    {/* Glow under the symbol */}
                    <div style={{
                        position: 'absolute',
                        bottom: 0, left: '15%', right: '15%', height: '2px',
                        background: 'rgba(247,147,26,0.4)',
                        filter: 'blur(4px)',
                    }} />
                </div>

                {isStaking && multiplier !== null && (
                    <div style={{ marginTop: '12px', textAlign: 'center' }}>
                        <div className="digital-sm" style={{ marginBottom: '4px', color: 'rgba(0,255,65,0.5)' }}>
                            MULTIPLIER
                        </div>
                        <div className="digital" style={{ fontSize: '20px' }}>
                            {multiplier.toFixed(2)}×
                        </div>
                    </div>
                )}
            </div>

            {/* Bottom — digital block display */}
            <div
                style={{
                    borderTop: '1px solid rgba(0,255,65,0.25)',
                    background: 'rgba(0,255,65,0.03)',
                    padding: '10px 0',
                    textAlign: 'center',
                }}
            >
                <div className="digital-sm" style={{ marginBottom: '5px', color: 'rgba(0,255,65,0.4)' }}>
                    {isStaking ? 'LOCK PROGRESS' : 'BLOCK'}
                </div>

                {isStaking ? (
                    <div style={{ padding: '0 16px' }}>
                        <div className="prog-track">
                            <div className="prog-fill" style={{ width: `${progressPct}%` }} />
                        </div>
                        <div className="digital" style={{ fontSize: '14px', marginTop: '6px', letterSpacing: '0.1em' }}>
                            {progressPct.toFixed(0)}%
                        </div>
                    </div>
                ) : (
                    <div
                        className="digital"
                        style={{
                            fontSize: '22px',
                            letterSpacing: '0.12em',
                            color: 'var(--green)',
                            padding: '2px 0',
                        }}
                    >
                        {blockDisplay(currentBlock)}
                    </div>
                )}
            </div>
        </div>
    );
};
