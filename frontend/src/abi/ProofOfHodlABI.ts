import { ABIDataTypes, IFunctionABI } from 'opnet';

/**
 * ABI for ProofOfHodl contract.
 * Selectors are derived from the method signatures in the contract.
 */
export const ProofOfHodlABI: IFunctionABI[] = [
    {
        name: 'stake',
        inputs: [{ name: 'lockBlocks', type: ABIDataTypes.UINT64 }],
        outputs: [{ name: 'success', type: ABIDataTypes.BOOL }],
    },
    {
        name: 'unstake',
        inputs: [],
        outputs: [{ name: 'success', type: ABIDataTypes.BOOL }],
    },
    {
        name: 'claimRewards',
        inputs: [],
        outputs: [{ name: 'amount', type: ABIDataTypes.UINT256 }],
    },
    {
        name: 'getStakeInfo',
        inputs: [{ name: 'staker', type: ABIDataTypes.ADDRESS }],
        outputs: [
            { name: 'satoshis', type: ABIDataTypes.UINT64 },
            { name: 'startBlock', type: ABIDataTypes.UINT64 },
            { name: 'lockBlocks', type: ABIDataTypes.UINT64 },
            { name: 'unlockBlock', type: ABIDataTypes.UINT64 },
        ],
    },
    {
        name: 'getPendingRewards',
        inputs: [{ name: 'staker', type: ABIDataTypes.ADDRESS }],
        outputs: [{ name: 'pending', type: ABIDataTypes.UINT256 }],
    },
    {
        name: 'getTotalStaked',
        inputs: [],
        outputs: [{ name: 'total', type: ABIDataTypes.UINT256 }],
    },
];
