import { u256 } from '@btc-vision/as-bignum/assembly';
import {
    Blockchain,
    BytesWriter,
    Calldata,
    OP20,
    OP20InitParameters,
} from '@btc-vision/btc-runtime/runtime';

/**
 * Mock MOTO OP20 token for testnet testing.
 * Deployer receives the full supply and can distribute to the vault.
 */
@final
export class MockMoto extends OP20 {
    public constructor() {
        super();
    }

    public override onDeployment(_calldata: Calldata): void {
        const maxSupply: u256 = u256.fromString('21000000000000000000000000'); // 21 M tokens, 18 decimals
        this.instantiate(new OP20InitParameters(maxSupply, 18, 'Mock MOTO', 'MOTO'));
        this._mint(Blockchain.tx.sender, maxSupply);
    }

    // Allow anyone to mint on testnet for testing purposes
    @method({ name: 'amount', type: ABIDataTypes.UINT256 })
    @returns({ name: 'success', type: ABIDataTypes.BOOL })
    public mint(calldata: Calldata): BytesWriter {
        const amount = calldata.readU256();
        this._mint(Blockchain.tx.sender, amount);
        const w = new BytesWriter(1);
        w.writeBoolean(true);
        return w;
    }
}
