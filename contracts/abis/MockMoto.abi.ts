import { ABIDataTypes, BitcoinAbiTypes, OP_NET_ABI } from 'opnet';

export const MockMotoEvents = [];

export const MockMotoAbi = [
    {
        name: 'mint',
        inputs: [{ name: 'amount', type: ABIDataTypes.UINT256 }],
        outputs: [{ name: 'success', type: ABIDataTypes.BOOL }],
        type: BitcoinAbiTypes.Function,
    },
    ...MockMotoEvents,
    ...OP_NET_ABI,
];

export default MockMotoAbi;
