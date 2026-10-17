/**
 * Comprehensive Automated Test Suite for FairShare Dispute Arbitration & Split Customization
 */
import { blockchainService, EXPENSE_STATUS, SPLIT_TYPES } from '../src/services/blockchainState.js';

console.log('======================================================================');
console.log('⚖️ FAIRSHARE DISPUTE ARBITRATION & SPLIT REALLOCATION TEST SUITE');
console.log('======================================================================\n');

let total = 0;
let passed = 0;

function assert(condition, testName) {
  total++;
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${testName}`);
    process.exitCode = 1;
  }
}

// Set up clean testing group & members
blockchainService.resetToDefaults();

const adminUser = {
  address: '0x1111111111111111111111111111111111111111',
  name: 'Admin Alice',
  email: 'alice@fairshare.eth',
  role: 'ADMIN',
  provider: 'google',
};

const memberBob = {
  address: '0x2222222222222222222222222222222222222222',
  name: 'Bob Disputed',
  email: 'bob@fairshare.eth',
  role: 'MEMBER',
  provider: 'google',
};

const memberCharlie = {
  address: '0x3333333333333333333333333333333333333333',
  name: 'Charlie New',
  email: 'charlie@fairshare.eth',
  role: 'MEMBER',
  provider: 'google',
};

// Initialize group with Alice (Admin), Bob, and Charlie
blockchainService.groups = [
  {
    id: 1,
    name: 'Public Ledger',
    isPrivate: false,
    ledgerId: 'PUB-101',
    creator: adminUser.address,
    members: [adminUser, memberBob, memberCharlie],
  }
];
blockchainService.expenses = [];
blockchainService.auditLogs = [];
blockchainService.settlements = [];
blockchainService.currentAccount = adminUser.address;
blockchainService.myProfile = { ...adminUser };

// ----------------------------------------------------
// 1. Expense Creation with Flawed Initial Split
// ----------------------------------------------------
console.log('--- 1. Expense Creation with Flawed Initial Split ---');

// Alice pays ₹1,200.00 (120,000 paise) split equally between Alice and Bob (₹600 each)
const initialShares = [
  { participant: adminUser.address, name: adminUser.name, amount: 60000, percentage: 50 },
  { participant: memberBob.address, name: memberBob.name, amount: 60000, percentage: 50 },
];

const expense = {
  id: 101,
  groupId: 1,
  payer: adminUser.address,
  payerName: adminUser.name,
  title: 'Team Dinner',
  totalAmount: 120000,
  splitType: SPLIT_TYPES.EQUAL,
  status: EXPENSE_STATUS.APPROVED,
  shares: initialShares,
  receiptHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
  createdAt: Date.now(),
  approvals: [adminUser.address],
  rejections: [],
};

blockchainService.expenses = [expense];

let balances = blockchainService.calculateGroupBalances(1);
let bobBal = balances.find(b => b.address === memberBob.address)?.netBalance;
let aliceBal = balances.find(b => b.address === adminUser.address)?.netBalance;

assert(bobBal === -60000, 'Initial state: Bob owes ₹600.00 (-60,000 paise)');
assert(aliceBal === 60000, 'Initial state: Alice is owed ₹600.00 (+60,000 paise)');

// ----------------------------------------------------
// 2. Member Bob Raises Dispute
// ----------------------------------------------------
console.log('\n--- 2. Member Bob Raises Dispute ---');

// Bob disputes the charge claiming he was not present
blockchainService.currentAccount = memberBob.address;
blockchainService.myProfile = { ...memberBob };

blockchainService.disputeExpense(1, 101, 'I was absent from this dinner. Charlie attended instead.');

const disputedExp = blockchainService.expenses.find(e => e.id === 101);
assert(disputedExp.status === EXPENSE_STATUS.DISPUTED, 'Expense status updated to DISPUTED (3)');
assert(disputedExp.disputedBy === memberBob.address, 'Dispute records initiator address');

// Check that disputed expense freezes balance effect
balances = blockchainService.calculateGroupBalances(1);
bobBal = balances.find(b => b.address === memberBob.address)?.netBalance;
aliceBal = balances.find(b => b.address === adminUser.address)?.netBalance;
assert(bobBal === 0, 'Dispute freezes ledger balance: Bob balance suspended to ₹0.00');
assert(aliceBal === 0, 'Dispute freezes ledger balance: Alice balance suspended to ₹0.00');

// ----------------------------------------------------
// 3. Unauthorized Member Attempt to Arbitrate
// ----------------------------------------------------
console.log('\n--- 3. Authorization Check ---');

let rejectedUnauthorized = false;
try {
  // Bob tries to resolve his own dispute
  blockchainService.resolveDispute(1, 101, true, 'Self-approving');
} catch {
  rejectedUnauthorized = true;
}
assert(rejectedUnauthorized === true, 'Non-admin member cannot arbitrate dispute (access denied)');

// ----------------------------------------------------
// 4. Admin Arbitrates Dispute with Adjusted Split
// ----------------------------------------------------
console.log('\n--- 4. Admin Arbitrates Dispute with Adjusted Split ---');

// Switch to Admin Alice
blockchainService.currentAccount = adminUser.address;
blockchainService.myProfile = { ...adminUser };

// Admin adjusts split:
// - Removes Bob completely
// - Adds Charlie
// - Sets custom percentages: Alice 40% (₹480), Charlie 60% (₹720)
const adjustedShares = [
  { participant: adminUser.address, name: adminUser.name, amount: 48000, percentage: 40 },
  { participant: memberCharlie.address, name: memberCharlie.name, amount: 72000, percentage: 60 },
];

const resolvedExp = blockchainService.resolveDisputeWithSplit(
  1,
  101,
  {
    shares: adjustedShares,
    splitType: SPLIT_TYPES.PERCENTAGE,
    totalAmount: 120000,
  },
  'Confirmed Bob was absent. Removed Bob and added Charlie with 60% share per meal items.'
);

assert(resolvedExp.status === EXPENSE_STATUS.APPROVED, 'Expense status updated to APPROVED after arbitration');
assert(resolvedExp.shares.length === 2, 'Adjusted split has exactly 2 participants');
assert(!resolvedExp.shares.some(s => s.participant === memberBob.address), 'Bob successfully removed from the split');
assert(resolvedExp.shares.some(s => s.participant === memberCharlie.address), 'Charlie successfully added to the split');
assert(resolvedExp.splitType === SPLIT_TYPES.PERCENTAGE, 'Split type updated to PERCENTAGE');
assert(resolvedExp.disputeResolution?.action === 'ADJUSTED_SPLIT', 'disputeResolution action recorded as ADJUSTED_SPLIT');

// ----------------------------------------------------
// 5. Ledger Balance Verification after Adjusted Arbitration
// ----------------------------------------------------
console.log('\n--- 5. Ledger Balance Verification After Arbitration ---');

balances = blockchainService.calculateGroupBalances(1);
bobBal = balances.find(b => b.address === memberBob.address)?.netBalance;
const charlieBal = balances.find(b => b.address === memberCharlie.address)?.netBalance;
aliceBal = balances.find(b => b.address === adminUser.address)?.netBalance;

assert(bobBal === 0, 'Bob owes ₹0.00 (exempted from expense)');
assert(charlieBal === -72000, 'Charlie owes ₹720.00 (-72,000 paise for 60% share)');
assert(aliceBal === 72000, 'Alice is owed ₹720.00 (+72,000 paise from Charlie)');
assert(charlieBal + aliceBal + bobBal === 0, 'Economic zero-sum balance invariant preserved (+720 - 720 = 0)');

// ----------------------------------------------------
// 6. Audit Trail Logging
// ----------------------------------------------------
console.log('\n--- 6. Audit Trail Logging ---');

const latestLog = blockchainService.auditLogs[0];
assert(latestLog.action === 'DISPUTE_RESOLVED', 'Audit log captures DISPUTE_RESOLVED action');
assert(latestLog.details.includes('adjusted split'), 'Audit log explicitly notes adjusted split');
assert(latestLog.actor === adminUser.address, 'Audit log identifies Admin Alice as arbitrator');

// ----------------------------------------------------
// Summary
// ----------------------------------------------------
console.log('\n======================================================================');
console.log(`🎉 ARBITRATION TEST SUMMARY: ${passed} / ${total} tests passed!`);
console.log('======================================================================\n');
