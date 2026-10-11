# FairShare — Blockchain-Based Transparent Expense Splitting System

[![Solidity](https://img.shields.io/badge/Solidity-0.8.20-blue.svg)](https://soliditylang.org/)
[![React](https://img.shields.io/badge/React-19-61dafb.svg)](https://react.dev/)
[![Ethers.js](https://img.shields.io/badge/ethers.js-v6-2535a0.svg)](https://docs.ethers.org/)
[![Vite](https://img.shields.io/badge/Vite-8.3-646cff.svg)](https://vitejs.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

FairShare is a decentralized, tamper-evident expense-sharing dApp designed to simplify group expense management among roommates, project teams, and friends. By utilizing Ethereum-compatible smart contracts, cryptographic document hashing (SHA-256/IPFS), and algorithmic debt simplification (Min-Cash-Flow), FairShare eliminates calculation discrepancies, centralized spreadsheet tampering, and settlement disputes.

---

## 🌟 Key Features

### 1. Group & Permission Management
* **Configurable Consensus Policies:**
  * **Optimistic / Auto-Approve:** Expenses are logged immediately and enter an arbitration window.
  * **Majority Vote:** Requires approval from >50% of participants before ledger adjustment.
  * **Unanimous Vote:** Requires 100% agreement from participants.
  * **Admin-Only:** Designated group admins approve all allocations.
* **Role-Based Membership:** Admins can invite and assign member roles with verified EVM wallet addresses.

### 2. Multi-Party Consensus Blocks & Anti-Cheat Protection
* **Dedicated Verification Blocks:** When an expense is recorded, a cryptographic **Consensus Block** is minted. All split participants are listed with their exact owed share.
* **Agree or Reject Protocol:** Every participant must explicitly cast their vote (`Agree & Sign` or `Reject & Object`).
* **Anti-Cheat Cryptographic PIN Authentication:** On shared devices, users cannot impersonate or sign for others. Every vote requires the user's **Secret Security PIN** (simulating an ECDSA private key signature).
  * Alice (Admin): PIN `1111`
  * Bob: PIN `2222`
  * Charlie: PIN `3333`
  * Dana: PIN `4444`
* **Real-Time Consensus Sealing:** Balances are **only updated** when the required quorum agrees. If an objection is recorded, the block enters a contested state and halts balance adjustment.
* **Non-Deletion Audit Trail:** When an expense is revised, the original record is **never deleted**. An immutable correction link is anchored to the chain, preserving complete transparency.

### 3. Min-Cash-Flow Settlement Engine
* **Graph Simplification Algorithm:** Solves the classic $N$-party debt problem, condensing complex multi-party circular obligations into the theoretical minimum number of direct payments.
* **Dual Settlement Options:**
  1. **Instant On-Chain Crypto Settlement:** Direct atomic transfers of mock stablecoins (**FSUSD**) or native ETH.
  2. **Off-Chain Record & Confirmation:** Payer records cash/Venmo/wire proof; payee acknowledges receipt on-chain to adjust balances.

### 4. Cryptographic Receipt Verification
* **Off-Chain Files, On-Chain Fingerprints:** Receipt PDFs/images are hashed locally with **SHA-256** and mapped to simulated **IPFS CIDs**.
* **Integrity Workbench:** Drop any file into the verifier to prove whether it matches the on-chain hash recorded at block timestamp, catching any doctored invoices.

### 5. Multi-Persona & MetaMask Integration
* Switch instantly between pre-configured personas (**Alice [Admin]**, **Bob**, **Charlie**, **Dana**) or connect an external **MetaMask** wallet.
* Built-in **FSUSD Testnet Faucet** to mint tokens for instant testing.

---

## 🏗️ Architecture & Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Smart Contracts** | Solidity `^0.8.20`, solc, viaIR compiler optimization |
| **Web3 Client** | ethers.js `v6`, Web3 State Provider, Keccak-256 / SHA-256 |
| **Frontend Framework** | React 19, Vite 8, Vanilla CSS Design System |
| **Icons & UI Effects** | Lucide React, Canvas Confetti |
| **Storage Architecture** | On-Chain State + Off-Chain Hashed Documents (IPFS model) |

---

## 🚀 Getting Started

### Prerequisites
* Node.js `v18+` (Tested on Node `v24`)
* npm `v9+`

### Installation
```bash
git clone https://github.com/eshwarchandrams/Blockchain-FairShare.git
cd Blockchain-FairShare
npm install
```

### Compile Solidity Smart Contracts
```bash
npm run compile
```
Compiles `FairShare.sol` and `MockERC20.sol` with `viaIR` optimization and exports contract ABIs and bytecode to `src/contracts/`.

### Verify Smart Contract Interfaces
```bash
npm run test:contracts
```

### Launch Development Server
```bash
npm run dev
```
Open **[http://127.0.0.1:5173/](http://127.0.0.1:5173/)** in your browser.

---

## 📜 Smart Contract Structure (`contracts/FairShare.sol`)

* `createGroup(...)`: Deploys an expense group with a specific approval policy.
* `addMember(...)`: Adds an active member address with `ADMIN` or `MEMBER` privileges.
* `submitExpense(...)`: Submits an expense with title, amount, share breakdown, and receipt hash.
* `approveExpense(...)`: Casts quorum vote; updates ledger balances if consensus is reached.
* `rejectExpense(...)`: Casts rejection vote with an on-chain reason.
* `disputeExpense(...)`: Flags transaction and freezes balance adjustments.
* `resolveDispute(...)`: Administrator upholds or rejects disputed entry with arbitration notes.
* `correctExpense(...)`: Creates an auditable replacement without deleting the original.
* `settleDebtDirect(...)` / `settleDebtNative(...)`: Executes atomic crypto settlements.
* `recordOffChainSettlement(...)` / `confirmOffChainSettlement(...)`: Multi-party off-chain settlement verification.

---

## 📄 License
This project is licensed under the MIT License.
