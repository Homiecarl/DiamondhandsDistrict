// Contract configuration — update VAULT_ADDRESS after deployment
export const VAULT_ADDRESS = 'opt1sqptf3mawru30g4lj0a426fl72zp35efdwy64gj4m';
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

export const MOCK_MOTO_ADDRESS = 'opt1sqrpjvqh7sqt8z4yfe0terms4atvdydf0uc33v7a2';
export const OPNET_EXPLORER_URL = 'https://explorer.opnet.org/tx/';
