import React from 'react';
import { STAKING_TIERS, StakingTier } from '../config/contracts';

interface TierSelectorProps {
    selectedTier: StakingTier | null;
    onSelect: (tier: StakingTier) => void;
}

export const TierSelector: React.FC<TierSelectorProps> = ({ selectedTier, onSelect }) => {
    return (
        <div>
            <h3
                style={{
                    fontSize: '12px',
                    color: '#666',
                    letterSpacing: '0.15em',
                    marginBottom: '16px',
                    textTransform: 'uppercase',
                }}
            >
                SELECT LOCK DURATION
            </h3>
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '12px',
                }}
            >
                {STAKING_TIERS.map((tier) => {
                    const isSelected = selectedTier?.lockBlocks === tier.lockBlocks;
                    return (
                        <button
                            key={tier.label}
                            onClick={() => onSelect(tier)}
                            style={{
                                background: isSelected
                                    ? `rgba(${hexToRgb(tier.color)}, 0.12)`
                                    : '#161616',
                                border: `1px solid ${isSelected ? tier.color : 'rgba(255,255,255,0.08)'}`,
                                borderRadius: '12px',
                                padding: '20px 16px',
                                cursor: 'pointer',
                                textAlign: 'left',
                                transition: 'all 200ms ease',
                                boxShadow: isSelected
                                    ? `0 0 24px rgba(${hexToRgb(tier.color)}, 0.3)`
                                    : 'none',
                            }}
                            className={isSelected ? 'tier-card-selected' : ''}
                        >
                            {/* Tier name */}
                            <div
                                style={{
                                    fontSize: '16px',
                                    fontWeight: 700,
                                    color: isSelected ? tier.color : '#e0e0e0',
                                    letterSpacing: '0.08em',
                                    marginBottom: '6px',
                                }}
                            >
                                {tier.label}
                            </div>

                            {/* Block count */}
                            <div
                                style={{
                                    fontSize: '12px',
                                    color: '#888',
                                    marginBottom: '12px',
                                }}
                            >
                                {tier.subLabel}
                            </div>

                            {/* Multiplier */}
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                }}
                            >
                                <span
                                    style={{
                                        fontSize: '11px',
                                        color: '#666',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.1em',
                                    }}
                                >
                                    up to
                                </span>
                                <span
                                    style={{
                                        fontSize: '20px',
                                        fontWeight: 700,
                                        color: tier.color,
                                    }}
                                >
                                    {tier.maxMultiplier}
                                </span>
                            </div>

                            {/* Selected indicator */}
                            {isSelected && (
                                <div
                                    style={{
                                        marginTop: '10px',
                                        fontSize: '11px',
                                        color: tier.color,
                                        letterSpacing: '0.1em',
                                        opacity: 0.8,
                                    }}
                                >
                                    ✓ SELECTED
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

function hexToRgb(hex: string): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `${r}, ${g}, ${b}`;
}
