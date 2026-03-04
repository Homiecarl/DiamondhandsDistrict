// Contract configuration — update VAULT_ADDRESS after deployment
export const VAULT_ADDRESS = 'opt1sqptlzg4xgkam9guk7gqyp8zhhjtt44hsjuxu69sl';
export const OPNET_TESTNET_URL = 'https://testnet.opnet.org';
export const BLOCKS_PER_DAY = 144;

// Fee constants (mirror contract)
export const FEE_BPS = 90; // 0.09%
export const FEE_DENOM = 100_000;

// Milestones in sats
export const MILESTONES = [
    { sats: 10_000_000n, label: '0.10 BTC' },
    { sats: 25_000_000n, label: '0.25 BTC' },
    { sats: 50_000_000n, label: '0.50 BTC' },
    { sats: 100_000_000n, label: '1.00 BTC' },
];

export const SAT_PER_BTC = 100_000_000n;
