import { useWalletConnect } from '@btc-vision/walletconnect';
import { MatrixRain }        from './components/MatrixRain';
import { ScanLines }         from './components/ScanLines';
import { PerspectiveGrid }   from './components/PerspectiveGrid';
import { TerminalBar }       from './components/TerminalBar';
import { TopBar }            from './components/TopBar';
import { HeroSection }       from './components/HeroSection';
import { MetricsBar }        from './components/MetricsBar';
import { StakePanel }        from './components/StakePanel';
import { YieldPanel }        from './components/YieldPanel';
import { RafflePanel }       from './components/RafflePanel';
import { JackpotCard }       from './components/JackpotCard';
import { WheelPanel }        from './components/WheelPanel';
import { ActivityFeed }      from './components/ActivityFeed';
import { NFTGallery }        from './components/NFTGallery';
import { HistoryPanel }      from './components/HistoryPanel';
import { TxToast }           from './components/TxToast';
import { VaultHealthPanel }  from './components/VaultHealthPanel';
import { useVault }          from './hooks/useVault';
import { useRaffle }         from './hooks/useRaffle';
import './styles/globals.css';

export default function App() {
    const { walletAddress } = useWalletConnect();
    const connected = !!walletAddress;

    const {
        stats,
        position,
        currentBlock,
        vaultMotoBalance,
        loading,
        txPending,
        error,
        lastTxId,
        deployed,
        deposit,
        withdraw,
        claimYield,
    } = useVault();

    const { raffle } = useRaffle(stats.currentRaffleId);

    const statusMsg = lastTxId
        ? `TX submitted: ${lastTxId.slice(0, 20)}…`
        : txPending
        ? 'Broadcasting transaction…'
        : connected
        ? 'Wallet active. District access granted.'
        : 'Connect your wallet to jack in.';

    return (
        <div style={{ position: 'relative', minHeight: '100vh', overflow: 'hidden', background: 'var(--bg)' }}>

            {/* ── Fixed backgrounds ── */}
            <MatrixRain />
            <PerspectiveGrid />
            <ScanLines />

            {/* ── Content layer ── */}
            <div style={{ position: 'relative', zIndex: 10, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

                {/* Sticky top bar */}
                <TopBar
                    stats={stats}
                    position={position}
                    raffle={raffle}
                    loading={loading}
                    deployed={deployed}
                />

                <main style={{
                    flex: 1,
                    padding: '0 clamp(16px, 5vw, 48px)',
                    paddingBottom: 100,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 28,
                }}>

                    {/* ── Hero: full protocol explanation ── */}
                    <HeroSection />

                    {/* ── Metrics bar: 4 live stats ── */}
                    <MetricsBar
                        stats={stats}
                        raffle={raffle}
                        loading={loading}
                        deployed={deployed}
                    />

                    {/* ── Vault health strip ── */}
                    <VaultHealthPanel
                        stats={stats}
                        raffle={raffle}
                        vaultMotoBalance={vaultMotoBalance}
                    />

                    {/* ── Section label ── */}
                    <SectionDivider label="VAULT DASHBOARD" />

                    {/* ── Row 1: Vault / Yield / Raffle ── */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                        gap: 16,
                    }}>
                        <StakePanel
                            position={position}
                            txPending={txPending}
                            deployed={deployed}
                            error={error}
                            onDeposit={deposit}
                            onWithdraw={withdraw}
                        />
                        <YieldPanel
                            position={position}
                            stats={stats}
                            txPending={txPending}
                            deployed={deployed}
                            onClaim={claimYield}
                        />
                        <RafflePanel
                            stats={stats}
                            userTickets={position.tickets}
                            currentBlock={currentBlock}
                        />
                    </div>

                    {/* ── Row 2: Jackpot + Wheel ── */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                        gap: 16,
                    }}>
                        <JackpotCard
                            stats={stats}
                            raffle={raffle}
                            loading={loading}
                            deployed={deployed}
                            currentBlock={currentBlock}
                        />
                        <WheelPanel />
                    </div>

                    {/* ── Activity feed ── */}
                    <ActivityFeed
                        stats={stats}
                        lastTxId={lastTxId}
                        deployed={deployed}
                    />

                    {/* ── NFT District Vault ── */}
                    <SectionDivider label="DISTRICT NFT VAULT" />
                    <NFTGallery stats={stats} deployed={deployed} />

                    {/* ── Draw History ── */}
                    <SectionDivider label="DRAW HISTORY" />
                    <HistoryPanel />

                </main>

                <TerminalBar message={statusMsg} />
            </div>

            {/* ── TX submission toast ── */}
            <TxToast txId={lastTxId} />

            {/* Responsive hero grid fix */}
            <style>{`
                @media (max-width: 768px) {
                    .hero-responsive {
                        grid-template-columns: 1fr !important;
                    }
                }
            `}</style>
        </div>
    );
}

function SectionDivider({ label }: { label: string }) {
    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            marginTop: 8,
        }}>
            <div style={{ flex: 1, height: 1, background: 'rgba(0,210,255,0.08)' }} />
            <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 9,
                letterSpacing: '0.2em',
                color: 'rgba(61,235,255,0.3)',
                whiteSpace: 'nowrap',
            }}>
                {label}
            </span>
            <div style={{ flex: 1, height: 1, background: 'rgba(0,210,255,0.08)' }} />
        </div>
    );
}
