/**
 * The bottom form panel — matches the reference image:
 * dark panel, green border, two-row layout with
 * green label column | white input/control column,
 * separated by a vertical green line.
 */

import React, { useState, useMemo } from 'react';
import { StakingTier, STAKING_TIERS } from '../config/contracts';
import { StakeInfo } from '../services/StakingService';

// ─── Props ────────────────────────────────────────────────────────────────────

interface TerminalFormProps {
    // new stake
    stakeInfo: StakeInfo | null;
    pendingRewards: bigint;
    selectedTier: StakingTier | null;
    onTierSelect: (t: StakingTier) => void;
    onStake:      (lockBlocks: bigint, satoshis: bigint, csvAddress: string) => Promise<string>;
    onUnstake:    () => Promise<string>;
    onClaim:      () => Promise<string>;
    txPending:    boolean;
    walletConnected: boolean;
    currentBlock: bigint;
}

// ─── Row component ────────────────────────────────────────────────────────────

const FormRow: React.FC<{
    label: string;
    children: React.ReactNode;
    last?: boolean;
}> = ({ label, children, last }) => (
    <div
        style={{
            display: 'grid',
            gridTemplateColumns: '220px 1px 1fr',
            minHeight: '64px',
            borderBottom: last ? 'none' : '1px solid rgba(0,255,65,0.18)',
        }}
    >
        {/* Label column */}
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                padding: '14px 20px',
                fontFamily: 'var(--font-mono)',
                fontSize: '13px',
                color: 'var(--green)',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
            }}
        >
            {label}
        </div>

        {/* Vertical separator */}
        <div style={{ background: 'rgba(0,255,65,0.25)' }} />

        {/* Input column */}
        <div style={{ padding: '14px 20px', display: 'flex', alignItems: 'center' }}>
            {children}
        </div>
    </div>
);

// ─── Main component ───────────────────────────────────────────────────────────

export const TerminalForm: React.FC<TerminalFormProps> = ({
    stakeInfo,
    pendingRewards,
    selectedTier,
    onTierSelect,
    onStake,
    onUnstake,
    onClaim,
    txPending,
    walletConnected,
    currentBlock,
}) => {
    const [satsInput, setSatsInput] = useState('');
    const [txId, setTxId] = useState('');
    const [error, setError] = useState('');

    const isStaking = stakeInfo && stakeInfo.satoshis > 0n;

    const sats = useMemo(() => {
        const v = parseFloat(satsInput);
        return isNaN(v) || v <= 0 ? 0 : Math.floor(v);
    }, [satsInput]);

    const elapsed = isStaking
        ? currentBlock > stakeInfo!.startBlock ? currentBlock - stakeInfo!.startBlock : 0n
        : 0n;

    const isUnlocked = isStaking && currentBlock >= stakeInfo!.unlockBlock;
    const blocksLeft = isStaking && !isUnlocked ? stakeInfo!.unlockBlock - currentBlock : 0n;

    const doStake = async () => {
        if (!selectedTier) { setError('SELECT LOCK DURATION'); return; }
        if (sats < 1000)   { setError('MIN STAKE: 1,000 SATS'); return; }
        setError(''); setTxId('');
        try {
            const id = await onStake(selectedTier.lockBlocks, BigInt(sats), '');
            setTxId(id);
        } catch (e) { setError(e instanceof Error ? e.message : 'TX FAILED'); }
    };

    const doUnstake = async () => {
        setError(''); setTxId('');
        try {
            const id = await onUnstake();
            setTxId(id);
        } catch (e) { setError(e instanceof Error ? e.message : 'TX FAILED'); }
    };

    const doClaim = async () => {
        setError(''); setTxId('');
        try {
            const id = await onClaim();
            setTxId(id);
        } catch (e) { setError(e instanceof Error ? e.message : 'TX FAILED'); }
    };

    // ── Active stake view ──────────────────────────────────────────────────────
    if (isStaking) {
        const pct = stakeInfo!.lockBlocks > 0n
            ? Math.min(100, Number((elapsed * 100n) / stakeInfo!.lockBlocks))
            : 0;

        return (
            <FormPanel txId={txId} error={error}>
                {/* Row 1 — staked amount / rewards */}
                <FormRow label="STAKED AMOUNT">
                    <div style={{ flex: 1 }}>
                        <span style={{ fontFamily: 'var(--font-digit)', fontSize: '18px', color: 'var(--green)', marginRight: '12px' }}>
                            {(Number(stakeInfo!.satoshis) / 1e8).toFixed(6)} BTC
                        </span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'rgba(0,255,65,0.5)' }}>
                            {stakeInfo!.satoshis.toLocaleString()} SATS
                        </span>
                    </div>
                    {pendingRewards > 0n && (
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'rgba(0,255,65,0.45)', marginBottom: '2px' }}>PENDING</div>
                            <div style={{ fontFamily: 'var(--font-digit)', fontSize: '15px', color: 'var(--green)', animation: 'counterUp 0.3s ease-out' }}>
                                {pendingRewards.toString()} HODL
                            </div>
                        </div>
                    )}
                </FormRow>

                {/* Row 2 — progress + actions */}
                <FormRow label="LOCK STATUS" last>
                    <div style={{ flex: 1, marginRight: '16px' }}>
                        <div className="prog-track" style={{ marginBottom: '8px' }}>
                            <div className="prog-fill" style={{ width: `${pct}%` }} />
                        </div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>
                            {isUnlocked
                                ? <span style={{ color: 'var(--green)' }}>UNLOCKED — READY TO WITHDRAW</span>
                                : <>{pct.toFixed(0)}% — {blocksLeft.toString()} BLOCKS REMAINING</>
                            }
                        </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '200px' }}>
                        {pendingRewards > 0n && (
                            <button className="btn-action" onClick={doClaim} disabled={txPending || !walletConnected}
                                style={{ fontSize: '12px', padding: '9px 12px' }}>
                                {txPending ? '...' : 'CLAIM REWARDS.'}
                            </button>
                        )}
                        <button className="btn-action" onClick={doUnstake}
                            disabled={!isUnlocked || txPending || !walletConnected}
                            style={{
                                fontSize: '12px', padding: '9px 12px',
                                background: isUnlocked ? 'var(--green)' : 'transparent',
                                color: isUnlocked ? '#000' : 'rgba(255,255,255,0.25)',
                                border: isUnlocked ? 'none' : '1px solid rgba(255,255,255,0.12)',
                                boxShadow: isUnlocked ? '0 0 14px rgba(0,255,65,0.3)' : 'none',
                            }}>
                            {!isUnlocked ? `LOCKED — ${blocksLeft} BLOCKS` : txPending ? '...' : 'UNSTAKE BTC.'}
                        </button>
                    </div>
                </FormRow>
            </FormPanel>
        );
    }

    // ── New stake view ─────────────────────────────────────────────────────────
    return (
        <FormPanel txId={txId} error={error}>
            {/* Row 1 — stake amount */}
            <FormRow label="INPUT STAKE AMOUNT">
                <input
                    type="number"
                    className="matrix-input"
                    placeholder="satoshis (min 1,000)"
                    value={satsInput}
                    onChange={(e) => setSatsInput(e.target.value)}
                    disabled={txPending || !walletConnected}
                    min="1000"
                    style={{ flex: 1, marginRight: '16px' }}
                />
                {sats > 0 && (
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'rgba(0,255,65,0.6)', whiteSpace: 'nowrap' }}>
                        ₿ {(sats / 1e8).toFixed(6)}
                    </span>
                )}
            </FormRow>

            {/* Row 2 — lock tier + action */}
            <FormRow label="SELECT LOCK DURATION" last>
                <div style={{ flex: 1, display: 'flex', gap: '6px', flexWrap: 'wrap', marginRight: '16px' }}>
                    {STAKING_TIERS.map((t) => (
                        <button
                            key={t.label}
                            className={`tier-pill${selectedTier?.lockBlocks === t.lockBlocks ? ' active' : ''}`}
                            onClick={() => onTierSelect(t)}
                            disabled={txPending}
                            title={`${t.subLabel} · up to ${t.maxMultiplier}`}
                        >
                            {t.label}
                        </button>
                    ))}
                    {selectedTier && (
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'rgba(0,255,65,0.5)', alignSelf: 'center', marginLeft: '4px' }}>
                            up to {selectedTier.maxMultiplier}
                        </span>
                    )}
                </div>
                <button
                    className="btn-action"
                    onClick={doStake}
                    disabled={!walletConnected || sats < 1000 || !selectedTier || txPending}
                    style={{ minWidth: '180px', fontSize: '13px' }}
                >
                    {txPending ? (
                        <><span style={{ opacity: 0.6 }}>PROCESSING</span>&nbsp;
                            <span className="anim-blink">_</span></>
                    ) : 'LOCK IN BTC.'}
                </button>
            </FormRow>
        </FormPanel>
    );
};

// ─── Wrapper ──────────────────────────────────────────────────────────────────

const FormPanel: React.FC<{
    txId: string;
    error: string;
    children: React.ReactNode;
}> = ({ txId, error, children }) => (
    <div className="anim-fade-in">
        <div
            style={{
                background: 'var(--form-bg)',
                border: '1px solid rgba(0,255,65,0.35)',
                boxShadow: '0 0 30px rgba(0,255,65,0.08)',
                backdropFilter: 'blur(4px)',
            }}
        >
            {children}
        </div>

        {/* Error / success below panel */}
        {error && (
            <div className="err" style={{ padding: '8px 20px', borderLeft: '2px solid #ff4444' }}>
                &gt;_ ERROR: {error}
            </div>
        )}
        {txId && (
            <div className="ok" style={{ padding: '8px 20px', borderLeft: '2px solid var(--green)' }}>
                &gt;_ TX CONFIRMED:{' '}
                <a
                    href={`https://testnet.opnet.org/tx/${txId}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: 'var(--green)', textDecoration: 'underline' }}
                >
                    {txId.slice(0, 20)}…
                </a>
            </div>
        )}
    </div>
);
