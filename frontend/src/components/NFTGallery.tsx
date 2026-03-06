import { useState } from 'react';
import { type ProtocolStats } from '../services/ContractService';
import { SAT_PER_BTC } from '../config/contracts';

const RARITY_CLASS: Record<string, string> = {
    LEGENDARY: 'rarity-legendary',
    EPIC: 'rarity-epic',
    RARE: 'rarity-rare',
    UNCOMMON: 'rarity-uncommon',
    COMMON: 'rarity-common',
};

const RARITY_ICON: Record<string, string> = {
    LEGENDARY: '★★★★★',
    EPIC:      '★★★★☆',
    RARE:      '★★★☆☆',
    UNCOMMON:  '★★☆☆☆',
    COMMON:    '★☆☆☆☆',
};

const NFT_PLACEHOLDERS = [
    { id: 1, name: 'Diamond Hands #001', rarity: 'LEGENDARY', howToWin: 'Milestone Event', estValue: '0.05 BTC', emoji: '💎' },
    { id: 2, name: 'HODLer Supreme #042', rarity: 'EPIC',      howToWin: 'Winner Drop',    estValue: '0.02 BTC', emoji: '🏆' },
    { id: 3, name: 'Satoshi Disciple #007', rarity: 'RARE',   howToWin: 'Mega Draw',      estValue: '0.01 BTC', emoji: '₿' },
    { id: 4, name: 'Crystal Hands #013', rarity: 'UNCOMMON',  howToWin: 'Bonus Drop',     estValue: '0.005 BTC', emoji: '💠' },
    { id: 5, name: 'Vault Guardian #099', rarity: 'RARE',     howToWin: 'Milestone Event', estValue: '0.01 BTC', emoji: '🛡' },
    { id: 6, name: 'Block Forge #077', rarity: 'COMMON',      howToWin: 'Bonus Drop',     estValue: '0.003 BTC', emoji: '⛏' },
];

const MOCK_WINNERS = [
    { drawId: '—', nft: 'Diamond Hands #001', winner: '—', date: '—' },
];

type Tab = 'upcoming' | 'gallery' | 'winners';

interface Props {
    stats: ProtocolStats;
    deployed: boolean;
}

export function NFTGallery({ stats, deployed }: Props) {
    const [tab, setTab] = useState<Tab>('gallery');

    const treasury = deployed
        ? (Number(stats.nftTreasury) / Number(SAT_PER_BTC)).toFixed(6)
        : '—';

    return (
        <div className="card fade-up">
            {/* Header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 20,
                flexWrap: 'wrap',
                gap: 12,
            }}>
                <div className="label-sm" style={{ marginBottom: 0 }}>DISTRICT NFT VAULT</div>

                {/* Tabs */}
                <div style={{ display: 'flex', gap: 4 }}>
                    {(['upcoming', 'gallery', 'winners'] as Tab[]).map(t => (
                        <button
                            key={t}
                            onClick={() => setTab(t)}
                            style={{
                                background: tab === t ? 'rgba(139,92,246,0.15)' : 'transparent',
                                border: `1px solid ${tab === t ? 'rgba(139,92,246,0.45)' : 'rgba(0,210,255,0.12)'}`,
                                borderRadius: 6,
                                color: tab === t ? 'var(--purple)' : 'rgba(61,235,255,0.35)',
                                fontFamily: 'var(--font-mono)',
                                fontSize: 10,
                                letterSpacing: '0.12em',
                                padding: '5px 12px',
                                cursor: 'pointer',
                                transition: 'all 0.15s',
                                textTransform: 'uppercase',
                            }}
                        >
                            {t}
                        </button>
                    ))}
                </div>
            </div>

            {/* Upcoming tab */}
            {tab === 'upcoming' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                        <div>
                            <div className="label-sm">NFT TREASURY</div>
                            <div className="num-gold" style={{ fontSize: 28 }}>{treasury} <span style={{ fontSize: 13, color: 'var(--gold-dim)' }}>BTC</span></div>
                        </div>
                        <div>
                            <div className="label-sm">NEXT BUYBACK TARGET</div>
                            <div style={{ fontFamily: 'var(--font-digit)', fontSize: 20, color: 'rgba(255,255,255,0.5)' }}>0.02 BTC</div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 4 }}>
                        <UpcomingChip label="NEXT DROP" value="Milestone Event" />
                        <UpcomingChip label="TRIGGER" value="0.10 BTC Prize Pool" />
                        <UpcomingChip label="BONUS DROP" value="Every Mega Draw" />
                    </div>

                    <div style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 10,
                        color: 'rgba(255,255,255,0.25)',
                        marginTop: 4,
                        lineHeight: 1.8,
                    }}>
                        NFTs are distributed at milestone events, mega draws, and bonus drops.<br />
                        1% of all prize pool activity funds the NFT treasury.
                    </div>
                </div>
            )}

            {/* Gallery tab */}
            {tab === 'gallery' && (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                    gap: 12,
                }}>
                    {NFT_PLACEHOLDERS.map(nft => (
                        <NFTCard key={nft.id} {...nft} />
                    ))}
                </div>
            )}

            {/* Winners tab */}
            {tab === 'winners' && (
                <div>
                    {MOCK_WINNERS[0].drawId === '—' ? (
                        <div style={{
                            textAlign: 'center',
                            padding: '32px 0',
                            fontFamily: 'var(--font-mono)',
                            fontSize: 11,
                            color: 'rgba(61,235,255,0.25)',
                        }}>
                            No NFT winners yet — first draw coming soon.
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {MOCK_WINNERS.map((w, i) => (
                                <div key={i} style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '10px 14px',
                                    background: '#0f1020',
                                    border: '1px solid rgba(139,92,246,0.12)',
                                    borderRadius: 8,
                                }}>
                                    <span style={{ fontFamily: 'var(--font-digit)', fontSize: 11, color: 'var(--purple)' }}>{w.nft}</span>
                                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>{w.winner}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

function NFTCard({ emoji, name, rarity, howToWin, estValue }: typeof NFT_PLACEHOLDERS[0]) {
    const rarityClass = RARITY_CLASS[rarity] ?? 'rarity-common';
    return (
        <div style={{
            background: '#0d1a28',
            border: '1px solid rgba(0,210,255,0.1)',
            borderRadius: 12,
            padding: '14px 12px',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            transition: 'border-color 0.2s, transform 0.2s',
            cursor: 'default',
        }}
        onMouseEnter={e => {
            (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(139,92,246,0.35)';
            (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
        }}
        onMouseLeave={e => {
            (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(0,210,255,0.1)';
            (e.currentTarget as HTMLDivElement).style.transform = '';
        }}>
            {/* Placeholder art */}
            <div style={{
                height: 80,
                borderRadius: 8,
                background: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(245,200,76,0.08))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 32,
                border: '1px solid rgba(139,92,246,0.12)',
            }}>
                {emoji}
            </div>

            {/* Name */}
            <div style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                color: 'rgba(255,255,255,0.7)',
                lineHeight: 1.3,
            }}>
                {name}
            </div>

            {/* Rarity */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 8,
                    letterSpacing: '0.1em',
                    padding: '2px 7px',
                    borderRadius: 4,
                    border: '1px solid',
                }} className={rarityClass}>
                    {rarity}
                </span>
                <span style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 9,
                    color: 'rgba(255,255,255,0.25)',
                }}>
                    {RARITY_ICON[rarity]}
                </span>
            </div>

            {/* How to win */}
            <div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'rgba(61,235,255,0.3)', marginBottom: 2 }}>HOW TO WIN</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>{howToWin}</div>
            </div>

            {/* Est value */}
            <div style={{ fontFamily: 'var(--font-digit)', fontSize: 11, color: 'var(--gold)' }}>
                ~{estValue}
            </div>
        </div>
    );
}

function UpcomingChip({ label, value }: { label: string; value: string }) {
    return (
        <div style={{
            background: '#120f07',
            border: '1px solid rgba(245,200,76,0.2)',
            borderRadius: 8,
            padding: '8px 14px',
        }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'rgba(245,200,76,0.5)', marginBottom: 3 }}>{label}</div>
            <div style={{ fontFamily: 'var(--font-digit)', fontSize: 11, color: 'var(--gold)' }}>{value}</div>
        </div>
    );
}
