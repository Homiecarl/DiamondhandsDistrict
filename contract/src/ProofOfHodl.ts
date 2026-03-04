import { u256 } from '@btc-vision/as-bignum/assembly';
import {
    Address,
    AddressMemoryMap,
    Blockchain,
    BytesWriter,
    Calldata,
    encodeSelector,
    OP_NET,
    Revert,
    SafeMath,
    Selector,
    StoredU256,
} from '@btc-vision/btc-runtime/runtime';

// ABIDataTypes, @method, @returns, @emit are transform globals — do NOT import them

// ────────────────────────────────────────────────────────────────────────────
// Constants
// ────────────────────────────────────────────────────────────────────────────

/** Allowed lock tiers (blocks) */
const TIER_1_BLOCKS: u64 = 1_008; //  1 week
const TIER_2_BLOCKS: u64 = 2_016; //  2 weeks
const TIER_3_BLOCKS: u64 = 4_320; //  1 month
const TIER_4_BLOCKS: u64 = 8_640; //  2 months

/** Max multiplier × 1000 for each tier */
const MULT_1_X1000: u64 = 2_000; // 2.0×
const MULT_2_X1000: u64 = 2_500; // 2.5×
const MULT_3_X1000: u64 = 3_000; // 3.0×
const MULT_4_X1000: u64 = 4_000; // 4.0×

/**
 * Reward rate: 1 HODL per 100 000 sat-blocks (at 1× multiplier).
 * rewards = coinBlocks × multiplier_x1000 / (RATE_DENOM × 1000)
 */
const RATE_DENOM: u64 = 100_000_000; // 100_000 × 1000

// ────────────────────────────────────────────────────────────────────────────
// Contract
// ────────────────────────────────────────────────────────────────────────────

export class ProofOfHodl extends OP_NET {
    // ── Selectors ────────────────────────────────────────────────────────
    private readonly stakeSelector: Selector = encodeSelector('stake(uint64)');
    private readonly unstakeSelector: Selector = encodeSelector('unstake()');
    private readonly claimRewardsSelector: Selector = encodeSelector('claimRewards()');
    private readonly getStakeInfoSelector: Selector = encodeSelector('getStakeInfo(address)');
    private readonly getPendingRewardsSelector: Selector = encodeSelector(
        'getPendingRewards(address)',
    );
    private readonly getTotalStakedSelector: Selector = encodeSelector('getTotalStaked()');

    // ── Storage pointers (unique per field) ──────────────────────────────
    private readonly pStakedSats: u16 = Blockchain.nextPointer;
    private readonly pStakeStartBlock: u16 = Blockchain.nextPointer;
    private readonly pStakeLockBlocks: u16 = Blockchain.nextPointer;
    private readonly pRewardsClaimed: u16 = Blockchain.nextPointer;
    private readonly pTotalStaked: u16 = Blockchain.nextPointer;
    private readonly pDeploymentBlock: u16 = Blockchain.nextPointer;

    // ── Storage instances ─────────────────────────────────────────────────
    /** sat amount staked per address */
    private readonly stakedSats: AddressMemoryMap = new AddressMemoryMap(
        this.pStakedSats,
        u256.Zero,
    );
    /** block number when stake was recorded */
    private readonly stakeStartBlock: AddressMemoryMap = new AddressMemoryMap(
        this.pStakeStartBlock,
        u256.Zero,
    );
    /** chosen lock duration in blocks */
    private readonly stakeLockBlocks: AddressMemoryMap = new AddressMemoryMap(
        this.pStakeLockBlocks,
        u256.Zero,
    );
    /** cumulative rewards already claimed */
    private readonly rewardsClaimed: AddressMemoryMap = new AddressMemoryMap(
        this.pRewardsClaimed,
        u256.Zero,
    );
    /** sum of all active stakes (sats) */
    private readonly totalStaked: StoredU256 = new StoredU256(this.pTotalStaked, u256.Zero);
    /** block number at deployment */
    private readonly deploymentBlock: StoredU256 = new StoredU256(
        this.pDeploymentBlock,
        u256.Zero,
    );

    // ── Constructor ────────────────────────────────────────────────────────
    public constructor() {
        super();
        // Selector declarations only — NO storage access here
    }

    // ── Lifecycle ──────────────────────────────────────────────────────────
    public override onDeployment(_calldata: Calldata): void {
        // Runs ONCE at deploy — safe to access storage here
        this.deploymentBlock.set(u256.fromU64(Blockchain.block.number));
    }

    // ── Dispatch ───────────────────────────────────────────────────────────
    public override callMethod(calldata: Calldata): BytesWriter {
        const selector: Selector = calldata.readSelector();

        switch (selector) {
            case this.stakeSelector:
                return this.stake(calldata);
            case this.unstakeSelector:
                return this.unstake(calldata);
            case this.claimRewardsSelector:
                return this.claimRewards(calldata);
            case this.getStakeInfoSelector:
                return this.getStakeInfo(calldata);
            case this.getPendingRewardsSelector:
                return this.getPendingRewards(calldata);
            case this.getTotalStakedSelector:
                return this.getTotalStaked(calldata);
            default:
                return super.callMethod(calldata);
        }
    }

    // ── Methods ────────────────────────────────────────────────────────────

    /**
     * Lock BTC into a CSV P2WSH output for the chosen tier.
     * The transaction must include a P2WSH output; its value becomes stakedSats.
     */
    @method({ name: 'lockBlocks', type: ABIDataTypes.UINT64 })
    @returns({ name: 'success', type: ABIDataTypes.BOOL })
    public stake(calldata: Calldata): BytesWriter {
        const lockBlocks: u64 = calldata.readU64();
        const sender: Address = Blockchain.tx.sender;

        // Revert if already staking
        const existing: u256 = this.stakedSats.get(sender).get();
        if (!u256.eq(existing, u256.Zero)) {
            throw new Revert('Already have an active stake');
        }

        // Validate lock tier
        const maxMult: u64 = this._getMaxMult(lockBlocks);
        if (maxMult === 0) {
            throw new Revert('Invalid lock tier: choose 1008, 2016, 4320, or 8640 blocks');
        }

        // Scan tx outputs for P2WSH deposit
        const outputs = Blockchain.tx.outputs;
        let stakedValue: u64 = 0;

        for (let i: i32 = 0; i < outputs.length; i++) {
            const output = outputs[i];
            const script: Uint8Array | null = output.scriptPublicKey;
            if (script !== null && this._isP2WSH(script)) {
                stakedValue = output.value;
                break;
            }
        }

        if (stakedValue === 0) {
            throw new Revert('No P2WSH output found in transaction');
        }

        // Record stake
        this.stakedSats.get(sender).set(u256.fromU64(stakedValue));
        this.stakeStartBlock.get(sender).set(u256.fromU64(Blockchain.block.number));
        this.stakeLockBlocks.get(sender).set(u256.fromU64(lockBlocks));

        // Update global total
        const newTotal: u256 = SafeMath.add(this.totalStaked.get(), u256.fromU64(stakedValue));
        this.totalStaked.set(newTotal);

        const writer = new BytesWriter(1);
        writer.writeBoolean(true);
        return writer;
    }

    /**
     * Release stake after lock period expires. Clears all stake state.
     */
    @method()
    public unstake(_calldata: Calldata): BytesWriter {
        const sender: Address = Blockchain.tx.sender;
        const sats: u256 = this.stakedSats.get(sender).get();

        if (u256.eq(sats, u256.Zero)) {
            throw new Revert('No active stake');
        }

        const startBlock: u64 = this.stakeStartBlock.get(sender).get().lo1;
        const lockBlocks: u64 = this.stakeLockBlocks.get(sender).get().lo1;

        if (Blockchain.block.number < startBlock + lockBlocks) {
            throw new Revert('Lock period has not expired yet');
        }

        // Subtract from total
        const total: u256 = this.totalStaked.get();
        if (u256.gte(sats, total)) {
            this.totalStaked.set(u256.Zero);
        } else {
            this.totalStaked.set(SafeMath.sub(total, sats));
        }

        // Clear all stake state for sender
        this.stakedSats.get(sender).set(u256.Zero);
        this.stakeStartBlock.get(sender).set(u256.Zero);
        this.stakeLockBlocks.get(sender).set(u256.Zero);
        this.rewardsClaimed.get(sender).set(u256.Zero);

        const writer = new BytesWriter(1);
        writer.writeBoolean(true);
        return writer;
    }

    /**
     * Claim all pending HODL rewards (accumulates rewardsClaimed).
     * Returns the amount claimed.
     */
    @method()
    public claimRewards(_calldata: Calldata): BytesWriter {
        const sender: Address = Blockchain.tx.sender;
        const sats: u256 = this.stakedSats.get(sender).get();

        if (u256.eq(sats, u256.Zero)) {
            throw new Revert('No active stake');
        }

        const pending: u256 = this._computePendingRewards(sender);

        // Accumulate claimed
        const prevClaimed: u256 = this.rewardsClaimed.get(sender).get();
        this.rewardsClaimed.get(sender).set(SafeMath.add(prevClaimed, pending));

        const writer = new BytesWriter(32);
        writer.writeU256(pending);
        return writer;
    }

    /**
     * Returns staking info for any address.
     */
    @method({ name: 'staker', type: ABIDataTypes.ADDRESS })
    @returns(
        { name: 'satoshis', type: ABIDataTypes.UINT64 },
        { name: 'startBlock', type: ABIDataTypes.UINT64 },
        { name: 'lockBlocks', type: ABIDataTypes.UINT64 },
        { name: 'unlockBlock', type: ABIDataTypes.UINT64 },
    )
    public getStakeInfo(calldata: Calldata): BytesWriter {
        const staker: Address = calldata.readAddress();

        const sats: u64 = this.stakedSats.get(staker).get().lo1;
        const startBlock: u64 = this.stakeStartBlock.get(staker).get().lo1;
        const lockBlocks: u64 = this.stakeLockBlocks.get(staker).get().lo1;
        const unlockBlock: u64 = startBlock + lockBlocks;

        const writer = new BytesWriter(32);
        writer.writeU64(sats);
        writer.writeU64(startBlock);
        writer.writeU64(lockBlocks);
        writer.writeU64(unlockBlock);
        return writer;
    }

    /**
     * Returns pending (unclaimed) HODL rewards for a staker.
     */
    @method({ name: 'staker', type: ABIDataTypes.ADDRESS })
    @returns({ name: 'pending', type: ABIDataTypes.UINT256 })
    public getPendingRewards(calldata: Calldata): BytesWriter {
        const staker: Address = calldata.readAddress();
        const pending: u256 = this._computePendingRewards(staker);

        const writer = new BytesWriter(32);
        writer.writeU256(pending);
        return writer;
    }

    /**
     * Returns total satoshis currently staked across all users.
     */
    @method()
    @returns({ name: 'total', type: ABIDataTypes.UINT256 })
    public getTotalStaked(_calldata: Calldata): BytesWriter {
        const writer = new BytesWriter(32);
        writer.writeU256(this.totalStaked.get());
        return writer;
    }

    // ── Private helpers ────────────────────────────────────────────────────

    private _isP2WSH(script: Uint8Array): bool {
        // OP_0 <32-byte-hash>  =  0x00 0x20 <32 bytes>
        return script.length === 34 && script[0] === 0x00 && script[1] === 0x20;
    }

    /** Returns maxMult × 1000 for an allowed tier, or 0 if invalid. */
    private _getMaxMult(lockBlocks: u64): u64 {
        if (lockBlocks === TIER_1_BLOCKS) return MULT_1_X1000;
        if (lockBlocks === TIER_2_BLOCKS) return MULT_2_X1000;
        if (lockBlocks === TIER_3_BLOCKS) return MULT_3_X1000;
        if (lockBlocks === TIER_4_BLOCKS) return MULT_4_X1000;
        return 0;
    }

    /**
     * Reward formula (all math in u256 to avoid overflow):
     *
     *   elapsed        = min(currentBlock − startBlock, lockBlocks)
     *   multiplier×1000 = 1000 + elapsed × (maxMult×1000 − 1000) / lockBlocks
     *   coinBlocks      = stakedSats × elapsed
     *   totalRewards    = coinBlocks × multiplier×1000 / (100_000 × 1000)
     *   pending         = totalRewards − rewardsClaimed
     */
    private _computePendingRewards(staker: Address): u256 {
        const sats: u256 = this.stakedSats.get(staker).get();
        if (u256.eq(sats, u256.Zero)) return u256.Zero;

        const startBlock: u64 = this.stakeStartBlock.get(staker).get().lo1;
        const lockBlocks: u64 = this.stakeLockBlocks.get(staker).get().lo1;
        const currentBlock: u64 = Blockchain.block.number;

        const elapsedRaw: u64 = currentBlock > startBlock ? currentBlock - startBlock : 0;
        const elapsed: u64 = elapsedRaw < lockBlocks ? elapsedRaw : lockBlocks;

        if (elapsed === 0) return u256.Zero;

        const maxMult: u64 = this._getMaxMult(lockBlocks);
        if (maxMult === 0) return u256.Zero;

        // u256 conversions
        const elapsed256: u256 = u256.fromU64(elapsed);
        const lockBlocks256: u256 = u256.fromU64(lockBlocks);
        const maxMultDiff256: u256 = u256.fromU64(maxMult - 1000); // (maxMult×1000 − 1000)

        // multiplier×1000 = 1000 + elapsed × (maxMult×1000 − 1000) / lockBlocks
        const multNumerator: u256 = SafeMath.mul(elapsed256, maxMultDiff256);
        const multProgress: u256 = SafeMath.div(multNumerator, lockBlocks256);
        const multiplier_x1000: u256 = SafeMath.add(u256.fromU64(1000), multProgress);

        // coinBlocks = sats × elapsed
        const coinBlocks: u256 = SafeMath.mul(sats, elapsed256);

        // totalRewards = coinBlocks × multiplier×1000 / (100_000 × 1000)
        const rewardsRaw: u256 = SafeMath.mul(coinBlocks, multiplier_x1000);
        const denom: u256 = u256.fromU64(RATE_DENOM);
        const totalRewards: u256 = SafeMath.div(rewardsRaw, denom);

        // pending = totalRewards − rewardsClaimed
        const claimed: u256 = this.rewardsClaimed.get(staker).get();
        if (u256.gte(claimed, totalRewards)) return u256.Zero;
        return SafeMath.sub(totalRewards, claimed);
    }
}
