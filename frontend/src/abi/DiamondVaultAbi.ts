import { ABIDataTypes, BitcoinAbiTypes, OP_NET_ABI } from 'opnet';

export const DiamondVaultEvents = [];

export const DiamondVaultAbi = [
    {
        name: 'deposit',
        inputs: [{ name: 'amountSats', type: ABIDataTypes.UINT256 }],
        outputs: [{ name: 'success', type: ABIDataTypes.BOOL }],
        type: BitcoinAbiTypes.Function,
    },
    {
        name: 'withdraw',
        inputs: [{ name: 'amountSats', type: ABIDataTypes.UINT256 }],
        outputs: [{ name: 'success', type: ABIDataTypes.BOOL }],
        type: BitcoinAbiTypes.Function,
    },
    {
        name: 'claimYield',
        inputs: [],
        outputs: [{ name: 'motoAmount', type: ABIDataTypes.UINT256 }],
        type: BitcoinAbiTypes.Function,
    },
    {
        name: 'openRaffle',
        inputs: [],
        outputs: [{ name: 'newRaffleId', type: ABIDataTypes.UINT256 }],
        type: BitcoinAbiTypes.Function,
    },
    {
        name: 'closeEntries',
        inputs: [{ name: 'raffleId', type: ABIDataTypes.UINT256 }],
        outputs: [{ name: 'success', type: ABIDataTypes.BOOL }],
        type: BitcoinAbiTypes.Function,
    },
    {
        name: 'draw',
        inputs: [{ name: 'raffleId', type: ABIDataTypes.UINT256 }],
        outputs: [{ name: 'success', type: ABIDataTypes.BOOL }],
        type: BitcoinAbiTypes.Function,
    },
    {
        name: 'addMoto',
        inputs: [{ name: 'amount', type: ABIDataTypes.UINT256 }],
        outputs: [{ name: 'success', type: ABIDataTypes.BOOL }],
        type: BitcoinAbiTypes.Function,
    },
    {
        name: 'seedJackpot',
        inputs: [{ name: 'amount', type: ABIDataTypes.UINT256 }],
        outputs: [{ name: 'success', type: ABIDataTypes.BOOL }],
        type: BitcoinAbiTypes.Function,
    },
    {
        name: 'setMotoToken',
        inputs: [{ name: 'tokenAddr', type: ABIDataTypes.UINT256 }],
        outputs: [{ name: 'success', type: ABIDataTypes.BOOL }],
        type: BitcoinAbiTypes.Function,
    },
    {
        name: 'transferOwnership',
        inputs: [{ name: 'newOwner', type: ABIDataTypes.ADDRESS }],
        outputs: [{ name: 'success', type: ABIDataTypes.BOOL }],
        type: BitcoinAbiTypes.Function,
    },
    {
        name: 'getUserPosition',
        inputs: [{ name: 'user', type: ABIDataTypes.ADDRESS }],
        outputs: [
            { name: 'stake', type: ABIDataTypes.UINT256 },
            { name: 'pendingMoto', type: ABIDataTypes.UINT256 },
            { name: 'raffleId', type: ABIDataTypes.UINT256 },
            { name: 'tickets', type: ABIDataTypes.UINT256 },
            { name: 'entryBlock', type: ABIDataTypes.UINT256 },
        ],
        type: BitcoinAbiTypes.Function,
    },
    {
        name: 'getProtocolStats',
        inputs: [],
        outputs: [
            { name: 'totalStaked', type: ABIDataTypes.UINT256 },
            { name: 'prizePool', type: ABIDataTypes.UINT256 },
            { name: 'nftTreasury', type: ABIDataTypes.UINT256 },
            { name: 'currentRaffleId', type: ABIDataTypes.UINT256 },
            { name: 'motoPerBlock', type: ABIDataTypes.UINT256 },
            { name: 'boostActive', type: ABIDataTypes.UINT256 },
            { name: 'milestoneIdx', type: ABIDataTypes.UINT256 },
        ],
        type: BitcoinAbiTypes.Function,
    },
    {
        name: 'getRaffleInfo',
        inputs: [{ name: 'raffleId', type: ABIDataTypes.UINT256 }],
        outputs: [
            { name: 'startBlock', type: ABIDataTypes.UINT256 },
            { name: 'entryCloseBlock', type: ABIDataTypes.UINT256 },
            { name: 'drawBlock', type: ABIDataTypes.UINT256 },
            { name: 'state', type: ABIDataTypes.UINT256 },
            { name: 'participantCount', type: ABIDataTypes.UINT256 },
            { name: 'totalTickets', type: ABIDataTypes.UINT256 },
        ],
        type: BitcoinAbiTypes.Function,
    },
    ...DiamondVaultEvents,
    ...OP_NET_ABI,
];

export default DiamondVaultAbi;
