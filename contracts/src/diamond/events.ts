import { u256 } from '@btc-vision/as-bignum/assembly';
import {
    Address,
    BytesWriter,
    NetEvent,
    ADDRESS_BYTE_LENGTH,
    U256_BYTE_LENGTH,
} from '@btc-vision/btc-runtime/runtime';

// ── DepositedEvent ─────────────────────────────────────────────────────────

@final
export class DepositedEvent extends NetEvent {
    public constructor(user: Address, amount: u256, fee: u256, raffleId: u256) {
        const data = new BytesWriter(ADDRESS_BYTE_LENGTH + U256_BYTE_LENGTH * 3);
        data.writeAddress(user);
        data.writeU256(amount);
        data.writeU256(fee);
        data.writeU256(raffleId);
        super('Deposited', data);
    }
}

// ── WithdrawnEvent ─────────────────────────────────────────────────────────

@final
export class WithdrawnEvent extends NetEvent {
    public constructor(user: Address, amount: u256, fee: u256) {
        const data = new BytesWriter(ADDRESS_BYTE_LENGTH + U256_BYTE_LENGTH * 2);
        data.writeAddress(user);
        data.writeU256(amount);
        data.writeU256(fee);
        super('Withdrawn', data);
    }
}

// ── YieldClaimedEvent ──────────────────────────────────────────────────────

@final
export class YieldClaimedEvent extends NetEvent {
    public constructor(user: Address, toUser: u256, toPool: u256) {
        const data = new BytesWriter(ADDRESS_BYTE_LENGTH + U256_BYTE_LENGTH * 2);
        data.writeAddress(user);
        data.writeU256(toUser);
        data.writeU256(toPool);
        super('YieldClaimed', data);
    }
}

// ── WhaleDepositEvent ──────────────────────────────────────────────────────

@final
export class WhaleDepositEvent extends NetEvent {
    public constructor(user: Address, amount: u256) {
        const data = new BytesWriter(ADDRESS_BYTE_LENGTH + U256_BYTE_LENGTH);
        data.writeAddress(user);
        data.writeU256(amount);
        super('WhaleDeposit', data);
    }
}

// ── RaffleOpenedEvent ──────────────────────────────────────────────────────

@final
export class RaffleOpenedEvent extends NetEvent {
    public constructor(
        raffleId: u256,
        startBlock: u256,
        entryCloseBlock: u256,
        drawBlock: u256,
    ) {
        const data = new BytesWriter(U256_BYTE_LENGTH * 4);
        data.writeU256(raffleId);
        data.writeU256(startBlock);
        data.writeU256(entryCloseBlock);
        data.writeU256(drawBlock);
        super('RaffleOpened', data);
    }
}

// ── EntriesClosedEvent ─────────────────────────────────────────────────────

@final
export class EntriesClosedEvent extends NetEvent {
    public constructor(raffleId: u256, participantCount: u256, totalTickets: u256) {
        const data = new BytesWriter(U256_BYTE_LENGTH * 3);
        data.writeU256(raffleId);
        data.writeU256(participantCount);
        data.writeU256(totalTickets);
        super('EntriesClosed', data);
    }
}

// ── TicketsAssignedEvent ───────────────────────────────────────────────────

@final
export class TicketsAssignedEvent extends NetEvent {
    public constructor(user: Address, raffleId: u256, tickets: u256) {
        const data = new BytesWriter(ADDRESS_BYTE_LENGTH + U256_BYTE_LENGTH * 2);
        data.writeAddress(user);
        data.writeU256(raffleId);
        data.writeU256(tickets);
        super('TicketsAssigned', data);
    }
}

// ── WheelSpunEvent ─────────────────────────────────────────────────────────

@final
export class WheelSpunEvent extends NetEvent {
    public constructor(raffleId: u256, releasePercent: u256) {
        const data = new BytesWriter(U256_BYTE_LENGTH * 2);
        data.writeU256(raffleId);
        data.writeU256(releasePercent);
        super('WheelSpun', data);
    }
}

// ── WinnerSelectedEvent ────────────────────────────────────────────────────

@final
export class WinnerSelectedEvent extends NetEvent {
    public constructor(raffleId: u256, winner: Address, prize: u256, rank: i32) {
        const data = new BytesWriter(U256_BYTE_LENGTH * 3 + ADDRESS_BYTE_LENGTH);
        data.writeU256(raffleId);
        data.writeAddress(winner);
        data.writeU256(prize);
        data.writeU256(u256.fromI32(rank));
        super('WinnerSelected', data);
    }
}

// ── WinnersSelectedEvent ───────────────────────────────────────────────────

@final
export class WinnersSelectedEvent extends NetEvent {
    public constructor(raffleId: u256, winnerCount: u256, totalPrize: u256) {
        const data = new BytesWriter(U256_BYTE_LENGTH * 3);
        data.writeU256(raffleId);
        data.writeU256(winnerCount);
        data.writeU256(totalPrize);
        super('WinnersSelected', data);
    }
}

// ── JackpotReleasedEvent ───────────────────────────────────────────────────

@final
export class JackpotReleasedEvent extends NetEvent {
    public constructor(
        raffleId: u256,
        total: u256,
        toWinners: u256,
        recycled: u256,
        toTreasury: u256,
        releasePercent: u256,
    ) {
        const data = new BytesWriter(U256_BYTE_LENGTH * 6);
        data.writeU256(raffleId);
        data.writeU256(total);
        data.writeU256(toWinners);
        data.writeU256(recycled);
        data.writeU256(toTreasury);
        data.writeU256(releasePercent);
        super('JackpotReleased', data);
    }
}

// ── MilestoneReachedEvent ──────────────────────────────────────────────────

@final
export class MilestoneReachedEvent extends NetEvent {
    public constructor(milestone: u256, poolBalance: u256) {
        const data = new BytesWriter(U256_BYTE_LENGTH * 2);
        data.writeU256(milestone);
        data.writeU256(poolBalance);
        super('MilestoneReached', data);
    }
}

// ── ThresholdBoostEvent ────────────────────────────────────────────────────

@final
export class ThresholdBoostEvent extends NetEvent {
    public constructor(active: bool, poolBalance: u256, milestone: u256) {
        const data = new BytesWriter(1 + U256_BYTE_LENGTH * 2);
        data.writeBoolean(active);
        data.writeU256(poolBalance);
        data.writeU256(milestone);
        super('ThresholdBoost', data);
    }
}

// ── JackpotSeededEvent ─────────────────────────────────────────────────────

@final
export class JackpotSeededEvent extends NetEvent {
    public constructor(amount: u256) {
        const data = new BytesWriter(U256_BYTE_LENGTH);
        data.writeU256(amount);
        super('JackpotSeeded', data);
    }
}

// ── MotoAddedEvent ─────────────────────────────────────────────────────────

@final
export class MotoAddedEvent extends NetEvent {
    public constructor(amount: u256) {
        const data = new BytesWriter(U256_BYTE_LENGTH);
        data.writeU256(amount);
        super('MotoAdded', data);
    }
}

// ── MotoTransferEvent ──────────────────────────────────────────────────────

@final
export class MotoTransferEvent extends NetEvent {
    public constructor(to: Address, amount: u256) {
        const data = new BytesWriter(ADDRESS_BYTE_LENGTH + U256_BYTE_LENGTH);
        data.writeAddress(to);
        data.writeU256(amount);
        super('MotoTransfer', data);
    }
}

// ── DeployedEvent ──────────────────────────────────────────────────────────

@final
export class DeployedEvent extends NetEvent {
    public constructor(deployer: Address) {
        const data = new BytesWriter(ADDRESS_BYTE_LENGTH);
        data.writeAddress(deployer);
        super('Deployed', data);
    }
}
