import { useWalletConnect } from '@btc-vision/walletconnect';
import { MatrixRain }      from './components/MatrixRain';
import { ScanLines }       from './components/ScanLines';
import { PerspectiveGrid } from './components/PerspectiveGrid';
import { TerminalBar }     from './components/TerminalBar';
import { WalletConnect }   from './components/WalletConnect';
import { JackpotCard }     from './components/JackpotCard';
import { StakePanel }      from './components/StakePanel';
import { YieldPanel }      from './components/YieldPanel';
import { RafflePanel }     from './components/RafflePanel';
import { ProtocolStats }   from './components/ProtocolStats';
import { useVault }        from './hooks/useVault';
import './styles/globals.css';

export default function App() {
    const { walletAddress } = useWalletConnect();
    const connected = !!walletAddress;

    const {
        stats,
        position,
        loading,
        txPending,
        error,
        lastTxId,
        deployed,
        deposit,
        withdraw,
        claimYield,
    } = useVault();

    const statusMsg = lastTxId
        ? `TX submitted: ${lastTxId.slice(0, 16)}...`
        : txPending
        ? 'Broadcasting transaction...'
        : connected
        ? 'Wallet active. District access granted.'
        : 'Connect your wallet to jack in.';

    return (
        <div style={{ position: 'relative', minHeight: '100vh', overflow: 'hidden' }}>

            {/* ── Backgrounds ── */}
            <MatrixRain />
            <PerspectiveGrid />
            <ScanLines />

            {/* ── Content ── */}
            <div style={{
                position: 'relative', zIndex: 10,
                minHeight: '100vh', display: 'flex', flexDirection: 'column',
            }}>

                {/* Header */}
                <header style={{
                    padding: '12px 32px',
                    borderBottom: '1px solid rgba(0,200,255,0.1)',
                    background: 'rgba(2,11,24,0.6)',
                    backdropFilter: 'blur(8px)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                    <span className="term term-dim" style={{ fontSize: '11px', letterSpacing: '0.15em' }}>
                        DIAMONDHANDS_DISTRICT.EXE
                    </span>
                    <WalletConnect onStatusChange={() => {}} />
                </header>

                {/* Main layout */}
                <main style={{
                    flex: 1,
                    padding: '32px 6vw',
                    paddingBottom: '120px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 24,
                }}>

                    {/* Headline + Jackpot row */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'space-between',
                        gap: 32,
                        flexWrap: 'wrap',
                    }}>
                        {/* Left: headline */}
                        <div style={{ minWidth: 260 }}>
                            <h1 className="headline" style={{ marginBottom: 16, fontSize: 'clamp(28px,4vw,52px)' }}>
                                ENTER THE DISTRICT.<br />
                                HOLD THE <span className="blue">LINE.</span>
                            </h1>
                            <p className="term" style={{ fontSize: 13, marginTop: 0 }}>
                                {connected ? '> District access granted.' : '> Connect wallet to access.'}
                            </p>
                        </div>

                        {/* Right: Jackpot */}
                        <JackpotCard stats={stats} loading={loading} deployed={deployed} />
                    </div>

                    {/* Dashboard grid */}
                    {connected ? (
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
                                txPending={txPending}
                                deployed={deployed}
                                onClaim={claimYield}
                            />
                            <RafflePanel
                                stats={stats}
                                userTickets={position.tickets}
                            />
                        </div>
                    ) : (
                        <div style={{
                            border: '1px solid rgba(0,200,255,0.1)',
                            borderRadius: 4,
                            padding: '40px',
                            textAlign: 'center',
                            background: 'rgba(0,10,25,0.6)',
                        }}>
                            <div style={{
                                fontFamily: 'var(--font-digit)',
                                fontSize: 40,
                                filter: 'drop-shadow(0 0 18px rgba(0,200,255,0.4))',
                                marginBottom: 16,
                            }}>
                                💎
                            </div>
                            <p className="term term-dim" style={{ fontSize: 12 }}>
                                Connect your wallet to access the vault dashboard.
                            </p>
                        </div>
                    )}
                </main>

                {/* Stats bar */}
                <ProtocolStats stats={stats} loading={loading} deployed={deployed} />
            </div>

            <TerminalBar message={statusMsg} />
        </div>
    );
}
