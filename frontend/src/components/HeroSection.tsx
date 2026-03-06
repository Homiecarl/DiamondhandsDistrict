export function HeroSection() {
    return (
        <section style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)',
            gap: 32,
            padding: '40px 0 8px',
        }}
        className="hero-responsive"
        >
            {/* ── Left: Core message ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div>
                    <h1 className="headline" style={{ marginBottom: 12 }}>
                        ENTER THE DISTRICT.<br />
                        HOLD THE <span className="gold">LINE.</span>
                    </h1>
                    <p style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 14,
                        color: 'rgba(255,255,255,0.6)',
                        letterSpacing: '0.04em',
                        marginBottom: 4,
                    }}>
                        Welcome to Diamond District.
                    </p>
                    <p style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 12,
                        color: 'rgba(255,255,255,0.4)',
                        marginBottom: 12,
                    }}>
                        A community-powered Bitcoin prize vault where:
                    </p>

                    {/* Bullet points */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <HeroBullet icon="₿" color="var(--gold)" iconBg="var(--gold-bg)">
                            Stake <span style={{ color: 'var(--gold)', fontWeight: 700 }}>Bitcoin</span>
                        </HeroBullet>
                        <HeroBullet icon="⚡" color="var(--purple)" iconBg="var(--purple-bg)">
                            Earn <span style={{ color: 'var(--purple)', fontWeight: 700 }}>MOTO yield</span> every block
                        </HeroBullet>
                        <HeroBullet icon="🎟" color="var(--cyan)" iconBg="rgba(61,235,255,0.08)">
                            Collect raffle tickets automatically
                        </HeroBullet>
                        <HeroBullet icon="🏆" color="var(--gold)" iconBg="var(--gold-bg)">
                            Compete for the <span style={{ color: 'var(--gold)', fontWeight: 700 }}>District Jackpot</span>
                        </HeroBullet>
                        <HeroBullet icon="🎨" color="var(--purple)" iconBg="var(--purple-bg)">
                            Unlock <span style={{ color: 'var(--purple)', fontWeight: 700 }}>NFT rewards</span>
                        </HeroBullet>
                    </div>
                </div>

            </div>

            {/* ── Right: How It Works ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 8 }}>
                <div className="label-sm" style={{ marginBottom: 6 }}>HOW IT WORKS</div>

                <HowItWorksStep
                    num="①"
                    title="STAKE BTC"
                    body="Lock Bitcoin in the vault. Earn MOTO yield every block. Receive raffle tickets proportional to your stake and hold time."
                    accentColor="var(--gold)"
                />
                <HowItWorksStep
                    num="②"
                    title="COMPETE IN THE DRAW"
                    body="Every ~28 days, a provably fair jackpot wheel spins. The wheel determines what % of the prize pool is distributed to winners."
                    accentColor="var(--cyan)"
                />
                <HowItWorksStep
                    num="③"
                    title="WIN OR KEEP EARNING"
                    body="Winners split the jackpot in proportion to their tickets. Non-winners continue earning MOTO. Your BTC is always yours to withdraw."
                    accentColor="var(--purple)"
                />

                {/* Earn while you wait callout */}
                <div style={{
                    marginTop: 4,
                    background: '#0f1020',
                    border: '1px solid rgba(139,92,246,0.25)',
                    borderRadius: 10,
                    padding: '12px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                }}>
                    <span style={{ fontSize: 16 }}>⚡</span>
                    <div>
                        <div style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: 10,
                            letterSpacing: '0.12em',
                            color: 'var(--purple)',
                            marginBottom: 3,
                        }}>
                            EARN WHILE YOU WAIT
                        </div>
                        <div style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: 10,
                            color: 'rgba(255,255,255,0.35)',
                        }}>
                            MOTO yield accrues every block regardless of raffle outcome.
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

function HeroBullet({ icon, color, iconBg, children }: {
    icon: string;
    color: string;
    iconBg: string;
    children: React.ReactNode;
}) {
    return (
        <div className="hero-bullet">
            <div className="bullet-icon" style={{ background: iconBg, border: `1px solid ${color}30` }}>
                {icon}
            </div>
            <span>{children}</span>
        </div>
    );
}

function HowItWorksStep({ num, title, body, accentColor }: {
    num: string;
    title: string;
    body: string;
    accentColor: string;
}) {
    return (
        <div className="hiw-step">
            <div className="hiw-num" style={{ color: accentColor, textShadow: `0 0 12px ${accentColor}60` }}>
                {num}
            </div>
            <div style={{ flex: 1 }}>
                <div className="hiw-body-title" style={{ color: accentColor }}>{title}</div>
                <div className="hiw-body-text">{body}</div>
            </div>
        </div>
    );
}

