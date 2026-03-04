import { Address, AddressMap, ExtendedAddressMap, SchnorrSignature } from '@btc-vision/transaction';
import { CallResult, OPNetEvent, IOP_NETContract } from 'opnet';

// ------------------------------------------------------------------
// Event Definitions
// ------------------------------------------------------------------

// ------------------------------------------------------------------
// Call Results
// ------------------------------------------------------------------

/**
 * @description Represents the result of the deposit function call.
 */
export type Deposit = CallResult<
    {
        success: boolean;
    },
    OPNetEvent<never>[]
>;

/**
 * @description Represents the result of the withdraw function call.
 */
export type Withdraw = CallResult<
    {
        success: boolean;
    },
    OPNetEvent<never>[]
>;

/**
 * @description Represents the result of the claimYield function call.
 */
export type ClaimYield = CallResult<
    {
        motoAmount: bigint;
    },
    OPNetEvent<never>[]
>;

/**
 * @description Represents the result of the openRaffle function call.
 */
export type OpenRaffle = CallResult<
    {
        newRaffleId: bigint;
    },
    OPNetEvent<never>[]
>;

/**
 * @description Represents the result of the closeEntries function call.
 */
export type CloseEntries = CallResult<
    {
        success: boolean;
    },
    OPNetEvent<never>[]
>;

/**
 * @description Represents the result of the draw function call.
 */
export type Draw = CallResult<
    {
        success: boolean;
    },
    OPNetEvent<never>[]
>;

/**
 * @description Represents the result of the addMoto function call.
 */
export type AddMoto = CallResult<
    {
        success: boolean;
    },
    OPNetEvent<never>[]
>;

/**
 * @description Represents the result of the seedJackpot function call.
 */
export type SeedJackpot = CallResult<
    {
        success: boolean;
    },
    OPNetEvent<never>[]
>;

/**
 * @description Represents the result of the setMotoToken function call.
 */
export type SetMotoToken = CallResult<
    {
        success: boolean;
    },
    OPNetEvent<never>[]
>;

/**
 * @description Represents the result of the transferOwnership function call.
 */
export type TransferOwnership = CallResult<
    {
        success: boolean;
    },
    OPNetEvent<never>[]
>;

/**
 * @description Represents the result of the getUserPosition function call.
 */
export type GetUserPosition = CallResult<
    {
        stake: bigint;
        pendingMoto: bigint;
        raffleId: bigint;
        tickets: bigint;
        entryBlock: bigint;
    },
    OPNetEvent<never>[]
>;

/**
 * @description Represents the result of the getProtocolStats function call.
 */
export type GetProtocolStats = CallResult<
    {
        totalStaked: bigint;
        prizePool: bigint;
        nftTreasury: bigint;
        currentRaffleId: bigint;
        motoPerBlock: bigint;
        boostActive: bigint;
        milestoneIdx: bigint;
    },
    OPNetEvent<never>[]
>;

/**
 * @description Represents the result of the getRaffleInfo function call.
 */
export type GetRaffleInfo = CallResult<
    {
        startBlock: bigint;
        entryCloseBlock: bigint;
        drawBlock: bigint;
        state: bigint;
        participantCount: bigint;
        totalTickets: bigint;
    },
    OPNetEvent<never>[]
>;

// ------------------------------------------------------------------
// IDiamondVault
// ------------------------------------------------------------------
export interface IDiamondVault extends IOP_NETContract {
    deposit(amountSats: bigint): Promise<Deposit>;
    withdraw(amountSats: bigint): Promise<Withdraw>;
    claimYield(): Promise<ClaimYield>;
    openRaffle(): Promise<OpenRaffle>;
    closeEntries(raffleId: bigint): Promise<CloseEntries>;
    draw(raffleId: bigint): Promise<Draw>;
    addMoto(amount: bigint): Promise<AddMoto>;
    seedJackpot(amount: bigint): Promise<SeedJackpot>;
    setMotoToken(tokenAddr: bigint): Promise<SetMotoToken>;
    transferOwnership(newOwner: Address): Promise<TransferOwnership>;
    getUserPosition(user: Address): Promise<GetUserPosition>;
    getProtocolStats(): Promise<GetProtocolStats>;
    getRaffleInfo(raffleId: bigint): Promise<GetRaffleInfo>;
}
