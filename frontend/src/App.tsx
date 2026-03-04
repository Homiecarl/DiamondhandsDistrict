import React, { useEffect, useRef, useState } from 'react';
import { Header } from './components/Header';
import { TierSelector } from './components/TierSelector';
import { StakeForm } from './components/StakeForm';
import { StakeDashboard } from './components/StakeDashboard';
import { RewardCounter } from './components/RewardCounter';
import { useStaking } from './hooks/useStaking';
import { StakingTier } from './config/contracts';
import { stakingService } from './services/StakingService';

function App() {
    const [selectedTier, setSelectedTier] = useState<StakingTier | null>(null);
    const [currentBlock, setCurrentBlock] = useState<bigint>(0n);
    const blockPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
        getCSVAddress,
    } = useStaking();

    const isStaking = stakeInfo !== null && stakeInfo.satoshis > 0n;
    const csvAddress = selectedTier ? getCSVAddress(selectedTier.lockBlocks) : '';

    // Poll for current block number (~every 10s)
    useEffect(() => {
        const fetchBlock = async () => {
            try {
                const n = await stakingService.provider.getBlockNumber();
                setCurrentBlock(BigInt(n));
            } catch {
                // ignore
            }
        };

        fetchBlock();
        blockPollRef.current = setInterval(fetchBlock, 10_000);
        return () => {
            if (blockPollRef.current) clearInterval(blockPollRef.current);
        };
    }, []);

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
            <Header
                connected={wallet.connected}
                address={wallet.address}
                balance={wallet.balance}
                onConnect={connectWallet}
                loading={loading}
            />

            <main className="container" style={{ paddingTop: '48px', paddingBottom: '80px' }}>
                {/* Hero */}
                <div style={{ textAlign: 'center', marginBottom: '56px' }}>
                    <h1
                        style={{
                            fontSize: 'clamp(28px, 5vw, 52px)',
                            fontWeight: 700,
                            color: '#f7931a',
                            letterSpacing: '0.08em',
                            marginBottom: '16px',
                            textShadow: '0 0 40px rgba(247,147,26,0.4)',
                        }}
                    >
                        PROOF OF HODL
                    </h1>
                    <p
                        style={{
                            fontSize: '16px',
                            color: '#888',
                            maxWidth: '560px',
                            margin: '0 auto 24px',
                            lineHeight: 1.7,
                        }}
                    >
                        Lock Bitcoin in a CSV time-locked address and earn HODL tokens.
                        <br />
                        The longer you HODL, the higher your loyalty multiplier.
                    </p>

                    {/* Stats bar */}
                    <div
                        style={{
                            display: 'inline-flex',
                            gap: '32px',
                            background: 'rgba(247,147,26,0.05)',
                            border: '1px solid rgba(247,147,26,0.15)',
                            borderRadius: '10px',
                            padding: '14px 28px',
                            fontSize: '13px',
                        }}
                    >
                        <div>
                            <span style={{ color: '#555' }}>TOTAL STAKED </span>
                            <span style={{ color: '#f7931a', fontWeight: 700 }}>
                                {(Number(totalStaked) / 1e8).toFixed(4)} BTC
                            </span>
                        </div>
                        <div style={{ borderLeft: '1px solid rgba(255,255,255,0.08)', margin: '0 4px' }} />
                        <div>
                            <span style={{ color: '#555' }}>CURRENT BLOCK </span>
                            <span style={{ color: '#888', fontWeight: 700 }}>
                                #{currentBlock.toString()}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Global error */}
                {error && (
                    <div className="error-banner" style={{ maxWidth: '640px', margin: '0 auto 24px' }}>
                        {error}
                    </div>
                )}

                {/* Main content */}
                {isStaking ? (
                    /* ─── Active stake view ─── */
                    <div style={{ maxWidth: '680px', margin: '0 auto' }}>
                        <StakeDashboard
                            stakeInfo={stakeInfo!}
                            currentBlock={currentBlock}
                            onUnstake={unstake}
                            txPending={txPending}
                        />
                        <RewardCounter
                            pendingRewards={pendingRewards}
                            onClaim={claimRewards}
                            txPending={txPending}
                            walletConnected={wallet.connected}
                        />
                    </div>
                ) : (
                    /* ─── New stake view ─── */
                    <div style={{ maxWidth: '760px', margin: '0 auto' }}>
                        <div className="section">
                            <TierSelector
                                selectedTier={selectedTier}
                                onSelect={setSelectedTier}
                            />
                        </div>

                        <StakeForm
                            selectedTier={selectedTier}
                            csvAddress={csvAddress}
                            onStake={stake}
                            txPending={txPending}
                            walletConnected={wallet.connected}
                        />

                        {!wallet.connected && (
                            <div
                                style={{
                                    textAlign: 'center',
                                    marginTop: '48px',
                                }}
                            >
                                <p style={{ color: '#555', marginBottom: '20px', fontSize: '14px' }}>
                                    Connect your OPWallet to start staking
                                </p>
                                <button
                                    className="btn-primary"
                                    onClick={connectWallet}
                                    disabled={loading}
                                    style={{ fontSize: '16px', padding: '16px 40px' }}
                                >
                                    {loading ? (
                                        <>
                                            <span className="spinner" />
                                            CONNECTING…
                                        </>
                                    ) : (
                                        'CONNECT OPWALLET'
                                    )}
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* How it works */}
                <div
                    style={{
                        maxWidth: '760px',
                        margin: '64px auto 0',
                        borderTop: '1px solid rgba(255,255,255,0.06)',
                        paddingTop: '40px',
                    }}
                >
                    <h2
                        style={{
                            fontSize: '14px',
                            color: '#555',
                            letterSpacing: '0.15em',
                            marginBottom: '24px',
                            textAlign: 'center',
                        }}
                    >
                        HOW IT WORKS
                    </h2>
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                            gap: '16px',
                        }}
                    >
                        {[
                            { step: '01', title: 'CHOOSE TIER', desc: 'Select a lock duration from 1 week to 2 months.' },
                            { step: '02', title: 'STAKE BTC', desc: 'Send BTC to a CSV time-locked P2WSH address.' },
                            { step: '03', title: 'HODL', desc: 'Your multiplier grows linearly over the lock period.' },
                            { step: '04', title: 'CLAIM', desc: 'Claim HODL tokens anytime. Unstake after lock expires.' },
                        ].map((item) => (
                            <div
                                key={item.step}
                                style={{
                                    background: '#111',
                                    border: '1px solid rgba(255,255,255,0.06)',
                                    borderRadius: '10px',
                                    padding: '18px',
                                }}
                            >
                                <div
                                    style={{
                                        fontSize: '24px',
                                        color: 'rgba(247,147,26,0.3)',
                                        fontWeight: 700,
                                        marginBottom: '8px',
                                    }}
                                >
                                    {item.step}
                                </div>
                                <div
                                    style={{
                                        fontSize: '13px',
                                        fontWeight: 700,
                                        color: '#e0e0e0',
                                        marginBottom: '6px',
                                        letterSpacing: '0.06em',
                                    }}
                                >
                                    {item.title}
                                </div>
                                <div style={{ fontSize: '12px', color: '#666', lineHeight: 1.6 }}>
                                    {item.desc}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer
                style={{
                    borderTop: '1px solid rgba(255,255,255,0.05)',
                    padding: '20px 24px',
                    textAlign: 'center',
                    fontSize: '12px',
                    color: '#444',
                }}
            >
                Proof of HODL · OPNet Testnet · Bitcoin Layer 1 Smart Contracts
            </footer>
        </div>
    );
}

export default App;
