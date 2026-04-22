# Kwest — Decentralized Task & Reward Platform

A fully onchain task-and-reward platform on **Base Sepolia** where creators post quests with USDC rewards and workers earn by completing them.

---

## Tech Stack

| Layer       | Technology                                 |
|-------------|--------------------------------------------|
| Smart contract | Solidity 0.8.24, Foundry                |
| Frontend    | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| Auth & Wallet | Privy (embedded wallets + social login) |
| Web3 client | Wagmi v2 + viem                           |
| Chain       | Base Sepolia (testnet)                    |
| Payment token | USDC (6 decimals)                       |

---

## Project Structure

```
kwest/
├── contracts/              # Foundry project
│   ├── src/
│   │   ├── Kwest.sol           # Main contract
│   │   ├── MockUSDC.sol        # Test ERC20
│   │   ├── interfaces/
│   │   │   └── IERC20.sol
│   │   └── utils/
│   │       ├── Ownable.sol
│   │       └── ReentrancyGuard.sol
│   ├── script/
│   │   └── DeployKwest.s.sol   # Deployment script
│   ├── test/
│   │   └── Kwest.t.sol         # Tests
│   └── foundry.toml
└── frontend/               # Next.js app
    ├── src/
    │   ├── app/                # Pages (App Router)
    │   ├── components/         # UI + layout + web3 components
    │   ├── hooks/              # useKwest.ts (all contract hooks)
    │   ├── lib/                # ABI, contracts config, utils
    │   └── types/              # TypeScript types
    └── package.json
```

---

## Prerequisites

Install these before you start:

- **Node.js** ≥ 18 — https://nodejs.org
- **Foundry** — https://getfoundry.sh
- A wallet with **Base Sepolia ETH** (for gas)
- A **Privy** account — https://privy.io

---

## Part 1 — Smart Contract Setup

### 1. Install Foundry

```bash
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

### 2. Navigate to contracts directory

```bash
cd kwest/contracts
```

### 3. Install Foundry dependencies (forge-std)

```bash
forge install foundry-rs/forge-std --no-commit
```

### 4. Create your `.env` file

```bash
cp .env.example .env   # or create manually
```

Edit `.env`:

```env
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
BASESCAN_API_KEY=your_basescan_api_key_here
PRIVATE_KEY=your_deployer_private_key_here

# Set to true to deploy MockUSDC (recommended for first testnet run)
DEPLOY_MOCK_USDC=true

# OR set a specific USDC address (Base Sepolia official USDC):
# USDC_ADDRESS=0x036CbD53842c5426634e7929541eC2318f3dCF7e
```

> **Security:** Never commit your `.env`. It's already in `.gitignore`.

### 5. Run tests

```bash
forge test -vvv
```

All 8 tests should pass.

### 6. Get Base Sepolia ETH

Get free testnet ETH from:
- https://www.alchemy.com/faucets/base-sepolia
- https://faucet.quicknode.com/base/sepolia
- https://docs.base.org/base-chain/network-information/network-faucets

### 7. Import your deployer wallet to Foundry keystore

```bash
cast wallet import deployer --interactive
# Enter private key when prompted, then set a password
```

### 8. Deploy contracts

```bash
source .env

forge script script/DeployKwest.s.sol:DeployKwest \
  --rpc-url $BASE_SEPOLIA_RPC_URL \
  --account deployer \
  --broadcast \
  -vvvv
```

> The script will print the deployed addresses. Copy them — you need them for the frontend.

### 9. Verify on Basescan (optional but recommended)

```bash
forge script script/DeployKwest.s.sol:DeployKwest \
  --rpc-url $BASE_SEPOLIA_RPC_URL \
  --account deployer \
  --broadcast \
  --verify \
  --etherscan-api-key $BASESCAN_API_KEY \
  -vvvv
```

Get a Basescan API key at: https://basescan.org/myapikey

---

## Part 2 — Frontend Setup

### 1. Navigate to frontend directory

```bash
cd kwest/frontend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Create Privy app

1. Go to https://dashboard.privy.io
2. Create a new app
3. Under **Allowed Origins**, add `http://localhost:3000`
4. Under **Login Methods**, enable: Email, Google, Wallet
5. Under **Embedded Wallets**, enable "Create on login"
6. Copy your **App ID**

### 4. Create your `.env.local`

```bash
cp .env.example .env.local
```

Edit `.env.local` with your actual values:

```env
NEXT_PUBLIC_PRIVY_APP_ID=clxxxxxxxxxxxxxxxxxxxx

# Paste the addresses printed by the deploy script:
NEXT_PUBLIC_KWEST_ADDRESS=0xYourKwestContractAddress
NEXT_PUBLIC_USDC_ADDRESS=0xYourUSDCAddress

NEXT_PUBLIC_CHAIN_ID=84532
NEXT_PUBLIC_RPC_URL=https://sepolia.base.org
```

### 5. Run the development server

```bash
npm run dev
```

Open http://localhost:3000 in your browser.

---

## Part 3 — Get Testnet USDC

### Option A: Use MockUSDC (if you deployed it)

The deploy script mints 10,000 USDC to your deployer address. To mint to any other address, call the `mint` function directly:

```bash
cast send $USDC_ADDRESS "mint(address,uint256)" \
  YOUR_WALLET_ADDRESS 10000000000 \
  --rpc-url $BASE_SEPOLIA_RPC_URL \
  --account deployer
```

(`10000000000` = 10,000 USDC with 6 decimals)

### Option B: Use official Base Sepolia USDC

Address: `0x036CbD53842c5426634e7929541eC2318f3dCF7e`

Get it from Circle's faucet: https://faucet.circle.com (select Base Sepolia)

---

## Part 4 — Using the Platform

### As a Creator

1. **Sign in** at `/auth`
2. Go to **Create Quest** in the sidebar
3. Fill in: title, description, proof requirements, proof type, reward per slot, number of slots, optional deadline
4. Choose fee mode:
   - **Top-up** — you pay reward pool + 2% fee on top. Workers receive the full per-slot amount.
   - **Deduct** — you pay the reward amount; 2% is taken from it. Workers get slightly less.
5. Click **Approve USDC** first (one-time ERC20 approval)
6. Then click **Create Quest & Lock Funds** — USDC is locked in the contract
7. Go to **Validate** to review and approve/reject worker submissions

### As a Worker

1. **Sign in** at `/auth`
2. Go to **Browse Quests**
3. Find an active quest with open slots
4. Click a quest → click **Submit Proof**
5. Enter your proof (text, URL, or IPFS hash depending on quest type)
6. Submit — your proof is stored onchain
7. When the creator approves, go to **Claim Rewards** and click **Claim USDC**

### Anti-Griefing System

Creators can reject a maximum of `totalSlots × 3` submissions per quest. Once this limit is hit, they **cannot reject any more** — this prevents creators from rejecting valid submissions to avoid paying rewards.

---

## Part 5 — Contract Interaction via CLI

You can also interact with the contract using `cast`:

### Read a task
```bash
cast call $KWEST_ADDRESS "getTask(uint256)" 1 \
  --rpc-url $BASE_SEPOLIA_RPC_URL
```

### Check accumulated fees (as owner)
```bash
cast call $KWEST_ADDRESS "accumulatedFees()(uint256)" \
  --rpc-url $BASE_SEPOLIA_RPC_URL
```

### Withdraw fees (as owner)
```bash
cast send $KWEST_ADDRESS "withdrawFees(address)" $YOUR_ADDRESS \
  --rpc-url $BASE_SEPOLIA_RPC_URL \
  --account deployer
```

---

## Part 6 — Production Deployment

To deploy the frontend to Vercel:

1. Push your code to GitHub
2. Import the repo in https://vercel.com
3. Set the **Root Directory** to `frontend`
4. Add all `NEXT_PUBLIC_*` environment variables in Vercel dashboard
5. Deploy

For Privy, update the allowed origins to include your Vercel domain.

---

## Contract Addresses (after your deployment)

Fill these in after deploying:

| Contract   | Address |
|------------|---------|
| Kwest      | `_____________` |
| USDC       | `_____________` |

---

## Key Design Decisions

### Fee System
- 2% fee on every quest creation
- Two modes: pay on top (creator absorbs fee) or deduct from pool (workers absorb fee)
- Fees accumulate in the contract; only the owner can withdraw

### Anti-Griefing
- `REJECTION_MULTIPLIER = 3`: creators can reject up to `slots × 3` subs
- After limit: `rejectSubmission` reverts
- Prevents "infinite rejecting" to avoid paying workers

### Pull Payment Pattern
- Rewards are NOT pushed to workers on approval
- Workers must call `claimReward()` to pull their USDC
- Prevents reentrancy and gas issues from pushing to unknown addresses

### Partial Fills & Refunds
- If a quest is cancelled with unfilled slots, creator gets the unused pool back
- Already-approved (but unclaimed) slot funds remain in contract for workers to claim
- Cannot cancel with pending (unreviewed) submissions — must review first

### Proof Validation
- Onchain format checks prevent garbage submissions:
  - Text: minimum 10 characters
  - Link: must start with `http`
  - IPFS: must be valid CIDv0 (`Qm…`) or CIDv1 (`bafy…`)

---

## Troubleshooting

**"User rejected transaction"** — Wallet popup was dismissed. Try again.

**"insufficient funds"** — You need more Base Sepolia ETH for gas. Use a faucet.

**"TransferFailed"** — Not enough USDC in your wallet, or allowance not set.

**"rejection limit reached"** — Anti-griefing kicked in. You must approve the remaining submissions.

**Privy login fails** — Check your `NEXT_PUBLIC_PRIVY_APP_ID` and that `localhost:3000` is in allowed origins.

**Contract not found** — Double-check `NEXT_PUBLIC_KWEST_ADDRESS` in `.env.local`.

---

## License

MIT
