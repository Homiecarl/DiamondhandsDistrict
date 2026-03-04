# ₿ Proof of HODL

> Bitcoin staking dApp on OPNet testnet — vibecoding competition entry.

Lock Bitcoin in a CSV time-locked P2WSH address and earn HODL tokens.
Your loyalty multiplier grows linearly over the lock period — **the longer you HODL, the more you earn**.

---

## Features

- 🔒 4 lock tiers: 1 week → 2 months (1,008 → 8,640 blocks)
- 📈 Linear loyalty multiplier: 2.0× → 4.0× depending on tier
- 🪙 Live HODL reward counter, updates every ~10s
- 🔐 CSV P2WSH deposits — Bitcoin-native timelock
- ⚡ OPWallet integration (connect, stake, claim, unstake)
- 🎨 Dark Bitcoin-orange UI with glow animations

---

## Stack

| Layer | Tech |
|-------|------|
| Smart contract | AssemblyScript (OPNet btc-runtime) |
| Network | OPNet testnet (`networks.opnetTestnet`) |
| Frontend | React 18 + Vite + TypeScript |
| Wallet | OPWallet via `@btc-vision/walletconnect` |
| Contract interaction | `opnet` SDK (`getContract → simulate → sendTransaction`) |

---

## Quick Start

### 1. Build the contract

```bash
cd contract
npm install
npm run build
# → build/ProofOfHodl.wasm
```

### 2. Deploy to testnet

```bash
cd deploy
npm install
# Get testnet BTC: https://testnet.opnet.org/faucet
export DEPLOYER_WIF=<your-testnet-WIF>
npx ts-node --esm deploy.ts
# ✅ Contract address: bc1p...
```

Paste the printed address into `frontend/src/config/contracts.ts`:
```typescript
export const PROOF_OF_HODL_ADDRESS = 'bc1p...your_address...';
```

### 3. Run the frontend

```bash
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

---

## Contract Methods

| Method | Description |
|--------|-------------|
| `stake(lockBlocks)` | Lock BTC via P2WSH output for the chosen tier |
| `unstake()` | Release stake after lock expires |
| `claimRewards()` | Claim accumulated HODL tokens |
| `getStakeInfo(staker)` | View stake info for any address |
| `getPendingRewards(staker)` | View unclaimed rewards |
| `getTotalStaked()` | Global staked sats |

---

## Reward Formula

```
elapsed        = min(currentBlock − startBlock, lockBlocks)
multiplier     = 1.0 + (elapsed / lockBlocks) × (maxMult − 1.0)
coinBlocks     = stakedSats × elapsed
rewards        = coinBlocks × multiplier / 100,000,000
```

Reward rate: **1 HODL per 100,000,000 sat-blocks** (at 1× multiplier).

---

## Lock Tiers

| Tier | Blocks | Max Multiplier |
|------|--------|---------------|
| 1 week | 1,008 | 2.0× |
| 2 weeks | 2,016 | 2.5× |
| 1 month | 4,320 | 3.0× |
| 2 months | 8,640 | 4.0× |

---

## OPNet Rules Followed

- ✅ `networks.opnetTestnet` (never `networks.testnet`)
- ✅ `signer: null, mldsaSigner: null` in `sendTransaction()`
- ✅ Singleton `JSONRpcProvider` in `StakingService`
- ✅ `getContract → sim → sim.sendTransaction()` pattern
- ✅ Check `sim.revert` (not `sim.error`)
- ✅ `StoredU256` / `AddressMemoryMap` for persistent storage
- ✅ `SafeMath` for all u256 arithmetic
- ✅ `@method(params)` — all ABI params declared
- ✅ `onDeployment()` for storage init (never constructor)
- ✅ No raw PSBT

---

## Project Structure

```
proof-of-hodl/
├── contract/        ← AssemblyScript contract
│   └── src/
│       ├── index.ts
│       └── ProofOfHodl.ts
├── deploy/          ← Deployment script
│   └── deploy.ts
└── frontend/        ← React/Vite UI
    └── src/
        ├── App.tsx
        ├── abi/
        ├── components/
        ├── hooks/
        ├── services/
        └── config/
```

---

*Built for the OPNet vibecoding competition 🏆*
