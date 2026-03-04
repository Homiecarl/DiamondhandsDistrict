import { networks } from '@btc-vision/bitcoin';

// ─── Network ────────────────────────────────────────────────────────────────
// ALWAYS use opnetTestnet — never `networks.testnet` (that is Testnet4)
export const NETWORK = networks.opnetTestnet;
export const RPC_URL = 'https://testnet.opnet.org';

// ─── Contract ────────────────────────────────────────────────────────────────
// Paste the address printed by `cd deploy && DEPLOYER_WIF=<wif> npx ts-node --esm deploy.ts`
export const PROOF_OF_HODL_ADDRESS =
    'replace_with_deployed_contract_address_after_running_deploy_script';

// ─── Staking tiers ───────────────────────────────────────────────────────────
export interface StakingTier {
    label: string;
    subLabel: string;
    lockBlocks: bigint;
    maxMultiplier: string;
    color: string;
}

export const STAKING_TIERS: StakingTier[] = [
    {
        label: '1 WEEK',
        subLabel: '1,008 blocks',
        lockBlocks: 1_008n,
        maxMultiplier: '2.0×',
        color: '#f7931a',
    },
    {
        label: '2 WEEKS',
        subLabel: '2,016 blocks',
        lockBlocks: 2_016n,
        maxMultiplier: '2.5×',
        color: '#ff6b35',
    },
    {
        label: '1 MONTH',
        subLabel: '4,320 blocks',
        lockBlocks: 4_320n,
        maxMultiplier: '3.0×',
        color: '#e84393',
    },
    {
        label: '2 MONTHS',
        subLabel: '8,640 blocks',
        lockBlocks: 8_640n,
        maxMultiplier: '4.0×',
        color: '#9b59b6',
    },
];
