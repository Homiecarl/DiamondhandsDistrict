import { getContract, JSONRpcProvider } from 'opnet';
import { networks } from '@btc-vision/bitcoin';
import { Address } from '@btc-vision/transaction';
import type { AbstractRpcProvider } from 'opnet';
import { DiamondVaultAbi } from '../abi/DiamondVaultAbi';
import type { IDiamondVault } from '../abi/DiamondVault.d';
import { VAULT_ADDRESS, OPNET_TESTNET_URL } from '../config/contracts';

// Singleton fallback read-only provider
let _fallbackProvider: AbstractRpcProvider | null = null;

function getFallbackProvider(): AbstractRpcProvider {
    if (!_fallbackProvider) {
        _fallbackProvider = new JSONRpcProvider(OPNET_TESTNET_URL, networks.opnetTestnet);
    }
    return _fallbackProvider;
}

function getVaultContract(provider: AbstractRpcProvider, sender?: Address): IDiamondVault {
    if (!VAULT_ADDRESS) {
        throw new Error('CONTRACT_NOT_DEPLOYED');
    }
    return getContract<IDiamondVault>(
        VAULT_ADDRESS,
        DiamondVaultAbi,
        provider,
        networks.opnetTestnet,
        sender,
    ) as unknown as IDiamondVault;
}

export interface ProtocolStats {
    totalStaked: bigint;
    prizePool: bigint;
    nftTreasury: bigint;
    currentRaffleId: bigint;
    motoPerBlock: bigint;
    boostActive: boolean;
    milestoneIdx: number;
}

export interface UserPosition {
    stake: bigint;
    pendingMoto: bigint;
    raffleId: bigint;
    tickets: bigint;
    entryBlock: bigint;
}

export interface RaffleInfo {
    startBlock: bigint;
    entryCloseBlock: bigint;
    drawBlock: bigint;
    state: number; // 0=open 1=closed 2=drawn
    participantCount: bigint;
    totalTickets: bigint;
}

export async function fetchProtocolStats(
    provider?: AbstractRpcProvider | null,
): Promise<ProtocolStats> {
    const p = provider ?? getFallbackProvider();
    const contract = getVaultContract(p);
    const result = await contract.getProtocolStats();
    const props = result.properties;
    return {
        totalStaked: props.totalStaked,
        prizePool: props.prizePool,
        nftTreasury: props.nftTreasury,
        currentRaffleId: props.currentRaffleId,
        motoPerBlock: props.motoPerBlock,
        boostActive: props.boostActive > 0n,
        milestoneIdx: Number(props.milestoneIdx),
    };
}

export async function fetchUserPosition(
    userAddress: Address,
    provider?: AbstractRpcProvider | null,
): Promise<UserPosition> {
    const p = provider ?? getFallbackProvider();
    const contract = getVaultContract(p, userAddress);
    const result = await contract.getUserPosition(userAddress);
    return result.properties;
}

export async function fetchRaffleInfo(
    raffleId: bigint,
    provider?: AbstractRpcProvider | null,
): Promise<RaffleInfo> {
    const p = provider ?? getFallbackProvider();
    const contract = getVaultContract(p);
    const result = await contract.getRaffleInfo(raffleId);
    const props = result.properties;
    return {
        ...props,
        state: Number(props.state),
    };
}

export interface TxParams {
    walletAddress: string;
    feeRate?: number;
    maxSpend?: bigint;
}

export async function txDeposit(
    amountSats: bigint,
    params: TxParams,
    provider: AbstractRpcProvider,
    sender: Address,
): Promise<string> {
    const contract = getVaultContract(provider, sender);
    const result = await contract.deposit(amountSats);
    const receipt = await result.sendTransaction({
        signer: null,
        mldsaSigner: null,
        refundTo: params.walletAddress,
        sender: params.walletAddress,
        maximumAllowedSatToSpend: params.maxSpend ?? amountSats * 2n,
        network: networks.opnetTestnet,
        feeRate: params.feeRate ?? 10,
    });
    return receipt.transactionId;
}

export async function txWithdraw(
    amountSats: bigint,
    params: TxParams,
    provider: AbstractRpcProvider,
    sender: Address,
): Promise<string> {
    const contract = getVaultContract(provider, sender);
    const result = await contract.withdraw(amountSats);
    const receipt = await result.sendTransaction({
        signer: null,
        mldsaSigner: null,
        refundTo: params.walletAddress,
        sender: params.walletAddress,
        maximumAllowedSatToSpend: params.maxSpend ?? 500_000n,
        network: networks.opnetTestnet,
        feeRate: params.feeRate ?? 10,
    });
    return receipt.transactionId;
}

export async function txClaimYield(
    params: TxParams,
    provider: AbstractRpcProvider,
    sender: Address,
): Promise<string> {
    const contract = getVaultContract(provider, sender);
    const result = await contract.claimYield();
    const receipt = await result.sendTransaction({
        signer: null,
        mldsaSigner: null,
        refundTo: params.walletAddress,
        sender: params.walletAddress,
        maximumAllowedSatToSpend: 500_000n,
        network: networks.opnetTestnet,
        feeRate: params.feeRate ?? 10,
    });
    return receipt.transactionId;
}
