/**
 * StakingService — singleton wrapper around the ProofOfHodl contract.
 *
 * Rules:
 *  - One JSONRpcProvider instance (never create multiples)
 *  - signer: null, mldsaSigner: null in sendTransaction (wallet signs)
 *  - No raw PSBT — always getContract → simulate → sendTransaction
 *  - Check sim.revert (not sim.error) for reverts
 */

import { JSONRpcProvider, getContract, IBaseContract } from 'opnet';
import { networks, Network } from '@btc-vision/bitcoin';
import { NETWORK, RPC_URL, PROOF_OF_HODL_ADDRESS } from '../config/contracts';
import { ProofOfHodlABI } from '../abi/ProofOfHodlABI';

// ─── Contract interface ───────────────────────────────────────────────────────

export interface IProofOfHodlContract extends IBaseContract {
    stake(params: { lockBlocks: bigint }): Promise<ISimResult>;
    unstake(): Promise<ISimResult>;
    claimRewards(): Promise<ISimResult>;
    getStakeInfo(params: { staker: string }): Promise<ISimResult>;
    getPendingRewards(params: { staker: string }): Promise<ISimResult>;
    getTotalStaked(): Promise<ISimResult>;
}

export interface ISimResult {
    revert?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    decoded?: Record<string, any>;
    sendTransaction: (opts: ISendTxOptions) => Promise<ITxReceipt>;
}

export interface ISendTxOptions {
    signer: null;
    mldsaSigner: null;
    refundTo: string;
    maximumAllowedSatToSpend: bigint;
    feeRate: number;
    network: Network;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    extraOutputs?: any[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    extraInputs?: any[];
}

export interface ITxReceipt {
    transactionId?: string;
    txId?: string;
}

// ─── Stake info returned to UI ───────────────────────────────────────────────

export interface StakeInfo {
    satoshis: bigint;
    startBlock: bigint;
    lockBlocks: bigint;
    unlockBlock: bigint;
}

// ─── Singleton ────────────────────────────────────────────────────────────────

class StakingService {
    private static _instance: StakingService;

    private readonly _provider: JSONRpcProvider;
    private _contract: IProofOfHodlContract | null = null;

    private constructor() {
        this._provider = new JSONRpcProvider({ url: RPC_URL, network: NETWORK });
    }

    public static getInstance(): StakingService {
        if (!StakingService._instance) {
            StakingService._instance = new StakingService();
        }
        return StakingService._instance;
    }

    public get provider(): JSONRpcProvider {
        return this._provider;
    }

    /** Returns a cached contract proxy. */
    public getProofOfHodlContract(): IProofOfHodlContract {
        if (!this._contract) {
            this._contract = getContract<IProofOfHodlContract>(
                PROOF_OF_HODL_ADDRESS,
                ProofOfHodlABI,
                this._provider,
                NETWORK,
            );
        }
        return this._contract;
    }

    /** Read staking info for a wallet address. */
    public async readStakeInfo(walletAddress: string): Promise<StakeInfo | null> {
        try {
            const contract = this.getProofOfHodlContract();
            const sim = await contract.getStakeInfo({ staker: walletAddress });

            if (sim.revert) {
                console.warn('getStakeInfo reverted:', sim.revert);
                return null;
            }

            const d = sim.decoded;
            if (!d) return null;

            return {
                satoshis: BigInt(d.satoshis ?? 0),
                startBlock: BigInt(d.startBlock ?? 0),
                lockBlocks: BigInt(d.lockBlocks ?? 0),
                unlockBlock: BigInt(d.unlockBlock ?? 0),
            };
        } catch (err) {
            console.error('readStakeInfo error:', err);
            return null;
        }
    }

    /** Read pending (unclaimed) rewards for a wallet address. */
    public async readPendingRewards(walletAddress: string): Promise<bigint> {
        try {
            const contract = this.getProofOfHodlContract();
            const sim = await contract.getPendingRewards({ staker: walletAddress });

            if (sim.revert) return 0n;

            const d = sim.decoded;
            return d ? BigInt(d.pending ?? 0) : 0n;
        } catch {
            return 0n;
        }
    }

    /** Read total sats staked globally. */
    public async readTotalStaked(): Promise<bigint> {
        try {
            const contract = this.getProofOfHodlContract();
            const sim = await contract.getTotalStaked();
            if (sim.revert) return 0n;
            const d = sim.decoded;
            return d ? BigInt(d.total ?? 0) : 0n;
        } catch {
            return 0n;
        }
    }
}

export const stakingService = StakingService.getInstance();
