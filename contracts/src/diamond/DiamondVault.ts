import { u256 } from '@btc-vision/as-bignum/assembly';
import {
    Address,
    Blockchain,
    BytesWriter,
    Calldata,
    OP_NET,
    Revert,
    SafeMath,
    Selector,
    StoredMapU256,
    StoredU256,
    encodeSelector,
    ADDRESS_BYTE_LENGTH,
    U256_BYTE_LENGTH,
} from '@btc-vision/btc-runtime/runtime';

import {
    DepositedEvent,
    DeployedEvent,
    EntriesClosedEvent,
    JackpotReleasedEvent,
    JackpotSeededEvent,
    MilestoneReachedEvent,
    MotoAddedEvent,
    MotoTransferEvent,
    RaffleOpenedEvent,
    ThresholdBoostEvent,
    TicketsAssignedEvent,
    WhaleDepositEvent,
    WheelSpunEvent,
    WinnerSelectedEvent,
    WinnersSelectedEvent,
    WithdrawnEvent,
    YieldClaimedEvent,
} from './events';

// ── Time constants (blocks) ───────────────────────────────────────────────
const BLOCKS_PER_DAY: u64 = 144;
const ENTRY_BLOCKS: u64 = BLOCKS_PER_DAY * 14; // 2 016
const DRAW_BLOCKS: u64 = BLOCKS_PER_DAY * 28; // 4 032
const MAX_PARTICIPANTS: u32 = 100;
const WINNER_COUNT: u32 = 10;

// ── Fee: 0.09% = 90 / 100 000 ────────────────────────────────────────────
const FEE_NUM: u256 = u256.fromU32(90);
const FEE_DENOM: u256 = u256.fromU32(100000);

// ── Yield split (bps / 10 000) ───────────────────────────────────────────
const USER_BPS: u256 = u256.fromU32(9200);
const POOL_BPS: u256 = u256.fromU32(800);
const USER_BOOST_BPS: u256 = u256.fromU32(9000);
const POOL_BOOST_BPS: u256 = u256.fromU32(1000);
const YIELD_DENOM: u256 = u256.fromU32(10000);
const ACC_SCALE: u256 = u256.fromString('1000000000000'); // 1e12

// ── Jackpot split (bps / 10 000) ─────────────────────────────────────────
const WINNERS_BPS: u256 = u256.fromU32(9000);
const RECYCLE_BPS: u256 = u256.fromU32(900);
const NFT_BPS: u256 = u256.fromU32(100);
const JACKPOT_DENOM: u256 = u256.fromU32(10000);

// ── Wheel roll boundaries (seed mod 1 000) ───────────────────────────────
const WHEEL_100_MAX: u256 = u256.fromU32(69);
const WHEEL_75_MAX: u256 = u256.fromU32(299);
const WHEEL_50_MAX: u256 = u256.fromU32(718);

// ── Milestones in satoshis ────────────────────────────────────────────────
const M0: u256 = u256.fromU32(10000000); // 0.10 BTC
const M1: u256 = u256.fromU32(25000000); // 0.25 BTC
const M2: u256 = u256.fromU32(50000000); // 0.50 BTC
const M3: u256 = u256.fromU32(100000000); // 1.00 BTC
const BOOST_BPS: u256 = u256.fromU32(8000); // 80 %

// ── Raffle state constants ────────────────────────────────────────────────
const STATE_OPEN: u256 = u256.Zero;
const STATE_CLOSED: u256 = u256.One;
const STATE_DRAWN: u256 = u256.fromU32(2);

// ── Sentinel raffle ids ───────────────────────────────────────────────────
const NO_RAFFLE: u256 = u256.fromU64(0xffffffff);
const QUEUED: u256 = u256.fromU64(0xfffffffe);

// ── Whale threshold: 0.1 BTC ──────────────────────────────────────────────
const WHALE_SAT: u256 = u256.fromU32(10000000);

// ── Empty sub-pointer for StoredU256 ─────────────────────────────────────
function emptySubPtr(): Uint8Array {
    return new Uint8Array(30);
}

@final
export class DiamondVault extends OP_NET {
    // ── Pointer declarations ──────────────────────────────────────────────
    private readonly pUserStake: u16 = Blockchain.nextPointer;
    private readonly pUserDebt: u16 = Blockchain.nextPointer;
    private readonly pUserRaffle: u16 = Blockchain.nextPointer;
    private readonly pUserEntry: u16 = Blockchain.nextPointer;
    private readonly pTotalStaked: u16 = Blockchain.nextPointer;
    private readonly pAccMoto: u16 = Blockchain.nextPointer;
    private readonly pLastBlock: u16 = Blockchain.nextPointer;
    private readonly pMpb: u16 = Blockchain.nextPointer; // moto per block
    private readonly pMotoPool: u16 = Blockchain.nextPointer;
    private readonly pRaffleId: u16 = Blockchain.nextPointer;
    private readonly pRStart: u16 = Blockchain.nextPointer;
    private readonly pRClose: u16 = Blockchain.nextPointer;
    private readonly pRDraw: u16 = Blockchain.nextPointer;
    private readonly pRState: u16 = Blockchain.nextPointer;
    private readonly pRTix: u16 = Blockchain.nextPointer;
    private readonly pRCount: u16 = Blockchain.nextPointer;
    private readonly pParticipant: u16 = Blockchain.nextPointer;
    private readonly pUserTix: u16 = Blockchain.nextPointer;
    private readonly pInRaffle: u16 = Blockchain.nextPointer;
    private readonly pPrizePool: u16 = Blockchain.nextPointer;
    private readonly pMsIdx: u16 = Blockchain.nextPointer;
    private readonly pBoost: u16 = Blockchain.nextPointer;
    private readonly pNftTreasury: u16 = Blockchain.nextPointer;
    private readonly pMotoToken: u16 = Blockchain.nextPointer;
    private readonly pOwner: u16 = Blockchain.nextPointer;
    private readonly pSeeded: u16 = Blockchain.nextPointer;

    // ── Storage instances (inline-initialized in declaration order) ───────
    private readonly userStake: StoredMapU256 = new StoredMapU256(this.pUserStake);
    private readonly userDebt: StoredMapU256 = new StoredMapU256(this.pUserDebt);
    private readonly userRaffle: StoredMapU256 = new StoredMapU256(this.pUserRaffle);
    private readonly userEntry: StoredMapU256 = new StoredMapU256(this.pUserEntry);
    private readonly totalStaked: StoredU256 = new StoredU256(
        this.pTotalStaked,
        emptySubPtr(),
    );
    private readonly accMoto: StoredU256 = new StoredU256(this.pAccMoto, emptySubPtr());
    private readonly lastBlock: StoredU256 = new StoredU256(this.pLastBlock, emptySubPtr());
    private readonly mpb: StoredU256 = new StoredU256(this.pMpb, emptySubPtr());
    private readonly motoPool: StoredU256 = new StoredU256(this.pMotoPool, emptySubPtr());
    private readonly raffleId: StoredU256 = new StoredU256(this.pRaffleId, emptySubPtr());
    private readonly rStart: StoredMapU256 = new StoredMapU256(this.pRStart);
    private readonly rClose: StoredMapU256 = new StoredMapU256(this.pRClose);
    private readonly rDraw: StoredMapU256 = new StoredMapU256(this.pRDraw);
    private readonly rState: StoredMapU256 = new StoredMapU256(this.pRState);
    private readonly rTix: StoredMapU256 = new StoredMapU256(this.pRTix);
    private readonly rCount: StoredMapU256 = new StoredMapU256(this.pRCount);
    private readonly participant: StoredMapU256 = new StoredMapU256(this.pParticipant);
    private readonly userTix: StoredMapU256 = new StoredMapU256(this.pUserTix);
    private readonly inRaffle: StoredMapU256 = new StoredMapU256(this.pInRaffle);
    private readonly prizePool: StoredU256 = new StoredU256(this.pPrizePool, emptySubPtr());
    private readonly msIdx: StoredU256 = new StoredU256(this.pMsIdx, emptySubPtr());
    private readonly boost: StoredU256 = new StoredU256(this.pBoost, emptySubPtr());
    private readonly nftTreasury: StoredU256 = new StoredU256(
        this.pNftTreasury,
        emptySubPtr(),
    );
    private readonly motoToken: StoredU256 = new StoredU256(
        this.pMotoToken,
        emptySubPtr(),
    );
    private readonly ownerSlot: StoredU256 = new StoredU256(this.pOwner, emptySubPtr());
    private readonly seeded: StoredU256 = new StoredU256(this.pSeeded, emptySubPtr());

    // ── Selectors ─────────────────────────────────────────────────────────
    private readonly SEL_DEPOSIT: Selector = encodeSelector('deposit(uint256)');
    private readonly SEL_WITHDRAW: Selector = encodeSelector('withdraw(uint256)');
    private readonly SEL_CLAIM: Selector = encodeSelector('claimYield()');
    private readonly SEL_OPEN: Selector = encodeSelector('openRaffle()');
    private readonly SEL_CLOSE: Selector = encodeSelector('closeEntries(uint256)');
    private readonly SEL_DRAW: Selector = encodeSelector('draw(uint256)');
    private readonly SEL_ADD_MOTO: Selector = encodeSelector('addMoto(uint256)');
    private readonly SEL_SEED: Selector = encodeSelector('seedJackpot(uint256)');
    private readonly SEL_SET_MOTO: Selector = encodeSelector('setMotoToken(uint256)');
    private readonly SEL_POSITION: Selector = encodeSelector('getUserPosition(address)');
    private readonly SEL_STATS: Selector = encodeSelector('getProtocolStats()');
    private readonly SEL_RAFFLE: Selector = encodeSelector('getRaffleInfo(uint256)');
    private readonly SEL_OWNER: Selector = encodeSelector('transferOwnership(address)');

    public constructor() {
        super();
    }

    public onDeployment(_calldata: Calldata): void {
        this.ownerSlot.set(addrToU256(Blockchain.tx.sender));
        this.lastBlock.set(u256.fromU64(Blockchain.block.number));
        this.emitEvent(new DeployedEvent(Blockchain.tx.sender));
    }

    public callMethod(calldata: Calldata): BytesWriter {
        const sel = calldata.readSelector();
        switch (sel) {
            case this.SEL_DEPOSIT:
                return this.deposit(calldata);
            case this.SEL_WITHDRAW:
                return this.withdraw(calldata);
            case this.SEL_CLAIM:
                return this.claimYield(calldata);
            case this.SEL_OPEN:
                return this.openRaffle(calldata);
            case this.SEL_CLOSE:
                return this.closeEntries(calldata);
            case this.SEL_DRAW:
                return this.draw(calldata);
            case this.SEL_ADD_MOTO:
                return this.addMoto(calldata);
            case this.SEL_SEED:
                return this.seedJackpot(calldata);
            case this.SEL_SET_MOTO:
                return this.setMotoToken(calldata);
            case this.SEL_POSITION:
                return this.getUserPosition(calldata);
            case this.SEL_STATS:
                return this.getProtocolStats(calldata);
            case this.SEL_RAFFLE:
                return this.getRaffleInfo(calldata);
            case this.SEL_OWNER:
                return this.transferOwnership(calldata);
            default:
                return super.callMethod(calldata);
        }
    }

    // ─────────────────────────────────────────────────────────────────────
    // Public mutating methods
    // ─────────────────────────────────────────────────────────────────────

    @method({ name: 'amountSats', type: ABIDataTypes.UINT256 })
    @returns({ name: 'success', type: ABIDataTypes.BOOL })
    public deposit(calldata: Calldata): BytesWriter {
        const amount = calldata.readU256();
        if (u256.eq(amount, u256.Zero)) throw new Revert('Amount must be > 0');

        const user = Blockchain.tx.sender;
        const fee = frac(amount, FEE_NUM, FEE_DENOM);
        const net = SafeMath.sub(amount, fee);

        this.updateAcc();

        const prev = this.userStake.get(addrToU256(user));
        if (u256.gt(prev, u256.Zero)) this.settleDebt(user, prev);

        const next = SafeMath.add(prev, net);
        this.userStake.set(addrToU256(user), next);
        this.totalStaked.set(SafeMath.add(this.totalStaked.value, net));
        this.userDebt.set(addrToU256(user), frac(next, this.accMoto.value, ACC_SCALE));

        this.addToPool(fee);
        const rid = this.assignRaffle(user, next);

        if (u256.ge(net, WHALE_SAT)) this.emitEvent(new WhaleDepositEvent(user, net));
        this.emitEvent(new DepositedEvent(user, net, fee, rid));

        const w = new BytesWriter(1);
        w.writeBoolean(true);
        return w;
    }

    @method({ name: 'amountSats', type: ABIDataTypes.UINT256 })
    @returns({ name: 'success', type: ABIDataTypes.BOOL })
    public withdraw(calldata: Calldata): BytesWriter {
        const amount = calldata.readU256();
        if (u256.eq(amount, u256.Zero)) throw new Revert('Amount must be > 0');

        const user = Blockchain.tx.sender;
        const prev = this.userStake.get(addrToU256(user));
        if (u256.lt(prev, amount)) throw new Revert('Insufficient stake');

        this.updateAcc();
        this.settleDebt(user, prev);

        const fee = frac(amount, FEE_NUM, FEE_DENOM);
        const net = SafeMath.sub(amount, fee);
        const next = SafeMath.sub(prev, amount);

        this.userStake.set(addrToU256(user), next);
        this.totalStaked.set(SafeMath.sub(this.totalStaked.value, amount));
        this.userDebt.set(addrToU256(user), frac(next, this.accMoto.value, ACC_SCALE));

        this.addToPool(fee);
        this.emitEvent(new WithdrawnEvent(user, net, fee));

        const w = new BytesWriter(1);
        w.writeBoolean(true);
        return w;
    }

    @method()
    @returns({ name: 'motoAmount', type: ABIDataTypes.UINT256 })
    public claimYield(_calldata: Calldata): BytesWriter {
        const user = Blockchain.tx.sender;
        this.updateAcc();

        const stake = this.userStake.get(addrToU256(user));
        if (u256.eq(stake, u256.Zero)) throw new Revert('No active stake');

        const pending = this.pendingYield(user, stake);
        if (u256.eq(pending, u256.Zero)) throw new Revert('No yield to claim');

        const isBoost = u256.gt(this.boost.value, u256.Zero);
        const toUser = frac(pending, isBoost ? USER_BOOST_BPS : USER_BPS, YIELD_DENOM);
        const toPool = frac(pending, isBoost ? POOL_BOOST_BPS : POOL_BPS, YIELD_DENOM);

        this.userDebt.set(addrToU256(user), frac(stake, this.accMoto.value, ACC_SCALE));
        this.addToPool(toPool);
        this.transferMoto(user, toUser);
        this.emitEvent(new YieldClaimedEvent(user, toUser, toPool));

        const w = new BytesWriter(U256_BYTE_LENGTH);
        w.writeU256(toUser);
        return w;
    }

    @method()
    @returns({ name: 'newRaffleId', type: ABIDataTypes.UINT256 })
    public openRaffle(_calldata: Calldata): BytesWriter {
        this.onlyOwner();

        const blk = Blockchain.block.number;
        const rid = SafeMath.add(this.raffleId.value, u256.One);
        this.raffleId.set(rid);

        this.rStart.set(rid, u256.fromU64(blk));
        this.rClose.set(rid, u256.fromU64(blk + ENTRY_BLOCKS));
        this.rDraw.set(rid, u256.fromU64(blk + DRAW_BLOCKS));
        this.rState.set(rid, STATE_OPEN);
        this.rCount.set(rid, u256.Zero);
        this.rTix.set(rid, u256.Zero);

        this.emitEvent(
            new RaffleOpenedEvent(
                rid,
                u256.fromU64(blk),
                u256.fromU64(blk + ENTRY_BLOCKS),
                u256.fromU64(blk + DRAW_BLOCKS),
            ),
        );

        const w = new BytesWriter(U256_BYTE_LENGTH);
        w.writeU256(rid);
        return w;
    }

    @method({ name: 'raffleId', type: ABIDataTypes.UINT256 })
    @returns({ name: 'success', type: ABIDataTypes.BOOL })
    public closeEntries(calldata: Calldata): BytesWriter {
        this.onlyOwner();
        const rid = calldata.readU256();

        if (!u256.eq(this.rState.get(rid), STATE_OPEN)) throw new Revert('Not open');
        if (u256.lt(u256.fromU64(Blockchain.block.number), this.rClose.get(rid)))
            throw new Revert('Entry window still open');

        this.rState.set(rid, STATE_CLOSED);
        this.emitEvent(
            new EntriesClosedEvent(rid, this.rCount.get(rid), this.rTix.get(rid)),
        );

        const w = new BytesWriter(1);
        w.writeBoolean(true);
        return w;
    }

    @method({ name: 'raffleId', type: ABIDataTypes.UINT256 })
    @returns({ name: 'success', type: ABIDataTypes.BOOL })
    public draw(calldata: Calldata): BytesWriter {
        this.onlyOwner();
        const rid = calldata.readU256();

        if (u256.eq(this.rState.get(rid), STATE_DRAWN)) throw new Revert('Already drawn');
        if (u256.lt(u256.fromU64(Blockchain.block.number), this.rDraw.get(rid)))
            throw new Revert('Draw block not reached');

        const pool = this.prizePool.value;
        const blockHash = Blockchain.block.hash;

        const pct = this.spinWheel(blockHash, rid);
        this.emitEvent(new WheelSpunEvent(rid, pct));

        const released = frac(pool, pct, u256.fromU32(100));
        const toWinners = frac(released, WINNERS_BPS, JACKPOT_DENOM);
        const toRecycle = frac(released, RECYCLE_BPS, JACKPOT_DENOM);
        const toNft = frac(released, NFT_BPS, JACKPOT_DENOM);

        this.prizePool.set(SafeMath.add(SafeMath.sub(pool, released), toRecycle));
        this.nftTreasury.set(SafeMath.add(this.nftTreasury.value, toNft));

        const nSelected = this.selectWinners(rid, blockHash, toWinners);

        this.rState.set(rid, STATE_DRAWN);
        this.checkMilestones();

        this.emitEvent(
            new JackpotReleasedEvent(rid, released, toWinners, toRecycle, toNft, pct),
        );
        this.emitEvent(new WinnersSelectedEvent(rid, u256.fromU32(nSelected), toWinners));

        const w = new BytesWriter(1);
        w.writeBoolean(true);
        return w;
    }

    @method({ name: 'amount', type: ABIDataTypes.UINT256 })
    @returns({ name: 'success', type: ABIDataTypes.BOOL })
    public addMoto(calldata: Calldata): BytesWriter {
        this.onlyOwner();
        const amount = calldata.readU256();

        const staked = this.totalStaked.value;
        if (u256.gt(staked, u256.Zero)) {
            this.mpb.set(
                SafeMath.div(SafeMath.mul(amount, ACC_SCALE), u256.fromU64(DRAW_BLOCKS)),
            );
        }
        this.motoPool.set(SafeMath.add(this.motoPool.value, amount));
        this.emitEvent(new MotoAddedEvent(amount));

        const w = new BytesWriter(1);
        w.writeBoolean(true);
        return w;
    }

    @method({ name: 'amount', type: ABIDataTypes.UINT256 })
    @returns({ name: 'success', type: ABIDataTypes.BOOL })
    public seedJackpot(calldata: Calldata): BytesWriter {
        this.onlyOwner();
        if (u256.gt(this.seeded.value, u256.Zero)) throw new Revert('Already seeded');

        const amount = calldata.readU256();
        this.addToPool(amount);
        this.seeded.set(u256.One);
        this.emitEvent(new JackpotSeededEvent(amount));

        const w = new BytesWriter(1);
        w.writeBoolean(true);
        return w;
    }

    @method({ name: 'tokenAddr', type: ABIDataTypes.UINT256 })
    @returns({ name: 'success', type: ABIDataTypes.BOOL })
    public setMotoToken(calldata: Calldata): BytesWriter {
        this.onlyOwner();
        this.motoToken.set(calldata.readU256());

        const w = new BytesWriter(1);
        w.writeBoolean(true);
        return w;
    }

    @method({ name: 'newOwner', type: ABIDataTypes.ADDRESS })
    @returns({ name: 'success', type: ABIDataTypes.BOOL })
    public transferOwnership(calldata: Calldata): BytesWriter {
        this.onlyOwner();
        this.ownerSlot.set(addrToU256(calldata.readAddress()));

        const w = new BytesWriter(1);
        w.writeBoolean(true);
        return w;
    }

    // ─────────────────────────────────────────────────────────────────────
    // View methods
    // ─────────────────────────────────────────────────────────────────────

    @method({ name: 'user', type: ABIDataTypes.ADDRESS })
    @returns(
        { name: 'stake', type: ABIDataTypes.UINT256 },
        { name: 'pendingMoto', type: ABIDataTypes.UINT256 },
        { name: 'raffleId', type: ABIDataTypes.UINT256 },
        { name: 'tickets', type: ABIDataTypes.UINT256 },
        { name: 'entryBlock', type: ABIDataTypes.UINT256 },
    )
    public getUserPosition(calldata: Calldata): BytesWriter {
        const user = calldata.readAddress();
        const stake = this.userStake.get(addrToU256(user));
        const pending = this.pendingYield(user, stake);
        const rid = this.userRaffle.get(addrToU256(user));
        const tix = u256.gt(rid, u256.Zero) ? this.getTix(rid, user) : u256.Zero;
        const entryBlk = this.userEntry.get(addrToU256(user));

        const w = new BytesWriter(U256_BYTE_LENGTH * 5);
        w.writeU256(stake);
        w.writeU256(pending);
        w.writeU256(rid);
        w.writeU256(tix);
        w.writeU256(entryBlk);
        return w;
    }

    @method()
    @returns(
        { name: 'totalStaked', type: ABIDataTypes.UINT256 },
        { name: 'prizePool', type: ABIDataTypes.UINT256 },
        { name: 'nftTreasury', type: ABIDataTypes.UINT256 },
        { name: 'currentRaffleId', type: ABIDataTypes.UINT256 },
        { name: 'motoPerBlock', type: ABIDataTypes.UINT256 },
        { name: 'boostActive', type: ABIDataTypes.UINT256 },
        { name: 'milestoneIdx', type: ABIDataTypes.UINT256 },
    )
    public getProtocolStats(_calldata: Calldata): BytesWriter {
        const w = new BytesWriter(U256_BYTE_LENGTH * 7);
        w.writeU256(this.totalStaked.value);
        w.writeU256(this.prizePool.value);
        w.writeU256(this.nftTreasury.value);
        w.writeU256(this.raffleId.value);
        w.writeU256(this.mpb.value);
        w.writeU256(this.boost.value);
        w.writeU256(this.msIdx.value);
        return w;
    }

    @method({ name: 'raffleId', type: ABIDataTypes.UINT256 })
    @returns(
        { name: 'startBlock', type: ABIDataTypes.UINT256 },
        { name: 'entryCloseBlock', type: ABIDataTypes.UINT256 },
        { name: 'drawBlock', type: ABIDataTypes.UINT256 },
        { name: 'state', type: ABIDataTypes.UINT256 },
        { name: 'participantCount', type: ABIDataTypes.UINT256 },
        { name: 'totalTickets', type: ABIDataTypes.UINT256 },
    )
    public getRaffleInfo(calldata: Calldata): BytesWriter {
        const rid = calldata.readU256();
        const w = new BytesWriter(U256_BYTE_LENGTH * 6);
        w.writeU256(this.rStart.get(rid));
        w.writeU256(this.rClose.get(rid));
        w.writeU256(this.rDraw.get(rid));
        w.writeU256(this.rState.get(rid));
        w.writeU256(this.rCount.get(rid));
        w.writeU256(this.rTix.get(rid));
        return w;
    }

    // ─────────────────────────────────────────────────────────────────────
    // Internal: yield accumulator
    // ─────────────────────────────────────────────────────────────────────

    private updateAcc(): void {
        const staked = this.totalStaked.value;
        const curBlk = u256.fromU64(Blockchain.block.number);
        const lastBlk = this.lastBlock.value;

        if (u256.ge(lastBlk, curBlk) || u256.eq(staked, u256.Zero)) {
            this.lastBlock.set(curBlk);
            return;
        }

        const delta = SafeMath.sub(curBlk, lastBlk);
        const motoPerBlk = this.mpb.value;

        if (u256.gt(motoPerBlk, u256.Zero)) {
            const reward = SafeMath.mul(motoPerBlk, delta);
            const inc = SafeMath.div(reward, staked);
            this.accMoto.set(SafeMath.add(this.accMoto.value, inc));
        }
        this.lastBlock.set(curBlk);
    }

    private pendingYield(user: Address, stake: u256): u256 {
        if (u256.eq(stake, u256.Zero)) return u256.Zero;
        const gross = frac(stake, this.accMoto.value, ACC_SCALE);
        const debt = this.userDebt.get(addrToU256(user));
        if (u256.le(gross, debt)) return u256.Zero;
        return SafeMath.sub(gross, debt);
    }

    private settleDebt(user: Address, stake: u256): void {
        this.userDebt.set(addrToU256(user), frac(stake, this.accMoto.value, ACC_SCALE));
    }

    // ─────────────────────────────────────────────────────────────────────
    // Internal: prize pool & milestones
    // ─────────────────────────────────────────────────────────────────────

    private addToPool(amount: u256): void {
        if (u256.eq(amount, u256.Zero)) return;
        this.prizePool.set(SafeMath.add(this.prizePool.value, amount));
        this.checkMilestones();
    }

    private checkMilestones(): void {
        const pool = this.prizePool.value;
        const idx = this.msIdx.value;
        const ms = this.milestone(idx);
        if (u256.eq(ms, u256.Zero)) return;

        const thresh = frac(ms, BOOST_BPS, u256.fromU32(10000));
        if (u256.ge(pool, thresh) && u256.eq(this.boost.value, u256.Zero)) {
            this.boost.set(u256.One);
            this.emitEvent(new ThresholdBoostEvent(true, pool, ms));
        }
        if (u256.ge(pool, ms)) {
            this.msIdx.set(SafeMath.add(idx, u256.One));
            this.boost.set(u256.Zero);
            this.emitEvent(new MilestoneReachedEvent(ms, pool));
        }
    }

    private milestone(idx: u256): u256 {
        if (u256.eq(idx, u256.Zero)) return M0;
        if (u256.eq(idx, u256.One)) return M1;
        if (u256.eq(idx, u256.fromU32(2))) return M2;
        if (u256.eq(idx, u256.fromU32(3))) return M3;
        return u256.Zero;
    }

    // ─────────────────────────────────────────────────────────────────────
    // Internal: raffle assignment & participants
    // ─────────────────────────────────────────────────────────────────────

    private assignRaffle(user: Address, stake: u256): u256 {
        const rid = this.raffleId.value;
        if (u256.eq(rid, u256.Zero)) return NO_RAFFLE;

        const state = this.rState.get(rid);
        const curBlk = u256.fromU64(Blockchain.block.number);

        if (u256.eq(state, STATE_OPEN) && u256.lt(curBlk, this.rClose.get(rid))) {
            this.userRaffle.set(addrToU256(user), rid);
            this.userEntry.set(addrToU256(user), curBlk);
            this.addParticipant(user, rid, stake, curBlk);
            return rid;
        }
        return QUEUED;
    }

    private addParticipant(user: Address, rid: u256, stake: u256, entryBlk: u256): void {
        if (this.isInRaffle(rid, user)) return;

        const count = this.rCount.get(rid);
        if (u256.ge(count, u256.fromU32(MAX_PARTICIPANTS))) return;

        const closeBlk = this.rClose.get(rid);
        const blocksIn = u256.gt(closeBlk, entryBlk)
            ? SafeMath.sub(closeBlk, entryBlk)
            : u256.One;

        const tix = SafeMath.mul(isqrt(stake), blocksIn);

        this.setTix(rid, user, tix);
        this.setParticipant(rid, count, user);
        this.setInRaffle(rid, user);
        this.rCount.set(rid, SafeMath.add(count, u256.One));
        this.rTix.set(rid, SafeMath.add(this.rTix.get(rid), tix));

        this.emitEvent(new TicketsAssignedEvent(user, rid, tix));
    }

    // ─────────────────────────────────────────────────────────────────────
    // Internal: randomness & winner selection
    // ─────────────────────────────────────────────────────────────────────

    private spinWheel(blockHash: Uint8Array, rid: u256): u256 {
        const seed = hashSeed(blockHash, rid, 0);
        const roll = SafeMath.mod(u256.fromUint8ArrayBE(seed), u256.fromU32(1000));

        if (u256.lt(roll, WHEEL_100_MAX)) return u256.fromU32(100);
        if (u256.lt(roll, WHEEL_75_MAX)) return u256.fromU32(75);
        if (u256.lt(roll, WHEEL_50_MAX)) return u256.fromU32(50);
        return u256.fromU32(33);
    }

    private selectWinners(rid: u256, blockHash: Uint8Array, totalPrize: u256): u32 {
        const count: u32 = this.rCount.get(rid).toU32();
        if (count == 0) return 0;

        const totalTix = this.rTix.get(rid);
        if (u256.eq(totalTix, u256.Zero)) return 0;

        const numW: u32 = count < WINNER_COUNT ? count : WINNER_COUNT;
        const prizeEach = SafeMath.div(totalPrize, u256.fromU32(numW));

        const wonU256s: u256[] = [];
        let selected: u32 = 0;

        for (let w: u32 = 0; w < numW; w++) {
            const seed = hashSeed(blockHash, rid, (w as i32) + 1);
            const target = SafeMath.mod(u256.fromUint8ArrayBE(seed), totalTix);

            let cum = u256.Zero;
            for (let i: u32 = 0; i < count; i++) {
                const pAddr = this.getParticipant(rid, u256.fromU32(i));
                cum = SafeMath.add(cum, this.getTix(rid, pAddr));

                if (u256.ge(cum, target)) {
                    const pU256 = addrToU256(pAddr);
                    let already = false;
                    for (let j: i32 = 0; j < wonU256s.length; j++) {
                        if (u256.eq(wonU256s[j], pU256)) {
                            already = true;
                            break;
                        }
                    }
                    if (!already) {
                        wonU256s.push(pU256);
                        selected++;
                        this.transferMoto(pAddr, prizeEach);
                        this.emitEvent(
                            new WinnerSelectedEvent(rid, pAddr, prizeEach, w as i32),
                        );
                    }
                    break;
                }
            }
        }
        return selected;
    }

    // ─────────────────────────────────────────────────────────────────────
    // Internal: MOTO distribution
    // ─────────────────────────────────────────────────────────────────────

    private transferMoto(to: Address, amount: u256): void {
        if (u256.eq(amount, u256.Zero)) return;

        const motoAddr = this.motoToken.value;
        if (u256.eq(motoAddr, u256.Zero)) {
            this.emitEvent(new MotoTransferEvent(to, amount));
            return;
        }

        const sel = encodeSelector('transfer(address,uint256)');
        const cd = new BytesWriter(4 + ADDRESS_BYTE_LENGTH + U256_BYTE_LENGTH);
        cd.writeSelector(sel);
        cd.writeAddress(to);
        cd.writeU256(amount);

        Blockchain.call(u256ToAddr(motoAddr), cd);
        this.emitEvent(new MotoTransferEvent(to, amount));
    }

    // ─────────────────────────────────────────────────────────────────────
    // Internal: composite key storage helpers
    // ─────────────────────────────────────────────────────────────────────

    private pKey(rid: u256, idx: u256): u256 {
        const d = new BytesWriter(U256_BYTE_LENGTH * 2);
        d.writeU256(rid);
        d.writeU256(idx);
        return u256.fromUint8ArrayBE(Blockchain.sha256(d.getBuffer()));
    }

    private tKey(rid: u256, user: Address): u256 {
        const d = new BytesWriter(U256_BYTE_LENGTH + ADDRESS_BYTE_LENGTH);
        d.writeU256(rid);
        d.writeAddress(user);
        return u256.fromUint8ArrayBE(Blockchain.sha256(d.getBuffer()));
    }

    private rKey(rid: u256, user: Address): u256 {
        const d = new BytesWriter(U256_BYTE_LENGTH + ADDRESS_BYTE_LENGTH + 1);
        d.writeU256(rid);
        d.writeAddress(user);
        d.writeU8(0xff);
        return u256.fromUint8ArrayBE(Blockchain.sha256(d.getBuffer()));
    }

    private setParticipant(rid: u256, idx: u256, user: Address): void {
        this.participant.set(this.pKey(rid, idx), addrToU256(user));
    }

    private getParticipant(rid: u256, idx: u256): Address {
        return u256ToAddr(this.participant.get(this.pKey(rid, idx)));
    }

    private setTix(rid: u256, user: Address, tix: u256): void {
        this.userTix.set(this.tKey(rid, user), tix);
    }

    private getTix(rid: u256, user: Address): u256 {
        return this.userTix.get(this.tKey(rid, user));
    }

    private setInRaffle(rid: u256, user: Address): void {
        this.inRaffle.set(this.rKey(rid, user), u256.One);
    }

    private isInRaffle(rid: u256, user: Address): bool {
        return u256.gt(this.inRaffle.get(this.rKey(rid, user)), u256.Zero);
    }

    // ─────────────────────────────────────────────────────────────────────
    // Internal: access control
    // ─────────────────────────────────────────────────────────────────────

    private onlyOwner(): void {
        if (!u256.eq(addrToU256(Blockchain.tx.sender), this.ownerSlot.value))
            throw new Revert('Only owner');
    }
}

// ── Free functions ────────────────────────────────────────────────────────

function frac(value: u256, num: u256, denom: u256): u256 {
    if (u256.eq(value, u256.Zero) || u256.eq(num, u256.Zero)) return u256.Zero;
    return SafeMath.div(SafeMath.mul(value, num), denom);
}

function isqrt(n: u256): u256 {
    if (u256.eq(n, u256.Zero)) return u256.Zero;
    if (u256.le(n, u256.One)) return n;
    let x = n;
    let y = SafeMath.add(SafeMath.div(x, u256.fromU32(2)), u256.One);
    while (u256.lt(y, x)) {
        x = y;
        y = SafeMath.div(SafeMath.add(SafeMath.div(n, x), x), u256.fromU32(2));
    }
    return x;
}

function hashSeed(blockHash: Uint8Array, rid: u256, nonce: i32): Uint8Array {
    const d = new BytesWriter(32 + U256_BYTE_LENGTH + 4);
    d.writeBytes(blockHash);
    d.writeU256(rid);
    d.writeI32(nonce);
    return Blockchain.sha256(d.getBuffer());
}

function addrToU256(addr: Address): u256 {
    return u256.fromUint8ArrayBE(addr);
}

function u256ToAddr(val: u256): Address {
    return Address.fromUint8Array(val.toUint8Array(true));
}
