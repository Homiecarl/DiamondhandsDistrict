import { Blockchain } from '@btc-vision/btc-runtime/runtime';
import { ProofOfHodl } from './ProofOfHodl';
import { revertOnError } from '@btc-vision/btc-runtime/runtime/abort/abort';

// Factory function — MUST return a new instance, not an assigned instance
Blockchain.contract = (): ProofOfHodl => {
    return new ProofOfHodl();
};

// Required runtime exports
export * from '@btc-vision/btc-runtime/runtime/exports';

// Required abort handler
export function abort(message: string, fileName: string, line: u32, column: u32): void {
    revertOnError(message, fileName, line, column);
}
