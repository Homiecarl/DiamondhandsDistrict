import React, { useEffect, useRef, useState } from 'react';
import { MatrixRain }       from './components/MatrixRain';
import { ScanLines }        from './components/ScanLines';
import { PerspectiveGrid }  from './components/PerspectiveGrid';
import { BitcoinCard }      from './components/BitcoinCard';
import { TerminalForm }     from './components/TerminalForm';
import { TerminalBar }      from './components/TerminalBar';
import { useStaking }       from './hooks/useStaking';
import { StakingTier }      from './config/contracts';
import { stakingService }   from './services/StakingService';

// ─── Terminal message helpers ─────────────────────────────────────────────────

function truncate(s: string, n = 12) {
    return s.length <= n ? s : `${s.slice(0, 8)}…${s.slice(-4)}`;
}

export default function App() {
    const [selectedTier, setSelectedTier] = useState<StakingTier | null>(null);
    const [currentBlock, setCurrentBlock] = useState<bigint>(0n);
    const [messages, setMessages] = useState<string[]>(['System initialized. Awaiting connection…']);
    const blockPoll = useRef<ReturnType<typeof setInterval> | null>(null);

    const {
        wallet,
        stakeInfo,
        pendingRewards,
        totalStaked,
        loading,
        txPending,
        error,
        connectWallet,
        stake,
        unstake,
        claimRewards,
    } = useStaking();

    const isStaking = !!(stakeInfo && stakeInfo.satoshis > 0n);

    // ── Terminal messages ────────────────────────────────────────────────────
    const push = (msg: string) => setMessages((m) => [...m.slice(-20), msg]);

    useEffect(() => {
        if (wallet.connected) push(`Wallet linked. Node: ${truncate(wallet.address, 14)}`);
    }, [wallet.connected]);

    useEffect(() => {
        if (isStaking && stakeInfo) {
            push(`Active stake detected. Lock expires block #${stakeInfo.unlockBlock}.`);
        }
    }, [isStaking]);

    useEffect(() => {
        if (error) push(`Warning: ${error}`);
    }, [error]);

    // ── Block polling ────────────────────────────────────────────────────────
    useEffect(() => {
        const fetch = async () => {
            try {
                const n = await stakingService.provider.getBlockNumber();
                setCurrentBlock(BigInt(n));
            } catch { /* ignore */ }
        };
        fetch();
        blockPoll.current = setInterval(fetch, 10_000);
        return () => { if (blockPoll.current) clearInterval(blockPoll.current); };
    }, []);

    // ── Wrap actions with terminal logging ───────────────────────────────────
    const handleStake = async (lockBlocks: bigint, satoshis: bigint, csv: string) => {
        push(`Initiating stake… ${satoshis} sats, lock: ${lockBlocks} blocks.`);
        const id = await stake(lockBlocks, satoshis, csv);
        push(`Stake confirmed. Tx: ${truncate(id, 16)}`);
        return id;
    };

    const handleUnstake = async () => {
        push('Initiating unstake…');
        const id = await unstake();
        push(`Unstake confirmed. Tx: ${truncate(id, 16)}`);
        return id;
    };

    const handleClaim = async () => {
        push(`Claiming ${pendingRewards.toString()} HODL tokens…`);
        const id = await claimRewards();
        push(`Rewards claimed. Tx: ${truncate(id, 16)}`);
        return id;
    };

    // ════════════════════════════════════════════════════════════════════════
    return (
        <div style={{ position: 'relative', minHeight: '100vh', overflow: 'hidden' }}>

            {/* ─── Layer 0: Matrix rain canvas ─── */}
            <MatrixRain />

            {/* ─── Layer 1: Perspective floor grid ─── */}
            <PerspectiveGrid />

            {/* ─── Layer 2: Glitch scan lines ─── */}
            <ScanLines />

            {/* ─── Layer 3: Content ─── */}
            <div style={{ position: 'relative', zIndex: 10, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

                {/* ── Top bar ───────────────────────────────────────────── */}
                <header style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '14px 32px',
                    borderBottom: '1px solid rgba(0,255,65,0.12)',
                    background: 'rgba(0,0,0,0.5)',
                    backdropFilter: 'blur(6px)',
                }}>
                    <div className="terminal" style={{ fontSize: '11px', color: 'rgba(0,255,65,0.4)' }}>
                        PROOF_OF_HODL.EXE &nbsp;|&nbsp; OPNet Testnet
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        {/* Total staked */}
                        {totalStaked > 0n && (
                            <div className="terminal" style={{ fontSize: '11px', color: 'rgba(0,255,65,0.45)' }}>
                                NETWORK STAKE: {(Number(totalStaked) / 1e8).toFixed(4)} BTC
                            </div>
                        )}

                        {/* Block indicator */}
                        {currentBlock > 0n && (
                            <div className="digital-sm" style={{ color: 'rgba(0,255,65,0.5)' }}>
                                BLK #{currentBlock.toString()}
                            </div>
                        )}

                        {/* Wallet */}
                        {wallet.connected ? (
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: '8px',
                                border: '1px solid rgba(0,255,65,0.3)',
                                padding: '6px 14px',
                                background: 'rgba(0,255,65,0.04)',
                            }}>
                                <div style={{
                                    width: 6, height: 6, borderRadius: '50%',
                                    background: 'var(--green)',
                                    boxShadow: '0 0 8px var(--green)',
                                }} className="anim-blink" />
                                <span className="terminal" style={{ fontSize: '12px' }}>
                                    {truncate(wallet.address, 16)}
                                </span>
                            </div>
                        ) : null}
                    </div>
                </header>

                {/* ── Hero section ──────────────────────────────────────── */}
                <main style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '0 5vw',
                    paddingBottom: '120px', // room for form + terminal bar
                }}>
                    {/* Upper half: headline + card */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        paddingTop: 'clamp(40px, 7vh, 80px)',
                        paddingBottom: 'clamp(28px, 4vh, 48px)',
                        gap: '40px',
                    }}>
                        {/* Left — Headline + CTA */}
                        <div style={{ flex: 1 }}>
                            <h1 className="headline" style={{ marginBottom: 'clamp(20px, 3vh, 36px)' }}>
                                PROOF OF HODL.<br />
                                LOCK THE<br />
                                <span className="accent">CHAIN.</span>
                            </h1>

                            {!wallet.connected ? (
                                <button
                                    className="btn-jack-in"
                                    onClick={connectWallet}
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <>JACKING IN<span className="anim-blink">_</span></>
                                    ) : 'JACK IN'}
                                </button>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <div style={{
                                        display: 'inline-flex', alignItems: 'center', gap: '10px',
                                        border: '1px solid rgba(0,255,65,0.35)',
                                        padding: '10px 18px',
                                        background: 'rgba(0,255,65,0.04)',
                                        width: 'fit-content',
                                    }}>
                                        <div style={{
                                            width: 7, height: 7, borderRadius: '50%',
                                            background: 'var(--green)',
                                            boxShadow: '0 0 10px var(--green)',
                                        }} />
                                        <span className="terminal" style={{ fontSize: '14px' }}>
                                            CONNECTED
                                        </span>
                                    </div>
                                    <div className="terminal" style={{ fontSize: '12px', color: 'rgba(0,255,65,0.4)', paddingLeft: '4px' }}>
                                        {(Number(wallet.balance) / 1e8).toFixed(5)} BTC available
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Right — Bitcoin card */}
                        <BitcoinCard
                            currentBlock={currentBlock}
                            stakeInfo={stakeInfo}
                        />
                    </div>

                    {/* Lower half: form panel */}
                    {wallet.connected && (
                        <div className="anim-fade-in">
                            <TerminalForm
                                stakeInfo={stakeInfo}
                                pendingRewards={pendingRewards}
                                selectedTier={selectedTier}
                                onTierSelect={setSelectedTier}
                                onStake={handleStake}
                                onUnstake={handleUnstake}
                                onClaim={handleClaim}
                                txPending={txPending}
                                walletConnected={wallet.connected}
                                currentBlock={currentBlock}
                            />
                        </div>
                    )}

                    {/* Not connected — ghost form hint */}
                    {!wallet.connected && (
                        <div style={{
                            opacity: 0.25, pointerEvents: 'none', marginTop: '8px',
                        }}>
                            <div style={{
                                border: '1px solid rgba(0,255,65,0.3)',
                                background: 'rgba(0,5,1,0.5)',
                            }}>
                                {['INPUT STAKE AMOUNT', 'SELECT LOCK DURATION'].map((lbl, i) => (
                                    <div key={lbl} style={{
                                        display: 'grid',
                                        gridTemplateColumns: '220px 1px 1fr',
                                        height: '64px',
                                        borderBottom: i === 0 ? '1px solid rgba(0,255,65,0.18)' : 'none',
                                    }}>
                                        <div style={{ padding: '14px 20px', fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--green)', display: 'flex', alignItems: 'center' }}>{lbl}</div>
                                        <div style={{ background: 'rgba(0,255,65,0.25)' }} />
                                        <div style={{ padding: '14px 20px', display: 'flex', alignItems: 'center' }}>
                                            <div style={{ width: '40%', height: 1, background: 'rgba(0,255,65,0.25)' }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--green)', padding: '8px 0' }}>
                                &gt;_ Jack in to begin staking.
                            </div>
                        </div>
                    )}
                </main>
            </div>

            {/* ─── Layer 4: Terminal bar (fixed bottom) ─── */}
            <TerminalBar messages={messages} />
        </div>
    );
}
